# SmartDispatch API Client

This directory contains the API client service for the SmartDispatch React application. The API client provides a robust, type-safe interface for communicating with the SmartDispatch backend API.

## Files

- **`apiClient.ts`** - Main API client implementation with comprehensive error handling
- **`apiExample.ts`** - Example usage and service patterns
- **`README.md`** - This documentation file

## Features

### Core Features
- ✅ **TypeScript Support** - Full type safety with proper interfaces
- ✅ **Error Handling** - Custom ApiError class with detailed error information
- ✅ **Authentication** - JWT token handling with automatic header injection
- ✅ **Timeout Support** - Configurable timeouts with AbortController
- ✅ **Request/Response Logging** - Development-friendly logging
- ✅ **File Upload Support** - FormData handling for file uploads
- ✅ **Base URL Configuration** - Flexible API endpoint configuration
- ✅ **Health Check** - API availability testing

### HTTP Methods Supported
- `GET` - Retrieve data
- `POST` - Create new resources  
- `PUT` - Update resources (full replacement)
- `PATCH` - Update resources (partial update)
- `DELETE` - Remove resources
- `uploadFile` - File upload with FormData

## Quick Start

### Basic Usage

```typescript
import { apiClient } from './services/apiClient';

// Simple GET request
const response = await apiClient.get<Product[]>('/products');
console.log(response.data);

// POST with data
const newProduct = await apiClient.post<Product>('/products', {
  name: 'New Product',
  price: 29.99
});

// With authentication
apiClient.setAuthToken('your-jwt-token');
const orders = await apiClient.get<Order[]>('/orders');
```

### Authentication Setup

```typescript
import { apiClient } from './services/apiClient';

// Login and set token
const loginResponse = await apiClient.post<{ token: string }>('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

if (loginResponse.success && loginResponse.data?.token) {
  // Token is automatically added to all subsequent requests
  apiClient.setAuthToken(loginResponse.data.token);
}

// Clear token on logout
apiClient.clearAuthToken();
```

### Error Handling

```typescript
import { ApiError } from './services/apiClient';

try {
  const response = await apiClient.get('/products/123');
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.statusCode);
    console.log('Error Code:', error.code);
    console.log('Message:', error.message);
    
    // Check error types
    if (error.isNetworkError) {
      console.log('Network connection failed');
    } else if (error.isTimeout) {
      console.log('Request timed out');
    } else if (error.isServerError) {
      console.log('Server error (5xx)');
    } else if (error.isClientError) {
      console.log('Client error (4xx)');
    }
  }
}
```

### File Upload

```typescript
const file = document.getElementById('fileInput').files[0];

const response = await apiClient.uploadFile<{ imageUrl: string }>(
  '/products/123/images',
  file,
  { description: 'Product photo' } // Additional form data
);

console.log('Uploaded image URL:', response.data?.imageUrl);
```

### Custom Configuration

```typescript
import { ApiClient } from './services/apiClient';

// Create custom client instance
const customClient = new ApiClient({
  baseUrl: 'https://api.example.com/v1',
  timeout: 15000, // 15 seconds
  enableLogging: true,
  defaultHeaders: {
    'X-App-Version': '1.0.0'
  }
});

// Custom request options
const response = await customClient.get('/data', {
  timeout: 30000, // Override default timeout
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

## API Response Format

All API responses follow this standardized format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### Success Response
```json
{
  "success": true,
  "data": { "id": 1, "name": "Product Name" },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found",
    "details": { "productId": "123" }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Configuration

### Environment Variables
```bash
# .env file
VITE_API_BASE_URL=http://localhost:8080/api
VITE_API_TIMEOUT=10000
```

### Default Settings
- **Base URL**: `http://localhost:8080/api`
- **Timeout**: 10 seconds
- **Content Type**: `application/json`
- **Logging**: Enabled in development mode

## Service Pattern Examples

See `apiExample.ts` for complete examples of:

- **ProductService** - CRUD operations for products
- **OrderService** - Order management operations
- **Authentication** - Login/logout patterns
- **Error Handling** - Centralized error processing
- **Custom Requests** - Advanced usage patterns

## Error Codes

Common error codes returned by the API:

| Code | Description | Handling |
|------|-------------|----------|
| `NETWORK_ERROR` | Network connection failed | Check connectivity |
| `TIMEOUT_ERROR` | Request timed out | Retry with longer timeout |
| `UNAUTHORIZED` | Invalid or expired token | Re-authenticate user |
| `FORBIDDEN` | Insufficient permissions | Show access denied message |
| `NOT_FOUND` | Resource not found | Handle as empty result |
| `VALIDATION_ERROR` | Invalid input data | Show validation errors |
| `SERVER_ERROR` | Internal server error | Show generic error message |

## Best Practices

### 1. Use Type Safety
```typescript
// Good - with proper typing
const products = await apiClient.get<Product[]>('/products');

// Avoid - without typing
const products = await apiClient.get('/products');
```

### 2. Handle Errors Properly
```typescript
// Good - specific error handling
try {
  const order = await apiClient.get<Order>(`/orders/${id}`);
  return order.data;
} catch (error) {
  if (error instanceof ApiError && error.statusCode === 404) {
    return null; // Order not found
  }
  throw error; // Re-throw other errors
}
```

### 3. Use Service Classes
```typescript
// Good - organized in service classes
class ProductService {
  static async getAll(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products');
    return response.data || [];
  }
}

// Usage
const products = await ProductService.getAll();
```

### 4. Configure Timeouts Appropriately
```typescript
// File upload - longer timeout
await apiClient.uploadFile('/upload', file, {}, { timeout: 60000 });

// Quick data fetch - shorter timeout
await apiClient.get('/health', { timeout: 5000 });
```

## Development & Testing

### Check API Health
```typescript
const isHealthy = await apiClient.healthCheck();
if (!isHealthy) {
  console.warn('API is not responding');
}
```

### Enable Debug Logging
```typescript
// Enable logging for debugging
apiClient.setLogging(true);

// Or create debug client
const debugClient = new ApiClient({ enableLogging: true });
```

This API client is designed to be the foundation for all HTTP communication in the SmartDispatch application, providing a consistent, reliable, and type-safe interface to the backend services.