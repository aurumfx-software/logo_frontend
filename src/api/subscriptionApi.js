import { apiFetch } from './apiClient';

/**
 * Fetch all subscription packages (Optionally filter by USER or MERCHANT, or activeOnly)
 */
export async function fetchAdminSubscriptionPackages({ audience, activeOnly = false } = {}) {
  const query = new URLSearchParams();
  if (audience) query.append('audience', audience);
  if (activeOnly !== undefined) query.append('active_only', String(activeOnly));

  const url = `/api/v1/subscriptions/packages${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiFetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch subscription packages');
  }
  return data.data || data.packages || data || [];
}

/**
 * Fetch a single package by ID
 */
export async function fetchSubscriptionPackageById(packageId) {
  const response = await apiFetch(`/api/v1/subscriptions/packages/${packageId}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch package details');
  }
  return data.data || data;
}

/**
 * Admin: Create a new subscription package
 */
export async function createAdminSubscriptionPackage(packageData) {
  const response = await apiFetch('/api/v1/subscriptions/admin/packages', {
    method: 'POST',
    body: JSON.stringify(packageData),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to create subscription package');
  }
  return data.data || data;
}

/**
 * Admin: Update an existing subscription package
 */
export async function updateAdminSubscriptionPackage(packageId, updateData) {
  const response = await apiFetch(`/api/v1/subscriptions/admin/packages/${packageId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to update subscription package');
  }
  return data.data || data;
}

/**
 * Admin: Deactivate / Delete a subscription package
 */
export async function deleteAdminSubscriptionPackage(packageId) {
  return updateAdminSubscriptionPackage(packageId, { is_active: false });
}

/**
 * Admin: Manually assign a subscription to a user or merchant shop
 */
export async function assignAdminSubscription(payload) {
  const response = await apiFetch('/api/v1/subscriptions/admin/assign', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to assign subscription');
  }
  return data.data || data;
}
