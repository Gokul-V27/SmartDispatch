import type { 
  ApiResponse, 
  ApiError, 
  RequestOptions, 
  AuthResponse, 
  LoginCredentials, 
  PinLoginCredentials 
} from '../types/api'

// Token storage keys
const TOKEN_KEY = 'sd_token'
const REFRESH_TOKEN_KEY = 'sd_refresh_token'
const USER_KEY = 'sd_user'

// Request interceptor type
type RequestInterceptor = (config: RequestInit & { url: string }) => RequestInit & { url: string }

// Response interceptor type
type ResponseInterceptor = (response: Response) => Promise<Response>

/**
 * Enhanced API Client with JWT token handling and interceptors
 */
class ApiClient {
  private baseURL: string
  private authToken: string | null = null
  private refreshToken: string | null = null
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private isRefreshing: boolean = false
  private refreshPromise: Promise<string> | null = null

  constructor(baseURL: string = 'http://localhost:8080/api') {
    this.baseURL = baseURL
    this.initializeTokens()
    this.setupDefaultInterceptors()
  }

  /**
   * Initialize tokens from storage
   */
  private initializeTokens(): void {
    this.authToken = localStorage.getItem(TOKEN_KEY)
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  /**
   * Setup default request/response interceptors
   */
  private setupDefaultInterceptors(): void {
    // Request interceptor for JWT token
    this.addRequestInterceptor((config) => {
      // Add JWT token to Authorization header
      if (this.authToken && !config.headers?.['Authorization']) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${this.authToken}`
        }
      }

      // Ensure Content-Type is set for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(config.method || 'GET')) {
        config.headers = {
          'Content-Type': 'application/json',
          ...config.headers
        }
      }

      return config
    })

    // Response interceptor for token refresh and error handling
    this.addResponseInterceptor(async (response) => {
      // Handle unauthorized responses (401)
      if (response.status === 401 && this.authToken) {
        // Try to refresh the token if we have a refresh token
        if (this.refreshToken && !this.isRefreshing) {
          try {
            const newToken = await this.handleTokenRefresh()
            if (newToken) {
              // Retry the original request with new token
              const originalUrl = response.url
              const originalMethod = response.headers.get('X-Original-Method') || 'GET'
              const originalBody = response.headers.get('X-Original-Body')

              return fetch(originalUrl, {
                method: originalMethod,
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'application/json'
                },
                body: originalBody
              })
            }
          } catch (error) {
            console.error('Token refresh failed:', error)
          }
        }
        
        // If refresh failed or no refresh token, clear session and redirect
        this.clearTokens()
        this.redirectToLogin()
      }

      return response
    })
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
  }

  /**
   * Handle token refresh
   */
  private async handleTokenRefresh(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this.performTokenRefresh()

    try {
      const newToken = await this.refreshPromise
      return newToken
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * Perform actual token refresh
   */
  private async performTokenRefresh(): Promise<string | null> {
    if (!this.refreshToken) {
      return null
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.refreshToken}`
        }
      })

      if (response.ok) {
        const data: AuthResponse = await response.json()
        this.setAuthToken(data.token, data.refreshToken)
        return data.token
      }
    } catch (error) {
      console.error('Token refresh request failed:', error)
    }

    return null
  }

  /**
   * Set authentication tokens
   */
  setAuthToken(token: string, refreshToken?: string): void {
    this.authToken = token
    localStorage.setItem(TOKEN_KEY, token)
    
    if (refreshToken) {
      this.refreshToken = refreshToken
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
  }

  /**
   * Clear authentication tokens
   */
  clearTokens(): void {
    this.authToken = null
    this.refreshToken = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  /**
   * Get current user from storage
   */
  getCurrentUser(): any {
    const userString = localStorage.getItem(USER_KEY)
    return userString ? JSON.parse(userString) : null
  }

  /**
   * Set current user in storage
   */
  setCurrentUser(user: any): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  /**
   * Redirect to login page
   */
  private redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  /**
   * Apply request interceptors
   */
  private applyRequestInterceptors(config: RequestInit & { url: string }): RequestInit & { url: string } {
    return this.requestInterceptors.reduce((config, interceptor) => {
      return interceptor(config)
    }, config)
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let processedResponse = response
    
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse)
    }
    
    return processedResponse
  }

  /**
   * Main request method with interceptors and error handling
   */
  async request<T = any>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 10000,
      retry = true,
      retryCount = 2,
      retryDelay = 1000
    } = options

    const url = `${this.baseURL}${endpoint}`
    
    let config: RequestInit & { url: string } = {
      url,
      method,
      headers: { ...headers },
      body: body ? JSON.stringify(body) : undefined
    }

    // Apply request interceptors
    config = this.applyRequestInterceptors(config)

    // Add original request metadata for potential retry after token refresh
    config.headers = {
      ...config.headers,
      'X-Original-Method': method,
      'X-Original-Body': config.body || ''
    }

    let attempt = 0
    let lastError: Error

    while (attempt <= (retry ? retryCount : 0)) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(config.url, {
          ...config,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        // Apply response interceptors
        const processedResponse = await this.applyResponseInterceptors(response)

        if (processedResponse.ok) {
          const contentType = processedResponse.headers.get('content-type')
          
          if (contentType?.includes('application/json')) {
            const data = await processedResponse.json()
            return {
              data,
              success: true,
              message: 'Request successful'
            }
          } else {
            // Handle non-JSON responses
            const text = await processedResponse.text()
            return {
              data: text as T,
              success: true,
              message: 'Request successful'
            }
          }
        } else {
          // Handle HTTP errors
          let errorData: any
          try {
            errorData = await processedResponse.json()
          } catch {
            errorData = { message: processedResponse.statusText }
          }

          const apiError: ApiError = {
            success: false,
            message: errorData.message || `HTTP ${processedResponse.status}: ${processedResponse.statusText}`,
            statusCode: processedResponse.status,
            details: errorData
          }

          throw apiError
        }
      } catch (error: any) {
        lastError = error
        attempt++

        // Don't retry on authentication errors or client errors (4xx)
        if (!retry || error.statusCode === 401 || (error.statusCode >= 400 && error.statusCode < 500)) {
          break
        }

        // Don't retry if this is the last attempt
        if (attempt > retryCount) {
          break
        }

        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)))
      }
    }

    // If we get here, all retry attempts failed
    throw lastError || new Error('Request failed after all retry attempts')
  }

  /**
   * Convenience methods for different HTTP verbs
   */
  get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  /**
   * Authentication methods
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/login', credentials)
    
    if (response.success && response.data) {
      this.setAuthToken(response.data.token, response.data.refreshToken)
      this.setCurrentUser(response.data.user)
    }
    
    return response.data
  }

  async pinLogin(credentials: PinLoginCredentials): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/pin-login', credentials)
    
    if (response.success && response.data) {
      this.setAuthToken(response.data.token, response.data.refreshToken)
      this.setCurrentUser(response.data.user)
    }
    
    return response.data
  }

  async logout(): Promise<void> {
    try {
      // Attempt to notify the server about logout
      if (this.authToken) {
        await this.post('/auth/logout')
      }
    } catch (error) {
      // Logout should succeed even if server request fails
      console.warn('Server logout failed, clearing local session:', error)
    } finally {
      // Always clear local session
      this.clearTokens()
      this.redirectToLogin()
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.authToken
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return this.authToken
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for testing or custom instances
export default ApiClient