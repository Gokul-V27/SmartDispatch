/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Authentication related API types
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PinLoginCredentials {
  workerId: string;
  pin: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      workerId?: string;
      name: string;
      email: string;
      phone?: string;
      role: 'PACKER' | 'SUPERVISOR' | 'ADMIN';
      isActive: boolean;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number; // seconds
    tokenType: 'Bearer';
  };
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * User profile and authentication state
 */
export interface User {
  id: string;
  workerId?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'PACKER' | 'SUPERVISOR' | 'ADMIN';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string; // For validation errors
  };
  timestamp: string;
}

/**
 * Standard API success response wrapper
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Generic API response type
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Request options for API calls
 */
export interface RequestOptions {
  timeout?: number;
  signal?: AbortSignal;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search and filter parameters
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
}

/**
 * Combined query parameters for list endpoints
 */
export interface ListParams extends PaginationParams, SearchParams {}

/**
 * File upload related types
 */
export interface FileUploadResponse {
  success: boolean;
  data: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: string;
  };
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'healthy' | 'unhealthy';
    redis?: 'healthy' | 'unhealthy';
    storage?: 'healthy' | 'unhealthy';
  };
}

/**
 * Generic list response wrapper
 */
export interface ListResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}