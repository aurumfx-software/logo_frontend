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
 * Requirement 7B: Admin All Wallet Transactions (Recommended for Admin UI)
 * GET /api/v1/admin/transactions?page=1&page_size=20&transaction_type=...
 */
export async function fetchAdminAllTransactions(page = 1, pageSize = 20, transactionType = '') {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (transactionType && transactionType.toUpperCase() !== 'ALL') {
    params.append('transaction_type', transactionType);
  }
  const response = await apiFetch(`/api/v1/admin/transactions?${params.toString()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch admin transactions');
  }
  return data;
}

/**
 * Company Platform Commission Ledger
 * GET /api/v1/wallet/admin/transactions/platform-ledger?page=1&page_size=20
 */
export async function fetchPlatformLedgerTransactions(page = 1, pageSize = 20) {
  const response = await apiFetch(`/api/v1/wallet/admin/transactions/platform-ledger?page=${page}&page_size=${pageSize}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch platform ledger transactions');
  }
  return data;
}

/**
 * Admin Wallet Transactions (Full list and platform cash from wallet route)
 * GET /api/v1/wallet/admin/transactions?page=1&page_size=20&cash_page=1&cash_page_size=20
 */
export async function fetchAdminWalletTransactions({
  page = 1,
  pageSize = 20,
  cashPage = 1,
  cashPageSize = 20,
  transactionType = '',
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    cash_page: String(cashPage),
    cash_page_size: String(cashPageSize),
  });
  if (transactionType && transactionType.toUpperCase() !== 'ALL') {
    params.append('transaction_type', transactionType);
  }
  const response = await apiFetch(`/api/v1/wallet/admin/transactions?${params.toString()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch wallet transactions');
  }
  return data;
}

/**
 * Admin: Get single transaction details with ledger lines
 * GET /api/v1/wallet/admin/transactions/{transaction_id}
 */
export async function fetchAdminTransactionDetail(transactionId) {
  const response = await apiFetch(`/api/v1/wallet/admin/transactions/${transactionId}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Failed to fetch transaction details');
  }
  return data?.data || data;
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


