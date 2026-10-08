// ============================================================
// API helper — wraps fetch with auth header and JSON handling
// ============================================================

export function getToken() {
  return localStorage.getItem('staffToken');
}

export function setToken(token) {
  localStorage.setItem('staffToken', token);
}

export function clearToken() {
  localStorage.removeItem('staffToken');
  localStorage.removeItem('staffUser');
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['x-staff-token'] = token;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (res.status === 401) {
    clearToken();
    window.location.hash = '#/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (username, password) =>
    request('POST', '/api/auth/login', { username, password }),
  logout: () => request('POST', '/api/auth/logout'),

  // Orders
  getOrders: () => request('GET', '/api/orders'),
  updateOrderStatus: (id, status) =>
    request('PATCH', `/api/orders/${id}/status`, { status }),

  // Library
  getLibrary: () => request('GET', '/api/library'),
  checkOutBook: (docId) => request('DELETE', `/api/library/${docId}`),

  // Catalog
  getCatalog: () => request('GET', '/api/catalog'),
  saveBook: (book) => request('POST', '/api/catalog', book),
  deleteBook: (isbn) => request('DELETE', `/api/catalog/${isbn}`),

  // Stats
  getStats: () => request('GET', '/api/stats'),
};