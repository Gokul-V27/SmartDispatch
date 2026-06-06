/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

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
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private enableLogging: boolean;
  private authToken: string | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:8080/api';
    this.timeout = config.timeout || 10000; // 10 seconds default
    this.enableLogging = config.enableLogging || false;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.defaultHeaders,
    };
  }

  /**
   * Set JWT authentication token for API requests
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (this.enableLogging) {
      console.log('ApiClient: Auth token', token ? 'set' : 'cleared');
    }
  }

  /**
   * Get current authentication token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.setAuthToken(null);
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
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
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
        responseData = await response.json();
      }
    } catch (parseError) {
      // If JSON parsing fails, create error response
      responseData = {
        success: false,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'Invalid JSON response from server',
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

    // Return standardized response format
    return responseData || {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Make HTTP request with comprehensive error handling
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
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal,
    };

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }

    if (this.enableLogging) {
      console.log(`ApiClient: ${method} ${url}`, { data, headers: Object.keys(headers) });
    }

    try {
      const response = await fetch(url, fetchOptions);
      const result = await this.parseResponse<T>(response);
      
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
    const headers = this.buildHeaders(options?.headers);
    
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

    if (this.enableLogging) {
      console.log(`ApiClient: POST ${url} - File upload`, { filename: file.name, size: file.size });
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal,
      });

      const result = await this.parseResponse<T>(response);
      
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
      await this.get('/health', { timeout: 5000 });
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
}

// Create and export a default instance
export const apiClient = new ApiClient({
  baseUrl: 'http://localhost:8080/api',
  enableLogging: process.env.NODE_ENV === 'development',
});

// Export default instance as default export
export default apiClient;