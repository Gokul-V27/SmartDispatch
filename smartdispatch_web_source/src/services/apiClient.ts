/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { tokenStorage, TokenData } from './tokenStorage';

/**
 * HTTP methods supported by the API client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * API client configuration options
 */
export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  enableLogging?: boolean;
  enableAutoRefresh?: boolean;
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

/**
 * Token refresh response interface
 */
export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (url: string, options: RequestInit) => RequestInit | Promise<RequestInit>;

/**
 * Response interceptor function type
 */
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

/**
 * Custom API error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if error is a network-related issue
   */
  get isNetworkError(): boolean {
    return this.statusCode === 0 || this.code === 'NETWORK_ERROR';
  }

  /**
   * Check if error is due to timeout
   */
  get isTimeout(): boolean {
    return this.code === 'TIMEOUT_ERROR';
  }

  /**
   * Check if error is a server error (5xx)
   */
  get isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  /**
   * Check if error is a client error (4xx)
   */
  get isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}

/**
 * Main API Client class for handling HTTP requests to the SmartDispatch backend
 * Enhanced with request/response interceptors and automatic JWT token handling
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private enableLogging: boolean;
  private enableAutoRefresh: boolean;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;
  private pendingRequests: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    retry: () => Promise<any>;
  }> = [];

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || '/api';
    this.timeout = config.timeout || 10000; // 10 seconds default
    this.enableLogging = config.enableLogging || false;
    this.enableAutoRefresh = config.enableAutoRefresh ?? true;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.defaultHeaders,
    };

    // Setup default interceptors
    this.setupDefaultInterceptors();
  }

  /**
   * Setup default request and response interceptors
   */
  private setupDefaultInterceptors(): void {
    // Request interceptor for JWT tokens
    this.addRequestInterceptor(async (url: string, options: RequestInit) => {
      // Skip auth for login/refresh endpoints
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/pin-login');
      const skipAuth = (options as any).__skipAuth;
      
      if (!isAuthEndpoint && !skipAuth) {
        const token = tokenStorage.getAccessToken();
        if (token) {
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${token}`);
          return { ...options, headers };
        }
      }
      return options;
    });

    // Response interceptor for token refresh
    this.addResponseInterceptor(async (response: Response) => {
      // Handle 401 responses for automatic token refresh
      if (response.status === 401 && this.enableAutoRefresh) {
        const url = response.url;
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/pin-login');
        
        if (!isAuthEndpoint) {
          await this.handleTokenRefresh();
          
          // Don't modify the original response, let the request be retried
          return response;
        }
      }

      // Handle 403 - clear tokens as they might be invalid
      if (response.status === 403) {
        const url = response.url;
        const isAuthEndpoint = url.includes('/auth/');
        
        if (!isAuthEndpoint) {
          this.clearAuthToken();
          // Redirect to login if we have a way to do it
          if (typeof window !== 'undefined' && window.location) {
            window.location.href = '/login';
          }
        }
      }

      return response;
    });
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Remove all interceptors
   */
  clearInterceptors(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.setupDefaultInterceptors();
  }

  /**
   * Set JWT authentication token and refresh token
   */
  setAuthToken(accessToken: string, refreshToken?: string, expiresIn?: number): void {
    const tokenData = tokenStorage.createTokenData(accessToken, refreshToken, expiresIn);
    tokenStorage.setTokenData(tokenData);
    
    if (this.enableLogging) {
      console.log('ApiClient: Auth token set, expires at:', new Date(tokenData.expiresAt));
    }
  }

  /**
   * Set token data directly
   */
  setTokenData(tokenData: TokenData): void {
    tokenStorage.setTokenData(tokenData);
    
    if (this.enableLogging) {
      console.log('ApiClient: Token data set, expires at:', new Date(tokenData.expiresAt));
    }
  }

  /**
   * Get current authentication token
   */
  getAuthToken(): string | null {
    return tokenStorage.getAccessToken();
  }

  /**
   * Check if user is authenticated with valid token
   */
  isAuthenticated(): boolean {
    return tokenStorage.hasValidToken();
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    tokenStorage.clearTokenData();
    if (this.enableLogging) {
      console.log('ApiClient: Auth token cleared');
    }
  }

  /**
   * Handle automatic token refresh
   */
  private async handleTokenRefresh(): Promise<void> {
    // If already refreshing, wait for the existing refresh
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError(401, 'NO_REFRESH_TOKEN', 'No refresh token available');
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      await this.refreshPromise;
      
      // Resolve all pending requests
      const requests = [...this.pendingRequests];
      this.pendingRequests = [];
      
      for (const request of requests) {
        try {
          const result = await request.retry();
          request.resolve(result);
        } catch (error) {
          request.reject(error);
        }
      }
    } catch (error) {
      // Reject all pending requests
      const requests = [...this.pendingRequests];
      this.pendingRequests = [];
      
      for (const request of requests) {
        request.reject(error);
      }
      
      // Clear tokens and redirect to login
      this.clearAuthToken();
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(refreshToken: string): Promise<void> {
    if (this.enableLogging) {
      console.log('ApiClient: Refreshing token');
    }

    try {
      const response = await fetch(this.buildUrl('auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new ApiError(response.status, 'TOKEN_REFRESH_FAILED', 'Failed to refresh token');
      }

      const data: TokenRefreshResponse = await response.json();
      this.setAuthToken(data.accessToken, data.refreshToken, data.expiresIn);

      if (this.enableLogging) {
        console.log('ApiClient: Token refreshed successfully');
      }
    } catch (error) {
      if (this.enableLogging) {
        console.error('ApiClient: Token refresh failed', error);
      }
      throw new ApiError(401, 'TOKEN_REFRESH_FAILED', 'Failed to refresh authentication token');
    }
  }

  /**
   * Build complete URL from endpoint
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    // Ensure baseUrl doesn't end with slash to avoid double slashes
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    return `${cleanBaseUrl}/${cleanEndpoint}`;
  }

  /**
   * Build headers for request including auth token if available
   */
  private buildHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    return { ...this.defaultHeaders, ...customHeaders };
  }

  /**
   * Apply request interceptors to the request options
   */
  private async applyRequestInterceptors(url: string, options: RequestInit): Promise<RequestInit> {
    let modifiedOptions = options;
    
    for (const interceptor of this.requestInterceptors) {
      try {
        modifiedOptions = await interceptor(url, modifiedOptions);
      } catch (error) {
        if (this.enableLogging) {
          console.warn('ApiClient: Request interceptor error', error);
        }
        // Continue with unmodified options if interceptor fails
      }
    }
    
    return modifiedOptions;
  }

  /**
   * Apply response interceptors to the response
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      try {
        modifiedResponse = await interceptor(modifiedResponse);
      } catch (error) {
        if (this.enableLogging) {
          console.warn('ApiClient: Response interceptor error', error);
        }
        // Continue with unmodified response if interceptor fails
      }
    }
    
    return modifiedResponse;
  }

  /**
   * Create AbortController for request timeout
   */
  private createTimeoutController(timeout: number): AbortController {
    const controller = new AbortController();
    setTimeout(() => {
      controller.abort();
    }, timeout);
    return controller;
  }

  /**
   * Parse response and handle errors
   */
  private async parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let responseData: any;
    
    try {
      // Check if response has content
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      if (contentLength === '0' || (!contentType?.includes('application/json') && response.status === 204)) {
        // No content response (like 204 No Content)
        responseData = null;
      } else {
        const rawText = await response.text();
        try {
          responseData = rawText ? JSON.parse(rawText) : null;
        } catch (e) {
          throw new Error(`JSON parse failed. Raw text: <<<${rawText.substring(0, 200)}>>>`);
        }
      }
    } catch (parseError: any) {
      // If JSON parsing fails, create error response
      responseData = {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: parseError?.message || 'Invalid JSON response from server',
          details: parseError,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Handle HTTP error status codes
    if (!response.ok) {
      const errorData = responseData?.error || {
        code: `HTTP_${response.status}`,
        message: response.statusText || 'Request failed',
      };

      throw new ApiError(
        response.status,
        errorData.code,
        errorData.message,
        errorData.details
      );
    }

    // Check if response is already in the standardized format
    if (responseData && typeof responseData === 'object' && 'success' in responseData && ('data' in responseData || 'error' in responseData)) {
      return responseData;
    }

    // Return standardized response format wrapping the raw data
    return {
      success: true,
      data: responseData !== undefined ? responseData : null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Make HTTP request with comprehensive error handling and interceptors
   */
  private async makeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(options.headers);
    const requestTimeout = options.timeout || this.timeout;

    // Create timeout controller unless custom signal is provided
    const timeoutController = options.signal ? null : this.createTimeoutController(requestTimeout);
    const signal = options.signal || timeoutController?.signal;

    // Build fetch options
    let fetchOptions: RequestInit = {
      method,
      headers,
      signal,
    };

    // Add special flags for interceptors
    if (options.skipAuth) {
      (fetchOptions as any).__skipAuth = true;
    }

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }

    // Apply request interceptors
    try {
      fetchOptions = await this.applyRequestInterceptors(url, fetchOptions);
    } catch (error) {
      if (this.enableLogging) {
        console.error('ApiClient: Request interceptor failed', error);
      }
      throw new ApiError(0, 'INTERCEPTOR_ERROR', 'Request interceptor failed');
    }

    if (this.enableLogging) {
      console.log(`ApiClient: ${method} ${url}`, { data, headers: Object.keys(fetchOptions.headers || {}) });
    }

    try {
      const response = await fetch(url, fetchOptions);
      
      // Apply response interceptors
      let interceptedResponse: Response;
      try {
        interceptedResponse = await this.applyResponseInterceptors(response);
      } catch (error) {
        if (this.enableLogging) {
          console.error('ApiClient: Response interceptor failed', error);
        }
        // Use original response if interceptor fails
        interceptedResponse = response;
      }

      // Check if we need to retry due to token refresh
      if (interceptedResponse.status === 401 && !options.skipRefresh && this.enableAutoRefresh) {
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/pin-login');
        
        if (!isAuthEndpoint) {
          // If we're currently refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.pendingRequests.push({
                resolve,
                reject,
                retry: () => this.makeRequest<T>(method, endpoint, data, { ...options, skipRefresh: true })
              });
            });
          } else {
            // Attempt token refresh and retry
            try {
              await this.handleTokenRefresh();
              return this.makeRequest<T>(method, endpoint, data, { ...options, skipRefresh: true });
            } catch (refreshError) {
              // Token refresh failed, proceed with original 401 response
              if (this.enableLogging) {
                console.error('ApiClient: Token refresh failed, proceeding with 401', refreshError);
              }
            }
          }
        }
      }

      const result = await this.parseResponse<T>(interceptedResponse);
      
      if (this.enableLogging) {
        console.log(`ApiClient: ${method} ${url} - Success`, result);
      }
      
      return result;
    } catch (error) {
      if (this.enableLogging) {
        console.error(`ApiClient: ${method} ${url} - Error`, error);
      }

      // Handle AbortError (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(0, 'TIMEOUT_ERROR', `Request timeout after ${requestTimeout}ms`);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, 'NETWORK_ERROR', 'Network connection failed');
      }

      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle unexpected errors
      throw new ApiError(
        0,
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'An unexpected error occurred',
        error
      );
    }
  }

  /**
   * Perform GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('GET', endpoint, undefined, options);
  }

  /**
   * Perform POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('POST', endpoint, data, options);
  }

  /**
   * Perform PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PUT', endpoint, data, options);
  }

  /**
   * Perform PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('PATCH', endpoint, data, options);
  }

  /**
   * Perform DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.makeRequest<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Upload file with form data
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    let headers = this.buildHeaders(options?.headers);
    
    // Remove Content-Type header to let browser set it with boundary
    delete headers['Content-Type'];

    const formData = new FormData();
    formData.append('file', file);

    // Add additional form data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const requestTimeout = options?.timeout || this.timeout;
    const timeoutController = options?.signal ? null : this.createTimeoutController(requestTimeout);
    const signal = options?.signal || timeoutController?.signal;

    // Build fetch options
    let fetchOptions: RequestInit = {
      method: 'POST',
      headers,
      body: formData,
      signal,
    };

    // Add special flags for interceptors
    if (options?.skipAuth) {
      (fetchOptions as any).__skipAuth = true;
    }

    // Apply request interceptors
    try {
      fetchOptions = await this.applyRequestInterceptors(url, fetchOptions);
    } catch (error) {
      if (this.enableLogging) {
        console.error('ApiClient: Upload request interceptor failed', error);
      }
      throw new ApiError(0, 'INTERCEPTOR_ERROR', 'Upload request interceptor failed');
    }

    if (this.enableLogging) {
      console.log(`ApiClient: POST ${url} - File upload`, { filename: file.name, size: file.size });
    }

    try {
      const response = await fetch(url, fetchOptions);

      // Apply response interceptors
      let interceptedResponse: Response;
      try {
        interceptedResponse = await this.applyResponseInterceptors(response);
      } catch (error) {
        if (this.enableLogging) {
          console.error('ApiClient: Upload response interceptor failed', error);
        }
        interceptedResponse = response;
      }

      // Handle 401 for file uploads with token refresh
      if (interceptedResponse.status === 401 && !options?.skipRefresh && this.enableAutoRefresh) {
        const isAuthEndpoint = url.includes('/auth/');
        
        if (!isAuthEndpoint) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.pendingRequests.push({
                resolve,
                reject,
                retry: () => this.uploadFile<T>(endpoint, file, additionalData, { ...options, skipRefresh: true })
              });
            });
          } else {
            try {
              await this.handleTokenRefresh();
              return this.uploadFile<T>(endpoint, file, additionalData, { ...options, skipRefresh: true });
            } catch (refreshError) {
              if (this.enableLogging) {
                console.error('ApiClient: File upload token refresh failed', refreshError);
              }
            }
          }
        }
      }

      const result = await this.parseResponse<T>(interceptedResponse);
      
      if (this.enableLogging) {
        console.log(`ApiClient: POST ${url} - Upload success`, result);
      }
      
      return result;
    } catch (error) {
      if (this.enableLogging) {
        console.error(`ApiClient: POST ${url} - Upload error`, error);
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(0, 'TIMEOUT_ERROR', `File upload timeout after ${requestTimeout}ms`);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, 'NETWORK_ERROR', 'Network connection failed during upload');
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        0,
        'UPLOAD_ERROR',
        error instanceof Error ? error.message : 'File upload failed',
        error
      );
    }
  }

  /**
   * Check if API is healthy/reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: 5000, skipAuth: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Update base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    if (this.enableLogging) {
      console.log('ApiClient: Base URL updated to', this.baseUrl);
    }
  }

  /**
   * Enable or disable request logging
   */
  setLogging(enabled: boolean): void {
    this.enableLogging = enabled;
  }

  /**
   * Update default timeout
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  /**
   * Enable or disable automatic token refresh
   */
  setAutoRefresh(enabled: boolean): void {
    this.enableAutoRefresh = enabled;
  }

  /**
   * Get token expiry information
   */
  getTokenInfo(): {
    hasToken: boolean;
    isValid: boolean;
    expiresIn: number; // milliseconds
    expiresAt?: Date;
  } {
    const tokenData = tokenStorage.getTokenData();
    return {
      hasToken: !!tokenData?.accessToken,
      isValid: tokenStorage.hasValidToken(),
      expiresIn: tokenStorage.getTimeToExpiry(),
      expiresAt: tokenData ? new Date(tokenData.expiresAt) : undefined
    };
  }

  /**
   * Manually trigger token refresh
   */
  async refreshToken(): Promise<void> {
    if (!tokenStorage.getRefreshToken()) {
      throw new ApiError(401, 'NO_REFRESH_TOKEN', 'No refresh token available for manual refresh');
    }
    
    await this.handleTokenRefresh();
  }
}

// Create and export a default instance
export const apiClient = new ApiClient({
  baseUrl: '/api',
  enableLogging: process.env.NODE_ENV === 'development',
  enableAutoRefresh: true,
});

// Export default instance as default export
export default apiClient;