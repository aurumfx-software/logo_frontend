import { apiFetch } from './apiClient';

const CUSTOMER_TOKEN_KEY = 'logo_customer_token';
const CUSTOMER_USER_KEY = 'logo_customer_user';

export function getCustomerToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY) || '';
}

export function setCustomerSession(authData) {
  if (authData?.access_token) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, authData.access_token);
  }
  if (authData?.customer) {
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(authData.customer));
  }
}

export function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_USER_KEY);
}

export function getCustomerHeaders() {
  const token = getCustomerToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Quick OTP-free phone login and auto-register (for Web & Mobile app)
 */
export async function customerPhoneLogin({ phone, name, district, city }) {
  const res = await apiFetch('/api/v1/customer/phone-login', {
    method: 'POST',
    body: JSON.stringify({ phone, name, district, city }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Customer authentication failed');
  }
  setCustomerSession(data);
  return data;
}

/**
 * Standard customer registration
 */
export async function customerRegister(payload) {
  const res = await apiFetch('/api/v1/customer/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Registration failed');
  }
  setCustomerSession(data);
  return data;
}

/**
 * Fetch customer favorites from cloud database
 */
export async function getCustomerFavorites() {
  const token = getCustomerToken();
  if (!token) return { favorite_merchant_ids: [], merchants: [] };

  const res = await apiFetch('/api/v1/customer/favorites', {
    method: 'GET',
    headers: getCustomerHeaders(),
  });
  if (!res.ok) return { favorite_merchant_ids: [], merchants: [] };
  return await res.json();
}

/**
 * Toggle a merchant in customer cloud favorites
 */
export async function toggleCustomerFavorite(merchantId) {
  const token = getCustomerToken();
  if (!token) return null;

  const res = await apiFetch(`/api/v1/customer/favorites/toggle/${merchantId}`, {
    method: 'POST',
    headers: getCustomerHeaders(),
  });
  if (!res.ok) return null;
  return await res.json();
}

/**
 * Sync local guest wishlist into customer account upon login
 */
export async function syncCustomerFavorites(merchantIds = []) {
  const token = getCustomerToken();
  if (!token) return null;

  const res = await apiFetch('/api/v1/customer/favorites/sync', {
    method: 'POST',
    headers: getCustomerHeaders(),
    body: JSON.stringify({ merchant_ids: merchantIds }),
  });
  if (!res.ok) return null;
  return await res.json();
}

/**
 * Clear customer cloud wishlist
 */
export async function clearCustomerFavoritesApi() {
  const token = getCustomerToken();
  if (!token) return false;

  const res = await apiFetch('/api/v1/customer/favorites/clear', {
    method: 'DELETE',
    headers: getCustomerHeaders(),
  });
  return res.ok;
}
