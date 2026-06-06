// API Response Types
export interface ApiResponse<T = any> {
  data: T
  success: boolean
  message?: string
}

export interface ApiError {
  success: false
  message: string
  statusCode: number
  details?: any
}

// Request Configuration Types
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retry?: boolean
  retryCount?: number
  retryDelay?: number
}

// Authentication Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface PinLoginCredentials {
  workerId: string
  pin: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  user: User
  expiresIn: number
}

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'SUPERVISOR' | 'PACKER'
  workerId?: string
  isActive: boolean
  lastLogin?: string
}

// Product Types
export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  imageUrl?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductRequest {
  name: string
  sku: string
  category: string
  price: number
  stock: number
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  description?: string
  imageUrl?: string
}

// Order Types
export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  status: OrderStatus
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  totalAmount: number
  shippingAddress: ShippingAddress
  items: OrderItem[]
  assignedPackerId?: string
  assignedPackerName?: string
  createdAt: string
  updatedAt: string
  estimatedDelivery?: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  verified: boolean
}

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

export type OrderStatus = 
  | 'PENDING' 
  | 'ASSIGNED' 
  | 'PICKING' 
  | 'PICKED' 
  | 'PACKING' 
  | 'PACKED' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED'

export interface CreateOrderRequest {
  customerId: string
  customerName: string
  shippingAddress: ShippingAddress
  items: Array<{
    productId: string
    quantity: number
  }>
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

// Alert Types
export interface Alert {
  id: string
  type: 'INVENTORY_LOW' | 'ORDER_DELAYED' | 'SYSTEM_ERROR' | 'QUALITY_ISSUE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  message: string
  relatedEntityId?: string
  relatedEntityType?: 'ORDER' | 'PRODUCT' | 'USER'
  isResolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

// Worker Types
export interface Worker {
  id: string
  workerId: string
  name: string
  email: string
  role: 'ADMIN' | 'SUPERVISOR' | 'PACKER'
  isActive: boolean
  performance?: {
    ordersProcessed: number
    accuracy: number
    efficiency: number
  }
  createdAt: string
  lastLogin?: string
}

export interface CreateWorkerRequest {
  name: string
  email: string
  role: 'ADMIN' | 'SUPERVISOR' | 'PACKER'
  workerId?: string
  initialPassword?: string
}

// Search and Filter Types
export interface SearchParams {
  search?: string
  category?: string
  status?: string
  role?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}