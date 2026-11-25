import { apiFetch } from './apiClient';

const CUSTOMER_TOKEN_KEY = 'logo_customer_token';
const CUSTOMER_REFRESH_KEY = 'logo_customer_refresh_token';
const CUSTOMER_USER_KEY = 'logo_customer_user';

export function dispatchCustomerSessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('customer-session-changed'));
  }
}

export function getCustomerToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY) || '';
}

export function getStoredCustomerUser() {
  try {
    const raw = localStorage.getItem(CUSTOMER_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function isCustomerAuthenticated() {
  const token = getCustomerToken();
  const cust = getStoredCustomerUser();
  return Boolean(token && token.trim().length > 10 && cust && (cust.id || cust.user_id || cust.email || cust.phone));
}

export function setCustomerSession(authData) {
  const token = authData?.access_token || authData?.token || authData?.accessToken || '';
  if (token) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token.trim());
  }
  const refresh = authData?.refresh_token || authData?.refreshToken || '';
  if (refresh) {
    localStorage.setItem(CUSTOMER_REFRESH_KEY, refresh.trim());
  }
  const cust = authData?.customer || authData?.user || authData?.data;
  if (cust && typeof cust === 'object') {
    const enriched = {
      ...cust,
      login_id: authData?.login_id || cust.login_id || null,
      user_code: authData?.user_code || cust.user_code || null,
    };
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(enriched));
  }
  dispatchCustomerSessionChanged();
}

export function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_REFRESH_KEY);
  localStorage.removeItem(CUSTOMER_USER_KEY);
  // Clear user-scoped delivery address so no stale/default address remains after logout
  localStorage.removeItem('@logo_delivery_address');
  localStorage.removeItem('logo_delivery_address');
  dispatchCustomerSessionChanged();
}

export function getCustomerHeaders(extra = {}) {
  const token = getCustomerToken();
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (token) {
    const raw = token.trim();
    headers['Authorization'] = raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
  }
  return headers;
}

// ═════════════════════════════════════════════════════════════════════════════
// MOBILE APP PARITY: CUSTOMER AUTHENTICATION APIS (/api/v1/auth/* & /customer/*)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 1. Customer Email + Password Login (POST /api/v1/auth/login)
 */
export async function customerEmailLogin({ email, password }) {
  const res = await apiFetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: String(email || '').trim().toLowerCase(),
      password,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      typeof data.detail === 'string'
        ? data.detail
        : data.message || 'Invalid email or password'
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  setCustomerSession(data);
  return data;
}

/**
 * 2. Customer Send Email OTP (POST /api/v1/auth/login/send-otp)
 */
export async function customerSendOTP({ email }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const res = await apiFetch('/api/v1/auth/login/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : data.message || 'Could not send OTP'
    );
  }
  return data;
}

/**
 * 3. Customer Verify Email OTP (POST /api/v1/auth/login/verify-otp)
 */
export async function customerVerifyOTP({ email, otp }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const res = await apiFetch('/api/v1/auth/login/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, otp: String(otp || '').trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : data.message || 'Invalid or expired OTP'
    );
  }
  setCustomerSession(data);
  return data;
}

/**
 * 4. Standard Customer Registration (POST /api/v1/customer/register -> fallback /api/v1/auth/register)
 */
export async function customerRegister({ name, email, phone, password, district, city, address }) {
  const cleanPhone = phone ? String(phone).trim().replace(/[^0-9]/g, '') : '';
  const cleanEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : null;
  const cleanDistrict = district || 'Ernakulam';
  const cleanCity = city ? String(city).trim() : cleanDistrict;

  const res = await apiFetch('/api/v1/customer/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: String(name || '').trim(),
      phone: cleanPhone,
      password,
      district: cleanDistrict,
      city: cleanCity,
      email: cleanEmail,
    }),
  });
  let data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 409 || String(data.detail || data.message || '').toLowerCase().includes('already exists')) {
      throw new Error(typeof data.detail === 'string' ? data.detail : data.message || 'Account already exists');
    }
    // Fallback to /auth/register if needed
    const fallbackRes = await apiFetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(name || '').trim(),
        email: cleanEmail || `${cleanPhone}@logoapp.local`,
        phone: cleanPhone,
        password,
        district: cleanDistrict,
        city: cleanCity,
        address: address || `${cleanCity}, ${cleanDistrict}, Kerala`,
        role: 'CUSTOMER',
      }),
    });
    const fallbackData = await fallbackRes.json().catch(() => ({}));
    if (!fallbackRes.ok) {
      throw new Error(
        typeof fallbackData.detail === 'string'
          ? fallbackData.detail
          : fallbackData.message || 'Registration failed'
      );
    }
    data = fallbackData;
  }

  setCustomerSession(data);
  return data;
}

/**
 * 5. Customer Forgot Password (POST /api/v1/auth/forgot-password)
 */
export async function customerForgotPassword(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const res = await apiFetch('/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : data.message || 'Could not send reset OTP'
    );
  }
  return data;
}

/**
 * 6. Customer Reset Password (POST /api/v1/auth/reset-password)
 */
export async function customerResetPassword({ email, otp, new_password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const res = await apiFetch('/api/v1/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cleanEmail,
      otp: String(otp || '').trim(),
      new_password: String(new_password || '').trim(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : data.message || 'Failed to reset password'
    );
  }
  return data;
}

/**
 * 7. Fetch Live Customer Profile (/api/v1/auth/me) — syncs subscription & seller flags
 */
export async function fetchCustomerProfile() {
  const token = getCustomerToken();
  if (!token) return null;
  const res = await apiFetch('/api/v1/auth/me', {
    method: 'GET',
    headers: getCustomerHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearCustomerSession();
    }
    return null;
  }
  const user = await res.json().catch(() => null);
  if (user && typeof user === 'object') {
    const existing = getStoredCustomerUser() || {};
    const merged = { ...existing, ...user };
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(merged));
    dispatchCustomerSessionChanged();
    return merged;
  }
  return null;
}

/**
 * 8. Logout Customer Session (/api/v1/customer/logout)
 */
export async function logoutCustomerSession() {
  const token = getCustomerToken();
  const refresh = localStorage.getItem(CUSTOMER_REFRESH_KEY) || '';
  if (token) {
    try {
      await apiFetch('/api/v1/customer/logout', {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify({ refresh_token: refresh || undefined }),
      });
    } catch (_) {}
  }
  clearCustomerSession();
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

// Aliases for component compatibility
export const registerCustomer = customerRegister;
export const loginCustomer = customerEmailLogin;

export async function updateCustomerLocation(locationData) {
  try {
    const token = getCustomerToken();
    if (!token) return null;
    const res = await apiFetch('/api/v1/customer/location', {
      method: 'POST',
      headers: getCustomerHeaders(),
      body: JSON.stringify(locationData),
    });
    if (!res.ok) return null;
    const updated = await res.json();
    const existing = getStoredCustomerUser() || {};
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify({ ...existing, ...updated }));
    dispatchCustomerSessionChanged();
    return updated;
  } catch (err) {
    return null;
  }
}
