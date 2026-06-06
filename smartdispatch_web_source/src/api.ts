import { Order, Product, Worker, OrderStatus, ShippingAddress, OrderItem } from './types';

const BASE = '/api';
let authToken: string | null = localStorage.getItem('sd_token');

export function setToken(t: string) {
  authToken = t;
  localStorage.setItem('sd_token', t);
}

export function clearToken() {
  authToken = null;
  localStorage.removeItem('sd_token');
  localStorage.removeItem('sd_user');
}

export function getStoredUser() {
  const u = localStorage.getItem('sd_user');
  return u ? JSON.parse(u) : null;
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  
  const res = await fetch(BASE + path, { ...opts, headers });
  if (!res.ok) {
    let err;
    try {
      err = await res.json();
    } catch {
      err = { error: res.statusText };
    }
    throw new Error(err.error || err.message || res.statusText);
  }
  return res.json();
}

// --- Auth ---
export const auth = {
  login: (email: string, password: string) =>
    req<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
};

// --- Workers ---
export const workers = {
  listAll: () => req<any[]>('/auth/users').then(users => users.map(mapWorker)),
  listPackers: () => req<any[]>('/auth/users?role=PACKER').then(users => users.map(mapWorker)),
};

// --- Products ---
export const products = {
  list: () => req<any[]>('/products').then(prods => prods.map(mapProduct)),
  create: (data: Partial<any>) => req<any>('/products', { method: 'POST', body: JSON.stringify(data) }).then(mapProduct),
};

// --- Orders ---
export const orders = {
  list: () => req<any[]>('/orders').then(ords => ords.map(mapOrder)),
  assign: (id: string, packerId: string) =>
    req<any>(`/orders/${id}/assign`, { method: 'PUT', body: JSON.stringify({ packerId }) }).then(mapOrder),
  updateStatus: (id: string, status: string) =>
    req<any>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }).then(mapOrder),
};

// --- Mappers ---
function mapWorker(w: any): Worker {
  return {
    id: w.id,
    workerId: w.workerId || w.id.substring(0,8),
    name: w.name,
    email: w.email,
    phone: w.phone || '',
    role: w.role === 'ADMIN' ? 'SUPERVISOR' : 'PACKER',
    isActive: w.isActive !== false,
    packagesPackedToday: 0,
    accuracyRate: 100
  };
}

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    modelNumber: p.modelNumber || '',
    sku: p.sku,
    category: p.category || 'Uncategorized',
    colorName: p.color || '',
    colorHex: p.color === 'Black' ? '#000000' : p.color === 'Silver' ? '#C0C0C0' : p.color === 'Blue' ? '#0000FF' : '#888888',
    weightKg: p.weightKg || 0,
    weightToleranceGrams: p.weightToleranceG || 50,
    stockQty: p.stockQty || 0,
    priceRs: p.price || 0,
    description: p.description || '',
    photos: p.imageUrls ? [p.imageUrls] : ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']
  };
}

function mapOrder(o: any): Order {
  let addr: any = {};
  try {
    addr = JSON.parse(o.shippingAddress || '{}');
  } catch(e) {}
  
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName || addr.name || '',
    customerPhone: addr.phone || '',
    status: o.status as OrderStatus,
    packerWorkerId: o.packerId,
    packerName: o.packerName,
    totalRs: o.totalAmount || 0,
    shippingAddress: {
      recipientName: addr.name || o.customerName || '',
      phone: addr.phone || '',
      addressLine1: addr.street || '',
      addressLine2: '',
      city: addr.city || '',
      state: addr.state || '',
      pinCode: addr.pin || ''
    },
    items: (o.items || []).map((i: any): OrderItem => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      sku: i.productSku,
      quantity: i.quantity,
      unitPriceRs: 0,
      ocrVerified: i.ocrVerified || false,
      visionVerified: i.visionVerified || false,
      weightVerified: i.weightVerified || false,
    })),
    createdAt: o.createdAt || new Date().toISOString(),
    updatedAt: o.createdAt || new Date().toISOString()
  };
}
