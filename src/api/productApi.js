import { apiFetch } from './apiClient';

/**
 * Public: Fetch marketplace products for Landing Page
 */
export async function fetchPublicProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.district && params.district !== 'all') query.set('district', params.district);
  if (params.search) query.set('search', params.search);
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/api/v1/products${qs}`, { method: 'GET' });
  if (!res.ok) {
    throw new Error('Failed to load marketplace products');
  }
  return await res.json();
}

/**
 * Public: Get single product details
 */
export async function fetchProductById(id) {
  const res = await apiFetch(`/api/v1/products/${id}`, { method: 'GET' });
  if (!res.ok) {
    throw new Error('Failed to load product details');
  }
  return await res.json();
}

/**
 * Public: Place order for a product (direct routing to seller)
 */
export async function placeProductOrder(orderData) {
  const res = await apiFetch('/api/v1/products/order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to place order');
  }
  return data;
}

/**
 * Admin: List all products with status filter
 */
export async function fetchAdminProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (typeof params.is_active === 'boolean') query.set('is_active', String(params.is_active));
  if (params.search) query.set('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/api/v1/admin/products${qs}`, { method: 'GET' });
  if (!res.ok) {
    throw new Error('Failed to load admin products');
  }
  return await res.json();
}

/**
 * Admin: Toggle product Allow/Deny and On/Off
 */
export async function updateAdminProductStatus(productId, statusPayload) {
  const res = await apiFetch(`/api/v1/admin/products/${productId}/status`, {
    method: 'PUT',
    body: JSON.stringify(statusPayload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to update product status');
  }
  return data;
}

/**
 * Admin: Delete product listing
 */
export async function deleteAdminProduct(productId) {
  const res = await apiFetch(`/api/v1/admin/products/${productId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete product');
  }
  return await res.json();
}

/**
 * Admin: List all customer orders
 */
export async function fetchAdminOrders(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/api/v1/admin/products/orders${qs}`, { method: 'GET' });
  if (!res.ok) {
    throw new Error('Failed to load orders');
  }
  return await res.json();
}

/**
 * Admin: Toggle user's ₹500 Seller Permission (Allow / Deny)
 */
export async function toggleUserSellerPermission(userId, payload) {
  const res = await apiFetch(`/api/v1/admin/users/${userId}/seller-permission`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to update seller permission');
  }
  return data;
}

/**
 * Customer / Seller: Create new product
 */
export async function createCustomerProduct(productData) {
  const res = await apiFetch('/api/v1/customer/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to publish product');
  }
  return data;
}

/**
 * Customer / Seller: Fetch my listed products
 */
export async function fetchMyProducts() {
  const res = await apiFetch('/api/v1/customer/products/my-products', { method: 'GET' });
  if (!res.ok) {
    throw new Error('Failed to fetch your products');
  }
  return await res.json();
}

/**
 * Customer / Seller: Fetch orders received by me
 */
export async function fetchMyOrders() {
  const res = await apiFetch('/api/v1/customer/products/my-orders', { method: 'GET' });
  if (!res.ok) {
    throw new Error('Failed to fetch received orders');
  }
  return await res.json();
}

/**
 * Customer / Seller: Update my product
 */
export async function updateCustomerProduct(id, productData) {
  const res = await apiFetch(`/api/v1/customer/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to update product');
  }
  return data;
}

/**
 * Customer / Seller: Delete my product
 */
export async function deleteCustomerProduct(id) {
  const res = await apiFetch(`/api/v1/customer/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete product');
  }
  return await res.json();
}
