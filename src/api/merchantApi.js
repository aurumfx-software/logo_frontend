import { apiFetch } from './apiClient';

/**
 * Fetch list of merchants from backend API
 */
export async function fetchMerchantsList() {
  let response = await apiFetch('/api/v1/admin/merchants', {
    method: 'GET',
  });

  if (!response.ok) {
    response = await apiFetch('/api/v1/merchants', {
      method: 'GET',
    });
  }

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to fetch merchants list');
  }

  const rawItems =
    resData.data?.items ||
    resData.data?.merchants ||
    (Array.isArray(resData.data) ? resData.data : []) ||
    (Array.isArray(resData) ? resData : []);

  return rawItems.map((m, idx) => ({
    id: m.id || m.merchant_id || `MCH-${idx + 1}`,
    name: m.name || m.business_name || 'Merchant Store',
    category: m.category || m.category_name || 'Retail',
    city: m.city || m.location || 'Payyanur',
    rating: m.rating || 4.5,
    status: m.status || (m.is_approved ? 'active' : 'pending'),
    owner: m.owner_name || m.contact_person || 'N/A',
    phone: m.phone || m.contact_phone || '+91 98765 43210',
    registeredDate: m.created_at ? m.created_at.split('T')[0] : '2024-01-15',
  }));
}

/**
 * Register a new Merchant
 */
export async function createMerchant(merchantData) {
  const response = await apiFetch('/api/v1/merchants/register', {
    method: 'POST',
    body: JSON.stringify({
      name: merchantData.name,
      category: merchantData.category,
      phone: merchantData.phone,
      email: merchantData.email,
      city: merchantData.city,
      address: merchantData.address,
      contact_person: merchantData.contactPerson || merchantData.owner,
    }),
  });

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(
      resData.message ||
        resData.detail ||
        (resData.errors && Array.isArray(resData.errors) ? resData.errors.join(', ') : null) ||
        'Failed to create merchant'
    );
  }

  return resData.data || resData.merchant || resData;
}


