import { apiFetch } from './apiClient';

/**
 * Promotion API Service Module
 * Connects Frontend Promotions module to http://168.144.18.149:8000
 * Direct endpoints: /promotions (without /api/v1)
 */

/**
 * Fetch all promotions: GET /promotions or GET /admin/promotions
 */
export async function fetchPromotionsList(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.type) query.append('type', params.type);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    let response = await apiFetch(`/api/v1/promotions${queryString}`, { method: 'GET' });
    if (!response || !response.ok) {
      response = await apiFetch(`/promotions${queryString}`, { method: 'GET' });
    }
    if (!response || !response.ok) {
      response = await apiFetch(`/admin/promotions${queryString}`, { method: 'GET' });
    }

    if (response && response.ok) {
      const resData = await response.json();
      const rawPromos = resData.data || resData.promotions || resData.items || (Array.isArray(resData) ? resData : []);
      return Array.isArray(rawPromos) ? rawPromos : [];
    }
  } catch (err) {
    console.warn('Backend fetchPromotionsList notice:', err);
  }
  return null;
}

/**
 * Create a new promotion: POST /promotions (without /api/v1)
 */
export async function createPromotion(promoData) {
  const payload = {
    title: promoData.title ? promoData.title.trim() : '',
    category: promoData.category || 'Solar & Electricals',
    type: promoData.type || 'Featured',
    placement: promoData.placement || 'Home Top',
    location: promoData.location || '',
    start_date: promoData.startDate || promoData.start_date || new Date().toISOString().split('T')[0],
    end_date: promoData.endDate || promoData.end_date || '2026-12-31',
    status: (promoData.status || 'ACTIVE').toLowerCase(),
    image_url: promoData.image_url || promoData.banner_url || promoData.bannerUrl || promoData.image || null,
    target_url: promoData.target_url || promoData.targetUrl || '#',
    merchant_id: promoData.merchantId || promoData.merchant_id || null,
  };

  let response = await apiFetch('/api/v1/promotions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response || !response.ok) {
    response = await apiFetch('/promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  if (!response || !response.ok) {
    response = await apiFetch('/admin/promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  const resData = await response.json().catch(() => ({}));

  if (!response || !response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to create promotion');
  }

  return resData.data || resData.promotion || resData;
}

/**
 * Update promotion: PUT /api/v1/promotions/{id}
 */
export async function updatePromotion(id, promoData) {
  const payload = {
    ...promoData,
    image_url: promoData.image_url !== undefined ? promoData.image_url : (promoData.bannerUrl || promoData.banner_url || promoData.image || null),
    target_url: promoData.target_url !== undefined ? promoData.target_url : (promoData.targetUrl || '#'),
  };

  let response = await apiFetch(`/api/v1/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!response || !response.ok) {
    response = await apiFetch(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
  if (!response || !response.ok) {
    response = await apiFetch(`/admin/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  const resData = await response.json().catch(() => ({}));

  if (!response || !response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to update promotion');
  }

  return resData.data || resData.promotion || resData;
}

/**
 * Delete promotion: DELETE /api/v1/promotions/{id}
 */
export async function deletePromotion(id) {
  let response = await apiFetch(`/api/v1/promotions/${id}`, { method: 'DELETE' });
  if (!response || !response.ok) {
    response = await apiFetch(`/promotions/${id}`, { method: 'DELETE' });
  }
  if (!response || !response.ok) {
    response = await apiFetch(`/admin/promotions/${id}`, { method: 'DELETE' });
  }

  const resData = await response.json().catch(() => ({}));

  if (!response || !response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to delete promotion');
  }

  return true;
}
