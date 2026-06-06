# Design Document

## Architecture Overview

The SmartDispatch backend integration will transform the current React prototype into a production-ready application by implementing a layered architecture with proper separation of concerns. The design follows modern React patterns with TypeScript, implements robust error handling, and provides responsive user experience across all devices.

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
├─────────────────────────────────────────────────────────┤
│  Components  │  Hooks  │  Context  │  Utils  │  Types   │
├─────────────────────────────────────────────────────────┤
│              Service Layer (API Client)                 │
├─────────────────────────────────────────────────────────┤
│                 HTTP/REST Requests                      │
└─────────────────────────────────────────────────────────┘
                           │
                          HTTPS
                           │
┌─────────────────────────────────────────────────────────┐
│               Spring Boot Backend                       │
├─────────────────────────────────────────────────────────┤
│  Controllers │ Services │ Repositories │ Entities       │
├─────────────────────────────────────────────────────────┤
│                     Database (H2/PostgreSQL)           │
└─────────────────────────────────────────────────────────┘
```

## Technical Design

### 1. API Client Service Layer

#### ApiClient Class Design
```typescript
class ApiClient {
  private baseURL: string
  private authToken: string | null
  
  constructor(baseURL: string)
  setAuthToken(token: string): void
  request<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>>
  
  // Specialized methods
  auth: AuthService
  products: ProductService  
  orders: OrderService
  workers: WorkerService
  alerts: AlertService
}
```

#### Request/Response Pattern
- **Request Interceptors**: Automatically add JWT tokens, set content types
- **Response Interceptors**: Handle token refresh, parse errors, log requests
- **Error Handling**: Standardized error responses with user-friendly messages
- **Retry Logic**: Automatic retry for network failures with exponential backoff

### 2. Authentication System Design

#### JWT Token Management
```typescript
interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

interface AuthContextType {
  authState: AuthState
  login: (credentials: LoginCredentials) => Promise<void>
  pinLogin: (credentials: PinLoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}
```

#### Token Storage Strategy
- **Secure Storage**: JWT tokens stored in httpOnly cookies where possible
- **Fallback Storage**: SessionStorage for client-only scenarios
- **Token Refresh**: Automatic refresh before expiration using refresh tokens
- **Logout Cleanup**: Complete token removal and state reset

### 3. State Management Architecture

#### Context-based State Management
```typescript
// Global contexts for different domains
AuthContext: Authentication state and methods
DataContext: Cached data from backend (products, orders, workers)
UIContext: UI state (loading, modals, notifications)
OfflineContext: Offline queue and sync status
```

#### Local State Pattern
- **Component State**: Local UI state using useState/useReducer
- **Server State**: Cached server data with SWR or React Query patterns
- **Form State**: Controlled components with validation
- **Optimistic Updates**: Immediate UI updates with rollback on failure

### 4. Data Synchronization Design

#### Real-time Update Strategy
```typescript
interface SyncManager {
  startSync(): void
  stopSync(): void
  forceSync(): Promise<void>
  queueAction(action: OfflineAction): void
  getLastSyncTime(): Date
}

// Sync intervals by data criticality
const SYNC_INTERVALS = {
  alerts: 10000,      // 10 seconds - critical
  orders: 30000,      // 30 seconds - important
  products: 300000,   // 5 minutes - less critical
  workers: 600000     // 10 minutes - least critical
}
```

#### Conflict Resolution Strategy
1. **Last-Write-Wins**: For non-critical updates (descriptions, notes)
2. **Server-Authoritative**: For status changes, assignments
3. **Merge Strategy**: For additive operations (new items, comments)
4. **User Prompt**: For critical conflicts requiring human decision

### 5. Offline Functionality Design

#### Offline Storage Schema
```typescript
interface OfflineStorage {
  // Cached data
  products: Product[]
  orders: Order[] 
  workers: Worker[]
  alerts: Alert[]
  
  // Queued actions
  pendingActions: OfflineAction[]
  lastSync: Record<string, Date>
  
  // Settings
  syncSettings: SyncConfiguration
}
```

#### Offline Action Queue
```typescript
interface OfflineAction {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: 'product' | 'order' | 'worker' | 'alert'
  data: any
  timestamp: Date
  retryCount: number
}
```

### 6. Responsive Design Implementation

#### Breakpoint Strategy
```typescript
const BREAKPOINTS = {
  mobile: '320px-767px',   // Phone
  tablet: '768px-1023px',  // Tablet
  desktop: '1024px+'       // Desktop
}

const RESPONSIVE_PATTERNS = {
  navigation: 'collapsible-drawer',  // Mobile drawer, desktop sidebar
  tables: 'scrollable-cards',        // Mobile cards, desktop tables
  forms: 'single-column',            // Stack fields on mobile
  modals: 'fullscreen-mobile'        // Full screen on mobile
}
```

#### Touch-Optimized Interface
- **Minimum Touch Targets**: 44px minimum for all interactive elements
- **Gesture Support**: Swipe actions for mobile list items
- **Keyboard Support**: Full keyboard navigation for accessibility
- **Print Optimization**: Mobile-friendly print layouts

### 7. Error Handling Architecture

#### Error Classification System
```typescript
interface AppError {
  type: 'NETWORK' | 'VALIDATION' | 'AUTH' | 'SERVER' | 'CLIENT'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  details?: any
  retry?: () => Promise<void>
  recoverable: boolean
}
```

#### Error Response Strategy
- **Network Errors**: Show offline indicator, queue actions
- **Validation Errors**: Highlight specific fields, provide guidance
- **Auth Errors**: Redirect to login, clear session
- **Server Errors**: Generic message, log details, provide support contact
- **Critical Errors**: Error boundary, graceful degradation

### 8. Performance Optimization Design

#### Code Splitting Strategy
```typescript
// Route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Products = lazy(() => import('./pages/Products'))
const Orders = lazy(() => import('./pages/Orders'))

// Component-based splitting for heavy components
const OrderDetailModal = lazy(() => import('./components/OrderDetailModal'))
const BulkPrintDialog = lazy(() => import('./components/BulkPrintDialog'))
```

#### Data Optimization
- **Pagination**: Server-side pagination for large datasets
- **Virtual Scrolling**: For lists with 100+ items
- **Image Optimization**: Lazy loading, responsive images
- **Bundle Optimization**: Tree shaking, minimal dependencies

### 9. Security Implementation

#### Frontend Security Measures
```typescript
// Input sanitization
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>"\']/, '').trim()
}

// XSS prevention
const renderSafeHTML = (html: string): string => {
  return DOMPurify.sanitize(html)
}

// CSRF protection
const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content
```

#### Authentication Security
- **Token Validation**: Client-side token expiry checking
- **Secure Headers**: Proper CORS, content security policy
- **Input Validation**: All form inputs validated before submission
- **SQL Injection Prevention**: Parameterized queries on backend

### 10. API Integration Patterns

#### REST API Mapping
```typescript
// Authentication Endpoints
POST /api/auth/login          -> AuthService.login()
POST /api/auth/pin-login      -> AuthService.pinLogin()
GET  /api/auth/me             -> AuthService.getCurrentUser()
GET  /api/auth/users          -> WorkerService.getWorkers()

// Product Management
GET    /api/products          -> ProductService.getProducts()
GET    /api/products/{id}     -> ProductService.getProduct()
POST   /api/products          -> ProductService.createProduct()
PUT    /api/products/{id}     -> ProductService.updateProduct()
DELETE /api/products/{id}     -> ProductService.deleteProduct()

// Order Management
GET /api/orders               -> OrderService.getOrders()
GET /api/orders/{id}          -> OrderService.getOrder()
POST /api/orders              -> OrderService.createOrder()
PUT /api/orders/{id}/assign   -> OrderService.assignPacker()
PUT /api/orders/{id}/status   -> OrderService.updateStatus()
```

#### Request/Response Transformation
```typescript
// Frontend model to API model transformation
const transformOrderForAPI = (order: Order): APIOrder => ({
  customerId: order.customer.id,
  shippingAddress: JSON.stringify(order.shippingAddress),
  items: order.items.map(item => ({
    productId: item.product.id,
    quantity: item.quantity
  }))
})

// API response to frontend model transformation
const transformOrderFromAPI = (apiOrder: APIOrder): Order => ({
  id: apiOrder.id,
  orderNumber: apiOrder.orderNumber,
  customer: apiOrder.customerName,
  status: apiOrder.status,
  totalAmount: apiOrder.totalAmount,
  shippingAddress: JSON.parse(apiOrder.shippingAddress),
  items: apiOrder.items.map(transformOrderItem)
})
```

## Component Architecture

### 1. Page Components
- **Dashboard**: Analytics overview with real-time data
- **Products**: Product catalog management with CRUD operations
- **Orders**: Order list with filtering, search, and bulk operations
- **Workers**: Worker management with role-based access
- **Alerts**: Alert dashboard with priority handling

### 2. Shared Components
- **DataTable**: Reusable table with sorting, pagination, search
- **Modal**: Configurable modal with responsive behavior
- **FormField**: Consistent form inputs with validation
- **LoadingSpinner**: Loading states for async operations
- **ErrorBoundary**: Error handling and recovery

### 3. Service Hooks
```typescript
// Custom hooks for data fetching
const useProducts = (search?: string) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiClient.products.getProducts({ search })
      setProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search])
  
  return { products, loading, error, refetch: fetchProducts }
}
```

## Migration Strategy

### Phase 1: Foundation Setup
1. **API Client Implementation**: Create base API client with authentication
2. **Context Setup**: Implement authentication and data contexts
3. **Error Handling**: Add global error boundary and toast notifications
4. **Route Protection**: Add authentication guards to protected routes

### Phase 2: Core Integration
1. **Authentication Flow**: Replace mock authentication with real JWT flow
2. **Product Management**: Connect product CRUD operations to backend
3. **Order Management**: Integrate order listing, creation, and updates
4. **Worker Management**: Connect worker management to user endpoints

### Phase 3: Advanced Features
1. **Real-time Sync**: Implement periodic data synchronization
2. **Offline Support**: Add offline storage and action queuing
3. **Print Integration**: Connect label printing to real order data
4. **NFC Integration**: Connect NFC operations to backend verification

### Phase 4: Polish & Optimization
1. **Responsive Design**: Optimize for mobile and tablet devices
2. **Performance**: Implement lazy loading, code splitting, caching
3. **Testing**: Add comprehensive test coverage
4. **Documentation**: Update documentation for production deployment

## Deployment Considerations

### Environment Configuration
```typescript
// Environment-specific API endpoints
const API_CONFIG = {
  development: 'http://localhost:8080/api',
  staging: 'https://staging-api.smartdispatch.com/api',
  production: 'https://api.smartdispatch.com/api'
}
```

### Build Optimization
- **Bundle Analysis**: Regular bundle size monitoring
- **CDN Integration**: Static assets served from CDN
- **Caching Strategy**: Appropriate cache headers for different asset types
- **Progressive Web App**: Service worker for offline functionality

This design provides a robust, scalable foundation for the SmartDispatch backend integration while maintaining excellent user experience and security standards.