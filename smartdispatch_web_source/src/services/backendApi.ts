/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './apiClient';
import type { Product, Order, OrderItem, Worker, OrderStatus, ShippingAddress } from '../types';

/**
 * Maps backend product shape to frontend Product type
 */
function mapProduct(backendProduct: any): Product {
  return {
    id: backendProduct.id,
    name: backendProduct.name,
    brand: backendProduct.brand,
    modelNumber: backendProduct.modelNumber || 'N/A',
    sku: backendProduct.sku,
    category: backendProduct.category,
    colorName: backendProduct.color || 'Unknown',
    colorHex: backendProduct.colorHex || getColorHex(backendProduct.color),
    weightKg: backendProduct.weightKg || 0,
    weightToleranceGrams: backendProduct.weightToleranceG || 100,
    stockQty: backendProduct.stockQty || 0,
    priceRs: backendProduct.price || 0,
    description: backendProduct.description || '',
    photos: backendProduct.imageUrls ? backendProduct.imageUrls.split(',') : [],
  };
}

function getColorHex(colorName: string): string {
  if (!colorName) return '#808080';
  const name = colorName.toLowerCase();
  if (name.includes('silver')) return '#C0C0C0';
  if (name.includes('black')) return '#1a1a1a';
  if (name.includes('blue')) return '#3b82f6';
  if (name.includes('orange')) return '#f97316';
  if (name.includes('green')) return '#22c55e';
  if (name.includes('red')) return '#ef4444';
  if (name.includes('white')) return '#f8fafc';
  if (name.includes('yellow')) return '#eab308';
  return '#808080';
}

/**
 * Maps frontend Product data to backend shape for creation/updating
 */
function unmapProduct(product: Partial<Product>): any {
  return {
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    modelNumber: product.modelNumber,
    category: product.category,
    color: product.colorName,
    weightKg: product.weightKg,
    weightToleranceG: product.weightToleranceGrams,
    price: product.priceRs,
    description: product.description,
    imageUrls: product.photos?.join(','),
    stockQty: product.stockQty,
    active: true
  };
}

/**
 * Maps backend order shape to frontend Order type
 */
function mapOrder(backendOrder: any): Order {
  let address: ShippingAddress = {
    recipientName: backendOrder.customerName || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pinCode: ''
  };

  if (backendOrder.shippingAddress) {
    try {
      const parsedAddress = typeof backendOrder.shippingAddress === 'string' 
        ? JSON.parse(backendOrder.shippingAddress) 
        : backendOrder.shippingAddress;
      
      address = { ...address, ...parsedAddress };
    } catch (e) {
      // If not JSON, use it as line 1
      address.addressLine1 = backendOrder.shippingAddress;
    }
  }

  const items: OrderItem[] = (backendOrder.items || []).map((item: any) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName || 'Unknown Product',
    sku: item.productSku || '',
    quantity: item.quantity,
    unitPriceRs: 0, // Backend order item might not have unit price directly, but total handles it
    ocrVerified: item.ocrVerified || false,
    visionVerified: item.visionVerified || false,
    weightVerified: item.weightVerified || false,
    verifiedAt: item.verifiedAt || undefined,
  }));

  return {
    id: backendOrder.id,
    orderNumber: backendOrder.orderNumber,
    customerName: backendOrder.customerName,
    customerPhone: address.phone || '',
    status: backendOrder.status as OrderStatus,
    packerWorkerId: backendOrder.packerId,
    packerName: backendOrder.packerName,
    totalRs: backendOrder.totalAmount || 0,
    shippingAddress: address,
    items,
    createdAt: backendOrder.createdAt || new Date().toISOString(),
    updatedAt: backendOrder.updatedAt || new Date().toISOString(),
    nfcSealedAt: backendOrder.packedAt || undefined,
    dockAssignment: backendOrder.dockAssignment,
    truckId: backendOrder.truckId,
  };
}

/**
 * Maps backend user shape to frontend Worker type
 */
function mapWorker(backendUser: any): Worker {
  return {
    id: backendUser.id,
    workerId: backendUser.workerId || '',
    name: backendUser.name,
    email: backendUser.email,
    phone: backendUser.phone || '',
    role: backendUser.role as 'PACKER' | 'SUPERVISOR',
    isActive: backendUser.isActive !== false,
    packagesPackedToday: backendUser.packagesPackedToday || 0,
    accuracyRate: backendUser.accuracyRate || 100,
  };
}

export class BackendApi {
  // --- Products ---

  static async fetchProducts(): Promise<Product[]> {
    const response = await apiClient.get<any[]>('/products');
    if (!response.data) return [];
    return response.data.map(mapProduct);
  }

  static async createProduct(product: Partial<Product>): Promise<Product> {
    const payload = unmapProduct(product);
    const response = await apiClient.post<any>('/products', payload);
    return mapProduct(response.data);
  }

  // --- Orders ---

  static async fetchOrders(status?: OrderStatus, role?: string, userId?: string): Promise<Order[]> {
    let url = '/orders';
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (role) params.append('role', role);
    if (userId) params.append('userId', userId);
    
    if (params.toString()) {
      url += '?' + params.toString();
    }

    const response = await apiClient.get<any[]>(url);
    if (!response.data) return [];
    return response.data.map(mapOrder);
  }

  static async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const response = await apiClient.put<any>(`/orders/${orderId}/status`, { status });
    return mapOrder(response.data);
  }

  static async assignPacker(orderId: string, packerId: string): Promise<Order> {
    const response = await apiClient.put<any>(`/orders/${orderId}/assign`, { packerId });
    return mapOrder(response.data);
  }

  // --- Verification ---

  static async scanVerify(scannedSku: string, orderItemId: string, workerId: string): Promise<any> {
    const response = await apiClient.post<any>('/verify/scan-verify', {
      scannedSku,
      orderItemId,
      workerId
    });
    return response.data;
  }

  // --- NFC ---

  static async registerNfc(tagId: string, orderId: string): Promise<any> {
    const response = await apiClient.post<any>('/nfc/register', { tagId, orderId });
    return response.data;
  }

  static async sealNfc(tagId: string, workerId: string): Promise<any> {
    const response = await apiClient.post<any>('/nfc/seal', { tagId, workerId });
    return response.data;
  }

  static async deliveryTap(tagId: string, deliveryPersonId: string): Promise<any> {
    const response = await apiClient.post<any>('/nfc/delivery-tap', { tagId, deliveryPersonId });
    return response.data;
  }

  static async verifyOtp(tagId: string, otp: string): Promise<any> {
    const response = await apiClient.post<any>('/nfc/verify-otp', { tagId, otp });
    return response.data;
  }

  // --- Labels ---

  static async fetchLabelData(orderId: string): Promise<any> {
    const response = await apiClient.get<any>(`/label/${orderId}/data`);
    return response.data;
  }

  // --- Tracking ---

  static async trackOrder(orderNumber: string): Promise<any> {
    const response = await apiClient.get<any>(`/tracking/${orderNumber}`);
    return response.data;
  }

  // --- Users / Workers ---

  static async fetchWorkers(): Promise<Worker[]> {
    const response = await apiClient.get<any[]>('/auth/users');
    if (!response.data) return [];
    // Filter only workers
    return response.data
      .filter((u: any) => u.role === 'PACKER' || u.role === 'SUPERVISOR' || u.role === 'ADMIN')
      .map(mapWorker);
  }
}
