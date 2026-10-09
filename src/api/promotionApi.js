import { apiFetch } from './apiClient';

/**
 * Promotion API Service Module
 * Connects Frontend Promotions module to http://168.144.18.149:8000
 * Direct endpoints: /api/v1/promotions
 */

/**
 * 1. Upload Banner Media (Video / Image) to CDN
 * Endpoint: POST /api/v1/promotions/upload-media
 */
export async function uploadPromotionMedia(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('video', file);
  formData.append('image', file);

  const response = await apiFetch('/api/v1/promotions/upload-media', {
    method: 'POST',
    body: formData,
  });

  const resData = await response.json().catch(() => ({}));
  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to upload media to CDN');
  }

  // Returns { url, media_type, video_url, image_url, filename }
  return resData.data || resData;
}

/**
 * 2. Get Active Hero Banners (Public - No Auth Required)
 * Endpoints: GET /api/v1/promotions/active?placement=Home Top OR GET /api/v1/promotions/hero-banners
 */
export async function fetchActiveHeroBanners(placement = 'Home Top') {
  try {
    let response = await apiFetch(`/api/v1/promotions/active?placement=${encodeURIComponent(placement)}`, { method: 'GET' });
    if (!response || !response.ok) {
      response = await apiFetch('/api/v1/promotions/hero-banners', { method: 'GET' });
    }
    if (!response || !response.ok) {
      response = await apiFetch(`/api/v1/promotions?placement=${encodeURIComponent(placement)}`, { method: 'GET' });
    }
    if (!response || !response.ok) {
      response = await apiFetch('/promotions', { method: 'GET' });
    }

    if (response && response.ok) {
      const resData = await response.json();
      const rawBanners = resData.data || resData.promotions || resData.items || (Array.isArray(resData) ? resData : []);
      return Array.isArray(rawBanners) ? rawBanners : [];
    }
  } catch (err) {
    console.warn('Backend fetchActiveHeroBanners notice:', err);
  }
  return null;
}

/**
 * Fetch all promotions: GET /api/v1/promotions
 */
export async function fetchPromotionsList(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.placement) query.append('placement', params.placement);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.type) query.append('type', params.type);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    let response = await apiFetch(`/api/v1/promotions${queryString}`, { method: 'GET' });
    if (!response || !response.ok) {
      response = await apiFetch(`/api/v1/promotions/active${queryString}`, { method: 'GET' });
    }
    if (!response || !response.ok) {
      response = await apiFetch(`/promotions${queryString}`, { method: 'GET' });
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
 * 3. Create a Banner Promotion: POST /api/v1/promotions
 */
export async function createPromotion(promoData) {
  const payload = {
    title: promoData.title ? promoData.title.trim() : 'Banner Promotion',
    placement: promoData.placement || 'Home Top',
    category: promoData.category || 'Retail & Shopping',
    type: promoData.type || 'Banner',
    media_type: promoData.media_type || promoData.mediaType || (promoData.video_url ? 'video' : 'image'),
    video_url: promoData.video_url || promoData.videoUrl || null,
    thumbnail_url: promoData.thumbnail_url || promoData.thumbnailUrl || promoData.image_url || promoData.banner_url || null,
    image_url: promoData.image_url || promoData.imageUrl || promoData.banner_url || promoData.bannerUrl || null,
    status: (promoData.status || 'active').toLowerCase(),
    target_url: promoData.target_url || promoData.targetUrl || '#',
    location: promoData.location || '',
    phone: promoData.phone || '',
    description: promoData.description || '',
    start_date: promoData.start_date || promoData.startDate || new Date().toISOString().split('T')[0],
    end_date: promoData.end_date || promoData.endDate || '2026-12-31',
  };

  let response;
  try {
    response = await apiFetch('/api/v1/promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      response = await apiFetch('/promotions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  } catch (err) {
    response = await apiFetch('/promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  const resData = await response.json().catch(() => ({}));

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to create promotion');
  }

  return resData.data || resData.promotion || resData;
}

/**
 * 4. Update Promotion: PUT /api/v1/promotions/{id}
 */
export async function updatePromotion(id, promoData) {
  const payload = {
    title: promoData.title,
    placement: promoData.placement || 'Home Top',
    category: promoData.category,
    type: promoData.type || 'Banner',
    media_type: promoData.media_type || promoData.mediaType || (promoData.video_url ? 'video' : 'image'),
    video_url: promoData.video_url || promoData.videoUrl || null,
    thumbnail_url: promoData.thumbnail_url || promoData.thumbnailUrl || promoData.image_url || null,
    image_url: promoData.image_url || promoData.imageUrl || promoData.banner_url || null,
    status: (promoData.status || 'active').toLowerCase(),
    target_url: promoData.target_url || promoData.targetUrl || '#',
    location: promoData.location || '',
    phone: promoData.phone || '',
    description: promoData.description || '',
  };

  let response;
  try {
    response = await apiFetch(`/api/v1/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      response = await apiFetch(`/promotions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
  } catch (err) {
    response = await apiFetch(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  const resData = await response.json().catch(() => ({}));

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to update promotion');
  }

  return resData.data || resData.promotion || resData;
}

/**
 * 4. Delete Promotion: DELETE /api/v1/promotions/{id}
 */
export async function deletePromotion(id) {
  let response;
  try {
    response = await apiFetch(`/api/v1/promotions/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      response = await apiFetch(`/promotions/${id}`, { method: 'DELETE' });
    }
  } catch (err) {
    response = await apiFetch(`/promotions/${id}`, { method: 'DELETE' });
  }

  const resData = await response.json().catch(() => ({}));

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to delete promotion');
  }

  return true;
}
