/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient, ApiError } from './apiClient';
import type { Product, Order, OrderStatus } from '../types';

/**
 * Example usage of the API client for SmartDispatch operations
 * This file demonstrates how to use the API client for common operations
 */

/**
 * Authentication example
 */
export async function authenticateUser(email: string, password: string): Promise<string | null> {
  try {
    const response = await apiClient.post<{ token: string; user: any }>('/auth/login', {
      email,
      password,
    });

    if (response.success && response.data?.token) {
      // Set the auth token for subsequent requests
      apiClient.setAuthToken(response.data.token);
      return response.data.token;
    }

    return null;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('Login failed:', error.message);
      if (error.statusCode === 401) {
        throw new Error('Invalid credentials');
      }
    }
    throw error;
  }
}

/**
 * Product operations example
 */
export class ProductService {
  /**
   * Get all products
   */
  static async getAllProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>('/products');
      return response.data || [];
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data || null;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create new product
   */
  static async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const response = await apiClient.post<Product>('/products', productData);
    if (!response.data) {
      throw new Error('Failed to create product');
    }
    return response.data;
  }

  /**
   * Update product
   */
  static async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}`, productData);
    if (!response.data) {
      throw new Error('Failed to update product');
    }
    return response.data;
  }

  /**
   * Delete product
   */
  static async deleteProduct(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/products/${id}`);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return false; // Already deleted
      }
      throw error;
    }
  }

  /**
   * Upload product images
   */
  static async uploadProductImage(productId: string, imageFile: File): Promise<string> {
    const response = await apiClient.uploadFile<{ imageUrl: string }>(
      `/products/${productId}/images`,
      imageFile
    );

    if (!response.data?.imageUrl) {
      throw new Error('Failed to upload image');
    }

    return response.data.imageUrl;
  }
}

/**
 * Order operations example
 */
export class OrderService {
  /**
   * Get all orders with optional status filter
   */
  static async getAllOrders(status?: OrderStatus): Promise<Order[]> {
    const endpoint = status ? `/orders?status=${status}` : '/orders';
    const response = await apiClient.get<Order[]>(endpoint);
    return response.data || [];
  }

  /**
   * Get order by ID
   */
  static async getOrderById(id: string): Promise<Order | null> {
    try {
      const response = await apiClient.get<Order>(`/orders/${id}`);
      return response.data || null;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${orderId}/status`, { status });
    if (!response.data) {
      throw new Error('Failed to update order status');
    }
    return response.data;
  }

  /**
   * Assign order to packer
   */
  static async assignOrderToPacker(orderId: string, packerId: string): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${orderId}/assign`, {
      packerWorkerId: packerId,
    });
    if (!response.data) {
      throw new Error('Failed to assign order');
    }
    return response.data;
  }
}

/**
 * Error handling example
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'TIMEOUT_ERROR':
        return 'Request timed out. Please try again.';
      case 'UNAUTHORIZED':
        return 'Your session has expired. Please log in again.';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action.';
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      case 'VALIDATION_ERROR':
        return `Invalid input: ${error.details?.message || error.message}`;
      default:
        if (error.isServerError) {
          return 'Server error occurred. Please try again later.';
        }
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Example of using the API client with proper error handling
 */
export async function demonstrateApiUsage(): Promise<void> {
  try {
    // 1. Check API health
    const isHealthy = await apiClient.healthCheck();
    console.log('API Health:', isHealthy ? 'Healthy' : 'Not responding');

    // 2. Authenticate (example)
    // const token = await authenticateUser('user@example.com', 'password');
    // console.log('Authenticated:', !!token);

    // 3. Get products
    const products = await ProductService.getAllProducts();
    console.log('Products loaded:', products.length);

    // 4. Get orders
    const pendingOrders = await OrderService.getAllOrders('PENDING');
    console.log('Pending orders:', pendingOrders.length);

  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('API operation failed:', errorMessage);
  }
}

/**
 * Example of request customization
 */
export async function customRequestExample(): Promise<void> {
  try {
    // Custom timeout for slow operations
    const response = await apiClient.get<Order[]>('/orders', {
      timeout: 30000, // 30 seconds
      headers: {
        'X-Custom-Header': 'custom-value',
      },
    });

    console.log('Orders with custom timeout:', response.data?.length);
  } catch (error) {
    console.error('Custom request failed:', handleApiError(error));
  }
}