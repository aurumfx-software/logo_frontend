import { apiFetch } from '../api/apiClient';
import { STATIC_BASE_URL } from '../config/apiConfig';

/**
 * Helper to ensure image URLs are fully qualified static URLs
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
 * Merchant Service — Module 2 (Merchant Onboarding & Management)
 */
export const merchantService = {
  /**
   * Merchant Onboarding (Full Form Submission): POST /api/v1/merchants/onboarding
   */
  async onboardMerchant(data) {
    const categories = Array.isArray(data.categories) && data.categories.length > 0
      ? data.categories
      : [data.category || 'Retail'];

    const photos = Array.isArray(data.photos) ? data.photos.map(formatMediaUrl) : [];
    const highlights = Array.isArray(data.key_highlights)
      ? data.key_highlights
      : Array.isArray(data.highlights)
      ? data.highlights
      : ['Quality Service', 'Customer Support'];

    const payload = {
      business_name: data.business_name || data.name || '',
      owner_name: data.owner_name || data.owner || data.contact_person || 'Owner',
      category: data.category || categories[0],
      categories: categories,
      phone: data.phone || data.phone_number || '',
      phone_number: data.phone || data.phone_number || '',
      whatsapp: data.whatsapp || data.phone || '',
      email: data.email || null,
      address: data.address || `${data.city || 'Payyanur'}, ${data.district || 'Kannur'}`,
      city: data.city || 'Payyanur',
      district: data.district || 'Kannur',
      state: data.state || 'Kerala',
      location: data.location || data.address || `${data.city || 'Payyanur'}, ${data.district || 'Kannur'}`,
      landmark: data.landmark || data.address || '',
      latitude: data.latitude || data.lat ? Number(data.latitude || data.lat) : null,
      longitude: data.longitude || data.lon || data.lng ? Number(data.longitude || data.lon || data.lng) : null,
      about: data.about || data.description || 'Verified merchant listing on Logo My Locality.',
      rating: data.rating ? Number(data.rating) : 5.0,
      reviews_count: data.reviews_count || data.reviews ? Number(data.reviews_count || data.reviews) : 1,
      key_highlights: highlights,
      website: data.website || '',
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      twitter: data.twitter || '',
      youtube: data.youtube || '',
      photos: photos,
      merchant_photos: photos,
      verification_documents: data.verification_documents || [],
      merchant_videos: data.videoUrl ? [data.videoUrl] : [],
      status: data.status || 'APPROVED',
      user_code: data.user_code || data.userCode || localStorage.getItem('user_code') || '',
    };

    let response;
    // Try primary /onboarding route, then fallback to /onboard
    try {
      response = await apiFetch('/api/v1/merchants/onboarding', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!response.ok && response.status === 404) {
        response = await apiFetch('/api/v1/merchants/onboard', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    } catch (err) {
      response = await apiFetch('/api/v1/merchants/onboard', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Merchant onboarding failed');
    }

    return resData.data || resData.merchant || resData;
  },

  /**
   * Media Upload (Images, Videos, Verification Docs): POST /api/v1/merchants/upload-media
   */
  async uploadMedia(formData) {
    const response = await apiFetch('/api/v1/merchants/upload-media', {
      method: 'POST',
      body: formData,
    });

    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to upload media files');
    }

    const rawPhotos = resData.photos || resData.all_urls || resData.urls || resData.files || [];
    const formattedPhotos = rawPhotos.map(formatMediaUrl);

    return {
      message: resData.message || 'Media uploaded successfully',
      photos: formattedPhotos,
      all_urls: formattedPhotos,
      total_files: resData.total_files || formattedPhotos.length,
      raw: resData,
    };
  },

  /**
   * Get Merchant Listing: GET /api/v1/merchants
   */
  async getMerchants(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.location) query.append('location', params.location);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));
    if (params.user_code) query.append('user_code', params.user_code);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    let response;
    try {
      response = await apiFetch(`/api/v1/merchants${queryString}`, { method: 'GET' });
      if (!response.ok && response.status === 404) {
        response = await apiFetch(`/api/v1/merchants/list${queryString}`, { method: 'GET' });
      }
    } catch {
      response = await apiFetch(`/api/v1/merchants/list${queryString}`, { method: 'GET' });
    }

    const resData = await response.json();

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
      business_name: m.business_name || m.name,
      owner: m.owner_name || m.contact_person || m.owner || 'Owner',
      category: m.category || (m.categories && m.categories[0]) || 'Retail',
      city: m.city || m.district || m.location || 'Payyanur',
      district: m.district || m.city || 'Kannur',
      address: m.address || m.location || '',
      latitude: m.latitude || m.lat || null,
      longitude: m.longitude || m.lon || m.lng || null,
      rating: m.rating || 4.5,
      reviews: m.reviews_count || m.reviews || 0,
      status: m.status ? m.status.toLowerCase() : 'active',
      phone: m.phone || m.phone_number || m.mobile || '',
      whatsapp: m.whatsapp || m.phone || '',
      email: m.email || '',
      about: m.about || m.description || '',
      highlights: m.key_highlights || m.highlights || [],
      photos: Array.isArray(m.photos) && m.photos.length > 0
        ? m.photos.map(formatMediaUrl)
        : Array.isArray(m.merchant_photos)
        ? m.merchant_photos.map(formatMediaUrl)
        : [],
      image: (m.photos && m.photos[0]) || (m.merchant_photos && m.merchant_photos[0]) || m.image || '',
    }));
  },

  /**
   * Search Merchants: GET /api/v1/merchants/search
   */
  async searchMerchants(params = {}) {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.location) query.append('location', params.location);
    if (params.service) query.append('service', params.service);
    if (params.category) query.append('category', params.category);
    if (params.skip !== undefined) query.append('skip', String(params.skip));
    if (params.limit !== undefined) query.append('limit', String(params.limit));

    const response = await apiFetch(`/api/v1/merchants/search?${query.toString()}`, { method: 'GET' });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Search failed');
    }

    let items = [];
    if (Array.isArray(resData)) items = resData;
    else if (Array.isArray(resData.data)) items = resData.data;
    else if (Array.isArray(resData.results)) items = resData.results;

    return items;
  },

  /**
   * Get Merchant Details by ID: GET /api/v1/merchants/{merchant_id}
   */
  async getMerchantById(merchantId) {
    const response = await apiFetch(`/api/v1/merchants/${merchantId}`, { method: 'GET' });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to fetch merchant details');
    }

    return resData.data || resData.merchant || resData;
  },

  /**
   * Update Merchant Profile: PUT /api/v1/merchants/{merchant_id}
   */
  async updateMerchant(merchantId, data) {
    const response = await apiFetch(`/api/v1/merchants/${merchantId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to update merchant profile');
    }

    return resData.data || resData.merchant || resData;
  },

  /**
   * Approve Merchant: POST /api/v1/merchants/{merchant_id}/approve
   */
  async approveMerchant(merchantId) {
    const response = await apiFetch(`/api/v1/merchants/${merchantId}/approve`, { method: 'POST' });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to approve merchant');
    }

    return resData;
  },

  /**
   * Reject Merchant: POST /api/v1/merchants/{merchant_id}/reject
   */
  async rejectMerchant(merchantId, rejectionReason = '') {
    const response = await apiFetch(`/api/v1/merchants/${merchantId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to reject merchant');
    }

    return resData;
  },

  /**
   * Location & Hierarchy Dropdown Data: GET /api/v1/merchants/regions
   */
  async getRegions() {
    const response = await apiFetch('/api/v1/merchants/regions', { method: 'GET' });
    const resData = await response.json();

    if (!response.ok || resData.success === false) {
      throw new Error(resData.message || resData.detail || 'Failed to fetch regions');
    }

    return resData.data || resData.regions || resData;
  },
};

export default merchantService;
