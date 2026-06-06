/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './apiClient';
import { tokenStorage } from './tokenStorage';
import type { 
  LoginCredentials, 
  PinLoginCredentials, 
  LoginResponse, 
  LogoutResponse, 
  User,
  ApiResponse 
} from '../types/api';

/**
 * Authentication service for handling login, logout, and user management
 */
export class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiClient.post<LoginResponse['data']>('/auth/login', credentials, {
        skipAuth: true // Don't include auth token for login
      });

      if (response.success && response.data) {
        console.log("LOGIN RESPONSE DATA:", response.data);
        
        // The backend returns { token: "...", user: {...} }
        const data = response.data as any;
        const user = data.user;
        const accessToken = data.token || data.accessToken;
        const refreshToken = data.refreshToken;
        const expiresIn = data.expiresIn;
        
        console.log("EXTRACTED TOKEN:", accessToken);
        
        // Store tokens using the API client
        apiClient.setAuthToken(accessToken, refreshToken, expiresIn);
        
        return user;
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('AuthService: Login failed', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Login with worker ID and PIN (for packers)
   */
  async pinLogin(credentials: PinLoginCredentials): Promise<User> {
    try {
      const response = await apiClient.post<LoginResponse['data']>('/auth/pin-login', credentials, {
        skipAuth: true
      });

      if (response.success && response.data) {
        const data = response.data as any;
        const user = data.user;
        const accessToken = data.token || data.accessToken;
        const refreshToken = data.refreshToken;
        const expiresIn = data.expiresIn;
        
        // Store tokens
        apiClient.setAuthToken(accessToken, refreshToken, expiresIn);
        
        return user;
      } else {
        throw new Error(response.error?.message || 'PIN login failed');
      }
    } catch (error: any) {
      console.error('AuthService: PIN login failed', error);
      throw new Error(error.message || 'PIN login failed');
    }
  }

  /**
   * Logout user and clear session
   */
  async logout(): Promise<void> {
    try {
      // Attempt to call logout endpoint if we have a token
      const hasToken = apiClient.isAuthenticated();
      if (hasToken) {
        try {
          await apiClient.post<LogoutResponse>('/auth/logout', {}, {
            timeout: 5000 // Short timeout for logout
          });
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('AuthService: Logout API call failed, continuing with local logout', error);
        }
      }
    } finally {
      // Always clear local tokens and session
      apiClient.clearAuthToken();
    }
  }

  /**
   * Get current authenticated user information
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get current user');
      }
    } catch (error: any) {
      console.error('AuthService: Failed to get current user', error);
      
      // If unauthorized, clear tokens
      if (error.statusCode === 401) {
        apiClient.clearAuthToken();
      }
      
      throw new Error(error.message || 'Failed to get current user');
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return apiClient.getAuthToken();
  }

  /**
   * Refresh authentication token manually
   */
  async refreshToken(): Promise<void> {
    try {
      await apiClient.refreshToken();
    } catch (error: any) {
      console.error('AuthService: Token refresh failed', error);
      // Clear tokens if refresh fails
      apiClient.clearAuthToken();
      throw error;
    }
  }

  /**
   * Get token information
   */
  getTokenInfo(): {
    hasToken: boolean;
    isValid: boolean;
    expiresIn: number;
    expiresAt?: Date;
  } {
    return apiClient.getTokenInfo();
  }

  /**
   * Check if current user has specific role
   */
  async hasRole(role: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user.role === role;
    } catch {
      return false;
    }
  }

  /**
   * Check if current user is supervisor or admin
   */
  async canManageWorkers(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user.role === 'SUPERVISOR' || user.role === 'ADMIN';
    } catch {
      return false;
    }
  }

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    return this.hasRole('ADMIN');
  }

  /**
   * Check if current user is supervisor
   */
  async isSupervisor(): Promise<boolean> {
    return this.hasRole('SUPERVISOR');
  }

  /**
   * Check if current user is packer
   */
  async isPacker(): Promise<boolean> {
    return this.hasRole('PACKER');
  }

  /**
   * Validate session and refresh if needed
   */
  async validateSession(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }

      // Check if token is expired
      const tokenInfo = this.getTokenInfo();
      if (!tokenInfo.isValid) {
        // Try to refresh token
        try {
          await this.refreshToken();
          return true;
        } catch {
          return false;
        }
      }

      // Verify with server
      await this.getCurrentUser();
      return true;
    } catch (error) {
      console.warn('AuthService: Session validation failed', error);
      return false;
    }
  }

  /**
   * Clear all authentication data (useful for testing or forced logout)
   */
  clearAuth(): void {
    apiClient.clearAuthToken();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;