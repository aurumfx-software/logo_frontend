import { apiFetch } from './apiClient';

/**
 * Fetch company platform wallet balance, 2% platform fee revenue, and ledger transactions
 */
export async function fetchCompanyWalletOverview() {
  return apiFetch('/wallet/company/overview');
}

/**
 * Admin: adjust user/merchant wallet balance (credit/debit)
 */
export async function adminAdjustWallet(payload) {
  return apiFetch('/wallet/admin/adjust', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
