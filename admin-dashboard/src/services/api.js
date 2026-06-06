const API = 'http://localhost:8080/api';

let token = localStorage.getItem('sd_token');

const api = {
  setToken(t) { token = t; localStorage.setItem('sd_token', t); },
  clearToken() { token = null; localStorage.removeItem('sd_token'); localStorage.removeItem('sd_user'); },
  getUser() { const u = localStorage.getItem('sd_user'); return u ? JSON.parse(u) : null; },
  setUser(u) { localStorage.setItem('sd_user', JSON.stringify(u)); },

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, { ...options, headers });
    if (res.status === 401) { api.clearToken(); window.location.href = '/login'; return null; }
    return res.json();
  },

  // Auth
  login: (email, password) => api.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => api.request('/auth/me'),

  // Products
  getProducts: (search) => api.request(`/products${search ? `?search=${search}` : ''}`),
  getProduct: (id) => api.request(`/products/${id}`),
  createProduct: (data) => api.request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => api.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => api.request(`/products/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params) => api.request(`/orders${params ? `?${new URLSearchParams(params)}` : ''}`),
  getOrder: (id) => api.request(`/orders/${id}`),
  createOrder: (data) => api.request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  assignPacker: (id, packerId) => api.request(`/orders/${id}/assign`, { method: 'PUT', body: JSON.stringify({ packerId }) }),
  updateOrderStatus: (id, status) => api.request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Verification
  getVerificationLogs: (orderId) => api.request(`/verify/logs/${orderId}`),
};

export default api;
