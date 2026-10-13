import { apiFetch } from './apiClient';

/**
 * Promotion API Service Module
 * Connects Frontend Promotions module to http://168.144.18.149:8000
 * Direct endpoints: /promotions (without /api/v1)
 */

/**
 * Fetch all promotions: GET /api/v1/promotions
 */
export async function fetchPromotionsList(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.type) query.append('type', params.type);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    const response = await apiFetch(`/api/v1/promotions${queryString}`, { method: 'GET' });

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
    category: promoData.category || 'Retail & Shopping',
    type: promoData.type || 'Featured',
    placement: promoData.placement || 'Home Top',
    location: promoData.location || '',
    start_date: promoData.startDate || promoData.start_date || new Date().toISOString().split('T')[0],
    end_date: promoData.endDate || promoData.end_date || '2026-12-31',
    status: (promoData.status || 'ACTIVE').toLowerCase(),
    image_url: promoData.image_url || promoData.imageUrl || promoData.banner_url || promoData.bannerUrl || promoData.image || null,
    video_url: promoData.video_url || promoData.videoUrl || null,
    media_type: promoData.media_type || (promoData.video_url || promoData.videoUrl ? 'video' : 'image'),
    thumbnail_url: promoData.thumbnail_url || promoData.thumbnailUrl || null,
    target_url: promoData.target_url || promoData.targetUrl || '#',
    description: promoData.description !== undefined ? promoData.description : null,
    merchant_id: promoData.merchantId || promoData.merchant_id || null,
  };

  let response = await apiFetch('/api/v1/promotions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response || !response.ok || resData.success === false) {
    const errorMsg =
      resData.detail ||
      resData.message ||
      (typeof resData === 'string' ? resData : null) ||
      `Server error: HTTP ${response?.status || '500'}`;
    throw new Error(errorMsg);
  }

  const createdPromo = resData.data || resData.promotion || resData;

  // Enforce separate clean placement in PostgreSQL (e.g. 'Home Top' instead of 'Home Top (Category)')
  if (createdPromo && createdPromo.id && createdPromo.placement && createdPromo.placement !== payload.placement) {
    try {
      const cleaned = await updatePromotion(createdPromo.id, {
        placement: payload.placement,
        category: payload.category,
      });
      return cleaned;
    } catch (_) {
      // Return createdPromo if secondary update fails
    }
  }

  return createdPromo;
}

/**
 * Update promotion: PUT /api/v1/promotions/{id}
 */
export async function updatePromotion(id, promoData) {
  const payload = {
    ...promoData,
    image_url:
      promoData.image_url !== undefined
        ? promoData.image_url
        : (promoData.imageUrl || promoData.bannerUrl || promoData.banner_url || promoData.image || null),
    video_url: promoData.video_url !== undefined ? promoData.video_url : (promoData.videoUrl || null),
    media_type:
      promoData.media_type !== undefined
        ? promoData.media_type
        : (promoData.video_url || promoData.videoUrl ? 'video' : 'image'),
    thumbnail_url: promoData.thumbnail_url !== undefined ? promoData.thumbnail_url : (promoData.thumbnailUrl || null),
    target_url: promoData.target_url !== undefined ? promoData.target_url : (promoData.targetUrl || '#'),
    description: promoData.description !== undefined ? promoData.description : null,
  };

  let response = await apiFetch(`/api/v1/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const resData = await response.json().catch(() => ({}));

  if (!response || !response.ok || resData.success === false) {
    const errorMsg =
      resData.detail ||
      resData.message ||
      (typeof resData === 'string' ? resData : null) ||
      `Server error: HTTP ${response?.status || '500'}`;
    throw new Error(errorMsg);
  }

  return resData.data || resData.promotion || resData;
}

/**
 * Upload banner image or video: POST /api/v1/merchants/upload-media (DigitalOcean Spaces CDN)
 */
export async function uploadPromotionMedia(file) {
  if (!file) throw new Error('No file provided for upload');

  const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
  const formData = new FormData();
  if (isVideo) {
    formData.append('videos', file);
  } else {
    formData.append('photos', file);
  }
  formData.append('files', file);

  // 1. Primary: Upload directly to DigitalOcean Spaces CDN via merchants upload endpoint
  let response = await apiFetch('/api/v1/merchants/upload-media', {
    method: 'POST',
    body: formData,
  });

  // 2. Fallbacks if needed
  if (!response || !response.ok) {
    const fallbackFormData = new FormData();
    fallbackFormData.append('file', file);
    response = await apiFetch('/api/v1/promotions/upload-media', {
      method: 'POST',
      body: fallbackFormData,
    });
  }
  if (!response || !response.ok) {
    const fallbackFormData = new FormData();
    fallbackFormData.append('file', file);
    response = await apiFetch('/api/v1/promotions/upload', {
      method: 'POST',
      body: fallbackFormData,
    });
  }

  const resData = await response.json().catch(() => ({}));

  if (!response || !response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to upload banner media to CDN');
  }

  const dataObj = resData.data || resData;
  const photoUrl =
    (Array.isArray(dataObj.photos) && dataObj.photos[0]) ||
    (Array.isArray(dataObj.files) && dataObj.files[0]) ||
    dataObj.media_url ||
    dataObj.url ||
    dataObj.image_url ||
    '';
  const videoUrl =
    (Array.isArray(dataObj.videos) && dataObj.videos[0]) ||
    dataObj.video_url ||
    '';

  const resolvedUrl = isVideo ? (videoUrl || photoUrl) : (photoUrl || videoUrl);

  if (!resolvedUrl) {
    throw new Error('Upload succeeded but server returned no media URL');
  }

  return {
    url: resolvedUrl,
    media_url: resolvedUrl,
    image_url: isVideo ? '' : resolvedUrl,
    video_url: isVideo ? resolvedUrl : '',
    media_type: isVideo ? 'video' : 'image',
    raw: resData,
  };
}

/**
 * Delete promotion: DELETE /api/v1/promotions/${id}
 */
export async function deletePromotion(id) {
  let response = await apiFetch(`/api/v1/promotions/${id}`, { method: 'DELETE' });

  const resData = await response.json().catch(() => ({}));

  if (!response || !response.ok || resData.success === false) {
    const errorMsg =
      resData.detail ||
      resData.message ||
      (typeof resData === 'string' ? resData : null) ||
      `Server error: HTTP ${response?.status || '500'}`;
    throw new Error(errorMsg);
  }

  return true;
}
