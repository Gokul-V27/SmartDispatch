/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OrderStatus = 'PENDING' | 'ASSIGNED' | 'PACKING' | 'VERIFIED' | 'PACKED' | 'SHIPPED' | 'DELIVERED';

export interface Product {
  id: string;
  name: string;
  brand: string;
  modelNumber: string;
  sku: string;
  category: string;
  colorName: string;
  colorHex: string;
  weightKg: number;
  weightToleranceGrams: number;
  stockQty: number;
  priceRs: number;
  description: string;
  photos: string[];
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceRs: number;
  ocrVerified: boolean;
  visionVerified: boolean;
  weightVerified: boolean;
  verifiedAt?: string;
  evidencePhotoPath?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  packerWorkerId?: string;
  packerName?: string;
  totalRs: number;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  dockAssignment?: string;
  truckId?: string;
  nfcSealedAt?: string;
  printedAt?: string;
  qrVerified?: boolean;
}

export interface Worker {
  id: string;
  workerId: string;
  name: string;
  email: string;
  phone: string;
  role: 'PACKER' | 'SUPERVISOR';
  isActive: boolean;
  packagesPackedToday: number;
  accuracyRate: number;
}

export interface Alert {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  alertType: 'WRONG_PRODUCT' | 'COLOR_MISMATCH' | 'WEIGHT_FAIL' | 'NFC_FAIL' | 'SUPERVISOR_OVERRIDE';
  orderId: string;
  orderNumber: string;
  workerName?: string;
  detail: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}
