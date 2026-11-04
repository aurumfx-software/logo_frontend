import { apiFetch } from './apiClient';

/**
 * Fetch company platform wallet balance, 2% platform fee revenue, and ledger transactions
 */
export async function fetchCompanyWalletOverview() {
  let response = await apiFetch('/api/v1/wallet/company/overview');
  if (!response || !response.ok) {
    response = await apiFetch('/api/v1/wallet/company');
  }
  if (!response || !response.ok) {
    response = await apiFetch('/api/v1/wallet/platform');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || 'Failed to fetch company wallet overview');
  }
  const json = await response.json();
  return json?.data || json;
}

/**
 * Admin: adjust user/merchant wallet balance (credit/debit)
 */
export async function adminAdjustWallet(payload) {
  const response = await apiFetch('/api/v1/wallet/admin/adjust', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const resData = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(resData.detail || resData.message || 'Failed to adjust wallet');
  }
  return resData;
}

/**
 * Fetch a user's wallet balance by user_id (admin only - uses admin adjust endpoint probe)
 */
export async function fetchUserWalletBalance(userId) {
  const response = await apiFetch(`/api/v1/admin/users/${userId}/wallet`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch wallet');
  }
  return data?.data || data;
}

