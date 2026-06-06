/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient, ApiError } from '../apiClient';
import { tokenStorage } from '../tokenStorage';

// Mock tokenStorage
vi.mock('../tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    hasValidToken: vi.fn(),
    clearTokenData: vi.fn(),
    setTokenData: vi.fn(),
    createTokenData: vi.fn(),
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('ApiClient with JWT Token Handling', () => {
  let apiClient: ApiClient;
  const mockFetch = global.fetch as any;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseUrl: 'http://localhost:8080/api',
      enableLogging: false,
      enableAutoRefresh: true
    });
    
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  describe('Request Interceptors', () => {
    it('should add Authorization header when token is available', async () => {
      // Setup
      (tokenStorage.getAccessToken as any).mockReturnValue('test-token');
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: 'test' })));

      // Execute
      await apiClient.get('/test');

      // Verify
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should skip Authorization header for auth endpoints', async () => {
      // Setup
      (tokenStorage.getAccessToken as any).mockReturnValue('test-token');
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: 'test' })));

      // Execute
      await apiClient.post('/auth/login', { email: 'test@example.com', password: 'password' });

      // Verify
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/login',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });

    it('should skip Authorization header when skipAuth is true', async () => {
      // Setup
      (tokenStorage.getAccessToken as any).mockReturnValue('test-token');
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: 'test' })));

      // Execute
      await apiClient.get('/test', { skipAuth: true });

      // Verify
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  describe('Response Interceptors', () => {
    it('should handle 401 response and attempt token refresh', async () => {
      // Setup
      (tokenStorage.getRefreshToken as any).mockReturnValue('refresh-token');
      (tokenStorage.createTokenData as any).mockReturnValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer'
      });

      // First call returns 401
      mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
      
      // Token refresh call
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600
        }))
      );
      
      // Retry call succeeds
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: 'test' })));

      // Execute
      const result = await apiClient.get('/protected');

      // Verify
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(tokenStorage.setTokenData).toHaveBeenCalled();
    });

    it('should clear tokens on 403 response', async () => {
      // Setup
      mockFetch.mockResolvedValueOnce(new Response('Forbidden', { status: 403 }));

      // Execute & Verify
      await expect(apiClient.get('/protected')).rejects.toThrow();
      expect(tokenStorage.clearTokenData).toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    it('should set auth token correctly', () => {
      // Setup
      (tokenStorage.createTokenData as jest.Mock).mockReturnValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer'
      });

      // Execute
      apiClient.setAuthToken('test-token', 'refresh-token', 3600);

      // Verify
      expect(tokenStorage.createTokenData).toHaveBeenCalledWith('test-token', 'refresh-token', 3600);
      expect(tokenStorage.setTokenData).toHaveBeenCalled();
    });

    it('should check authentication status', () => {
      // Setup
      (tokenStorage.hasValidToken as jest.Mock).mockReturnValue(true);

      // Execute
      const isAuth = apiClient.isAuthenticated();

      // Verify
      expect(isAuth).toBe(true);
      expect(tokenStorage.hasValidToken).toHaveBeenCalled();
    });

    it('should clear auth token', () => {
      // Execute
      apiClient.clearAuthToken();

      // Verify
      expect(tokenStorage.clearTokenData).toHaveBeenCalled();
    });
  });

  describe('Custom Interceptors', () => {
    it('should allow adding custom request interceptors', async () => {
      // Setup
      const customInterceptor = jest.fn((url, options) => ({
        ...options,
        headers: { ...options.headers, 'Custom-Header': 'test-value' }
      }));
      
      apiClient.addRequestInterceptor(customInterceptor);
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: 'test' })));

      // Execute
      await apiClient.get('/test');

      // Verify
      expect(customInterceptor).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'test-value'
          })
        })
      );
    });

    it('should allow adding custom response interceptors', async () => {
      // Setup
      const customInterceptor = jest.fn((response) => response);
      apiClient.addResponseInterceptor(customInterceptor);
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: 'test' })));

      // Execute
      await apiClient.get('/test');

      // Verify
      expect(customInterceptor).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Setup
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      // Execute & Verify
      await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
    });

    it('should handle timeout errors', async () => {
      // Setup
      mockFetch.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));

      // Execute & Verify
      await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
    });
  });
});

export {};