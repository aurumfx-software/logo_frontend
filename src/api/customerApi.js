import { apiFetch, getAccessToken } from './apiClient';

const CUSTOMER_TOKEN_KEY = 'logo_customer_token';
const CUSTOMER_USER_KEY = 'logo_customer_user';

/**
 * Get stored customer access token
 */
export function getCustomerToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY) || getAccessToken() || null;
}

/**
 * Get current stored customer profile
 */
export function getCurrentCustomer() {
  try {
    const raw = localStorage.getItem(CUSTOMER_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Store customer session
 */
export function setCurrentCustomer(customer, accessToken) {
  if (accessToken) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, accessToken);
  }
  if (customer) {
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(customer));
  }
}

/**
 * Clear customer session
 */
export function logoutCustomer() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_USER_KEY);
}

/**
 * Register a new Customer via backend API (/api/v1/customer/register)
 */
export async function registerCustomer(customerData) {
  const payload = {
    name: customerData.name.trim(),
    email: customerData.email.trim().toLowerCase(),
    phone: customerData.phone ? customerData.phone.trim() : null,
    password: customerData.password.trim(),
    district: customerData.district || 'Kannur',
    city: customerData.city || 'Payyanur',
    location: customerData.location || null,
    address: customerData.address || `${customerData.city || 'Payyanur'}, ${customerData.district || 'Kannur'}`,
    latitude: customerData.latitude || null,
    longitude: customerData.longitude || null,
  };

  const response = await apiFetch('/api/v1/customer/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    const msg =
      resData.message ||
      resData.detail ||
      (Array.isArray(resData.errors) ? resData.errors.join(', ') : 'Customer registration failed');
    throw new Error(msg);
  }

  const customer = resData.customer || resData.user || {};
  const token = resData.access_token || resData.tokens?.access_token;
  setCurrentCustomer(customer, token);

  return { customer, token };
}

/**
 * Customer Login via backend API (/api/v1/customer/login)
 */
export async function loginCustomer({ email, phone, password }) {
  const payload = {
    email: email ? email.trim().toLowerCase() : null,
    phone: phone ? phone.trim() : null,
    password: password.trim(),
  };

  const response = await apiFetch('/api/v1/customer/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    const msg =
      resData.message ||
      resData.detail ||
      (Array.isArray(resData.errors) ? resData.errors.join(', ') : 'Login failed. Please check your credentials.');
    throw new Error(msg);
  }

  const customer = resData.customer || resData.user || {};
  const token = resData.access_token || resData.tokens?.access_token;
  setCurrentCustomer(customer, token);

  return { customer, token };
}

/**
 * Fetch current logged-in customer profile (/api/v1/customer/me)
 */
export async function fetchCustomerProfile() {
  const token = getCustomerToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await apiFetch('/api/v1/customer/me', {
    method: 'GET',
    headers,
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || resData.detail || 'Failed to fetch customer profile');
  }

  const customer = resData.customer || resData;
  setCurrentCustomer(customer);
  return customer;
}

/**
 * Update customer location (/api/v1/customer/location)
 */
export async function updateCustomerLocation(locationData) {
  const token = getCustomerToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await apiFetch('/api/v1/customer/location', {
    method: 'PUT',
    headers,
    body: JSON.stringify(locationData),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData.message || resData.detail || 'Failed to update location');
  }

  const updatedCustomer = resData.customer || resData;
  setCurrentCustomer(updatedCustomer);
  return updatedCustomer;
}

/**
 * Fetch nearby merchants based on location / coordinates (/api/v1/merchants/nearby or /api/v1/customer/nearby-merchants)
 */
export async function fetchNearbyMerchants(params = {}) {
  const queryParams = new URLSearchParams();
  if (params.district && params.district !== 'all') queryParams.append('district', params.district);
  if (params.city && params.city !== 'all') queryParams.append('city', params.city);
  if (params.location && params.location !== 'all') queryParams.append('location', params.location);
  if (params.latitude) queryParams.append('latitude', params.latitude);
  if (params.longitude) queryParams.append('longitude', params.longitude);
  if (params.radius_km) queryParams.append('radius_km', params.radius_km);
  if (params.category && params.category !== 'all') queryParams.append('category', params.category);
  if (params.search) queryParams.append('search', params.search);
  if (params.limit) queryParams.append('limit', params.limit);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const token = getCustomerToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await apiFetch(`/api/v1/merchants/nearby${qs}`, {
    method: 'GET',
    headers,
  });

  const resData = await response.json();
  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to fetch nearby merchants');
  }

  return {
    total: resData.total || (resData.merchants ? resData.merchants.length : 0),
    customerLocation: resData.customer_location || null,
    merchants: resData.merchants || [],
  };
}
