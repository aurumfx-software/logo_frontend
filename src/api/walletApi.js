import { apiFetch } from './apiClient';

/**
 * Fetch company platform wallet balance, 2% platform fee revenue, and ledger transactions
 */
export async function fetchCompanyWalletOverview() {
  const response = await apiFetch('/api/v1/wallet/company/overview');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || 'Failed to fetch company wallet overview');
  }
  return await response.json();
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
