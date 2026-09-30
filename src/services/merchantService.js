import { apiFetch } from '../api/apiClient';
import { STATIC_BASE_URL } from '../config/apiConfig';

/**
 * Format media URLs into absolute static URLs
 */
export function formatMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${STATIC_BASE_URL.replace(/\/static$/, '')}${cleanPath}`;
}

/**
 * Merchant Service — Module 2 (Merchant Management & Onboarding APIs)
 */
export const merchantService = {
  /**
   * 1. GET ALL MERCHANTS: GET /api/v1/merchants?user_code=...&category=...&location=...
   */
  async getMerchants({ user_code, category, location, skip, limit } = {}) {
    const query = new URLSearchParams();
    if (user_code) query.append('user_code', user_code);
    if (category) query.append('category', category);
    if (location) query.append('location', location);
    if (skip !== undefined) query.append('skip', String(skip));
    if (limit !== undefined) query.append('limit', String(limit));

    const queryString = query.toString() ? `?${query.toString()}` : '';

    let response;
    try {
      response = await apiFetch(`/api/v1/merchants${queryString}`, { method: 'GET' });
    } catch (err) {
      console.error('Fetch merchants error:', err);
      throw new Error('Unable to connect to merchant API server.');
    }

    const resData = await response.json().catch(() => ({}));

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to fetch merchants');
    }

    let items = [];
    if (Array.isArray(resData)) items = resData;
    else if (Array.isArray(resData.data)) items = resData.data;
    else if (Array.isArray(resData.merchants)) items = resData.merchants;
    else if (Array.isArray(resData.items)) items = resData.items;

    return items.map((m, idx) => ({
      id: m.id || m.merchant_id || m._id || `MCH-${idx + 1}`,
      name: m.business_name || m.name || 'Merchant Store',
      business_name: m.business_name || m.name || 'Merchant Store',
      owner: m.owner_name || m.contact_person || m.owner || 'Owner Name',
      owner_name: m.owner_name || m.contact_person || m.owner || 'Owner Name',
      category: m.category || (Array.isArray(m.categories) && m.categories[0]) || 'Retail',
      categories: Array.isArray(m.categories) ? m.categories : [m.category || 'Retail'],
      city: m.city || m.district || m.location || 'Payyanur',
      district: m.district || m.city || 'Kannur',
      address: m.address || m.location || 'Main Road',
      landmark: m.landmark || m.address || '',
      services: Array.isArray(m.services) ? m.services : [m.category || 'Retail'],
      service_timing: m.service_timing || '09:00 AM - 09:00 PM',
      latitude: m.latitude || m.lat || null,
      longitude: m.longitude || m.lon || m.lng || null,
      rating: m.rating || 4.5,
      reviews: m.reviews_count || m.reviews || 0,
      status: m.status ? m.status.toLowerCase() : 'approved',
      phone: m.phone || m.phone_number || m.mobile || '',
      phone_number: m.phone_number || m.phone || m.mobile || '',
      whatsapp: m.whatsapp || m.phone || '',
      email: m.email || '',
      about: m.about || m.description || '',
      highlights: m.key_highlights || m.highlights || [],
      photos: Array.isArray(m.merchant_photos) && m.merchant_photos.length > 0
        ? m.merchant_photos.map(formatMediaUrl)
        : Array.isArray(m.photos)
        ? m.photos.map(formatMediaUrl)
        : [],
      merchant_photos: Array.isArray(m.merchant_photos) ? m.merchant_photos.map(formatMediaUrl) : [],
      merchant_videos: Array.isArray(m.merchant_videos) ? m.merchant_videos : [],
      image: (m.merchant_photos && m.merchant_photos[0]) || (m.photos && m.photos[0]) || m.image || '',
      user_code: m.user_code || 'FLS_1',
    }));
  },

  /**
   * 2. CREATE / ONBOARD MERCHANT: POST /api/v1/merchants/onboarding
   */
  async onboardMerchant(data) {
    const category = (data.category || (Array.isArray(data.categories) && data.categories[0]) || 'Retail').trim();
    const categories = Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : [category];
    const services = Array.isArray(data.services) && data.services.length > 0 ? data.services : [category];
    const photos = Array.isArray(data.merchant_photos)
      ? data.merchant_photos
      : Array.isArray(data.photos)
      ? data.photos.filter((p) => p && typeof p === 'string')
      : [];
    const videos = Array.isArray(data.merchant_videos)
      ? data.merchant_videos
      : data.videoUrl
      ? [data.videoUrl]
      : [];
    const userCode = data.user_code || data.userCode || localStorage.getItem('user_code') || 'FLS_1';

    const payload = {
      business_name: (data.business_name || data.name || 'Store Name').trim(),
      category: category,
      categories: categories,
      owner_name: (data.owner_name || data.owner || 'Owner Name').trim(),
      phone_number: (data.phone_number || data.phone || '+91 98470 12345').trim(),
      email: data.email ? data.email.trim() : null,
      district: (data.district || 'Kannur').trim(),
      city: (data.city || 'Payyanur').trim(),
      address: (data.address || 'Main Road').trim(),
      landmark: (data.landmark || data.address || 'Near Bus Stand').trim(),
      services: services,
      service_timing: data.service_timing || '09:00 AM - 09:00 PM',
      merchant_photos: photos,
      merchant_videos: videos,
      user_code: userCode,
      status: (data.status || 'APPROVED').toUpperCase(),
    };

    const response = await apiFetch('/api/v1/merchants/onboarding', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok || resData.success === false) {
      let errorMsg = '';
      if (typeof resData.detail === 'string') {
        errorMsg = resData.detail;
      } else if (Array.isArray(resData.detail)) {
        errorMsg = resData.detail
          .map((item) => (typeof item === 'object' ? item.msg || item.message : String(item)))
          .join(', ');
      } else if (resData.message) {
        errorMsg = resData.message;
      }
      throw new Error(errorMsg || `Merchant onboarding failed (Status ${response.status})`);
    }

    return resData.data || resData.merchant || resData;
  },

  /**
   * 3. GET MERCHANT BY ID: GET /api/v1/merchants/{id}
   */
  async getMerchantById(id) {
    const cleanId = String(id).replace(/^MCH-/, '');
    const response = await apiFetch(`/api/v1/merchants/${cleanId}`, { method: 'GET' });
    const resData = await response.json().catch(() => ({}));

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || `Failed to fetch merchant #${id}`);
    }

    return resData.data || resData.merchant || resData;
  },

  /**
   * 4. SEARCH MERCHANTS: GET /api/v1/merchants/search?q=store&location=Kannur
   */
  async searchMerchants({ q, location, category, service, skip, limit } = {}) {
    const query = new URLSearchParams();
    if (q) query.append('q', q);
    if (location) query.append('location', location);
    if (category) query.append('category', category);
    if (service) query.append('service', service);
    if (skip !== undefined) query.append('skip', String(skip));
    if (limit !== undefined) query.append('limit', String(limit));

    const response = await apiFetch(`/api/v1/merchants/search?${query.toString()}`, { method: 'GET' });
    const resData = await response.json().catch(() => ({}));

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Merchant search failed');
    }

    let items = [];
    if (Array.isArray(resData)) items = resData;
    else if (Array.isArray(resData.data)) items = resData.data;
    else if (Array.isArray(resData.results)) items = resData.results;

    return items;
  },

  /**
   * 5. UPLOAD PHOTOS / MEDIA: POST /api/v1/merchants/upload-media (multipart/form-data with 'photos' or 'videos')
   */
  async uploadMedia(formData) {
    const response = await apiFetch('/api/v1/merchants/upload-media', {
      method: 'POST',
      body: formData,
    });

    const resData = await response.json().catch(() => ({}));

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to upload media files');
    }

    const rawPhotos = resData.photos || resData.all_urls || resData.urls || resData.files || [];
    const formattedPhotos = rawPhotos.map(formatMediaUrl);

    return {
      message: resData.message || 'Media uploaded successfully',
      photos: formattedPhotos,
      all_urls: formattedPhotos,
      raw: resData,
    };
  },
};

export default merchantService;
