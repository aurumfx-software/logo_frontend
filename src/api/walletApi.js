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

/**
 * Requirement 7A: Admin Wallet Summary
 * GET /api/v1/wallet/admin/summary
 */
export async function fetchAdminWalletSummary() {
  const response = await apiFetch('/api/v1/wallet/admin/summary');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch wallet summary');
  }
  return data?.data || data;
}

/**
 * Requirement 7B: Admin Wallet Transactions
 * GET /api/v1/wallet/admin/transactions?page=1&page_size=20
 */
export async function fetchAdminWalletTransactions(page = 1, pageSize = 20) {
  const response = await apiFetch(`/api/v1/wallet/admin/transactions?page=${page}&page_size=${pageSize}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch wallet transactions');
  }
  return data;
}

/**
 * Requirement 7C: Admin Send Funds
 * POST /api/v1/wallet/admin/send
 */
export async function adminSendFunds(payload) {
  const response = await apiFetch('/api/v1/wallet/admin/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to send funds');
  }
  return data;
}


