import { apiFetch } from './apiClient';
import { STATIC_BASE_URL } from '../config/apiConfig';

/**
 * Format relative photo URLs into absolute static URLs
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
 * Get current User ID from localStorage session
 */
export function getCurrentUserId() {
  try {
    const userStr = localStorage.getItem('user') || localStorage.getItem('logo_admin_user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      return userObj.id || userObj.user_id || userObj._id || userObj.userId || null;
    }
  } catch (err) {
    // ignore parse error
  }
  return localStorage.getItem('user_id') || localStorage.getItem('userId') || null;
}

/**
 * Get current User Code from localStorage session
 */
export function getCurrentUserCode() {
  try {
    const userStr = localStorage.getItem('user') || localStorage.getItem('logo_admin_user');
    if (userStr) {
      const userObj = JSON.parse(userStr);
      return (
        userObj.user_code ||
        userObj.userCode ||
        userObj.code ||
        localStorage.getItem('user_code') ||
        localStorage.getItem('userCode') ||
        'FLS_1'
      );
    }
  } catch (err) {
    // ignore parse error
  }
  return localStorage.getItem('user_code') || localStorage.getItem('userCode') || 'FLS_1';
}

/**
 * 5. UPLOAD PHOTOS / MEDIA: POST /api/v1/merchants/upload-media
 * Multipart/form-data containing 'photos' or 'videos'
 */
export async function uploadMerchantMedia(formData) {
  const response = await apiFetch('/api/v1/merchants/upload-media', {
    method: 'POST',
    body: formData,
  });

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to upload media files');
  }

  const rawPhotos = resData.photos || resData.all_urls || resData.urls || resData.files || resData.data?.photos || [];
  const rawVideos = resData.videos || resData.video_urls || resData.data?.videos || [];

  const formattedPhotos = rawPhotos.map(formatMediaUrl);
  const formattedVideos = rawVideos.map(formatMediaUrl);

  return {
    message: resData.message || 'Successfully uploaded files.',
    photos: formattedPhotos,
    videos: formattedVideos,
    all_urls: formattedPhotos,
    total_files: resData.total_files || (formattedPhotos.length + formattedVideos.length),
    raw: resData,
  };
}

/**
 * 1. GET ALL MERCHANTS: GET /api/v1/merchants
 * Optional query params: ?user_code=FLS_1&category=Retail&location=Kannur
 */
export async function fetchMerchantsList(arg1, arg2, arg3, arg4) {
  let filterObj = {};
  if (typeof arg1 === 'object' && arg1 !== null) {
    filterObj = arg1;
  } else {
    filterObj = {
      user_code: arg2 || arg1,
      category: arg3,
      location: arg4,
    };
  }

  const userCode = filterObj.user_code || filterObj.userCode;
  const category = filterObj.category;
  const location = filterObj.location || filterObj.city || filterObj.district;
  const searchVal = filterObj.search || filterObj.query || filterObj.q || filterObj.searchQuery;
  const status = filterObj.status;
  const state = filterObj.state;
  const district = filterObj.district;
  const city = filterObj.city;
  const plan = filterObj.plan;
  const businessType = filterObj.business_type || filterObj.businessType;

  const params = new URLSearchParams();
  if (userCode && userCode !== 'all') params.set('user_code', userCode);
  if (category && category !== 'all') params.set('category', category);
  if (location && location !== 'all') params.set('location', location);
  if (status && status !== 'all') params.set('status', status);
  if (state && state !== 'all') params.set('state', state);
  if (district && district !== 'all') params.set('district', district);
  if (city && city !== 'all') params.set('city', city);
  if (plan && plan !== 'all') params.set('plan', plan);
  if (businessType && businessType !== 'all') params.set('business_type', businessType);

  if (searchVal && String(searchVal).trim()) {
    const q = String(searchVal).trim();
    params.set('search', q);
    params.set('query', q);
    params.set('q', q);
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';

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
    throw new Error(resData.message || resData.detail || 'Failed to fetch merchants list');
  }

  let rawItems = [];
  if (Array.isArray(resData)) {
    rawItems = resData;
  } else if (Array.isArray(resData.data)) {
    rawItems = resData.data;
  } else if (Array.isArray(resData.merchants)) {
    rawItems = resData.merchants;
  } else if (Array.isArray(resData.items)) {
    rawItems = resData.items;
  } else if (Array.isArray(resData.data?.merchants)) {
    rawItems = resData.data.merchants;
  } else if (Array.isArray(resData.data?.items)) {
    rawItems = resData.data.items;
  } else if (resData.data && typeof resData.data === 'object') {
    rawItems = [resData.data];
  } else if (resData.merchant && typeof resData.merchant === 'object') {
    rawItems = [resData.merchant];
  }

  return rawItems.map((m, idx) => {
    let rawPhotos = m.photos || m.merchant_photos || (m.profile_picture ? [m.profile_picture] : []);
    if (!Array.isArray(rawPhotos) || rawPhotos.length === 0) {
      const photosFromNumbered = [m.photo_1, m.photo_2, m.photo_3, m.photo_4, m.photo_5, m.photo_6].filter(Boolean);
      if (photosFromNumbered.length > 0) {
        rawPhotos = photosFromNumbered;
      }
    }
    const formattedPhotos = Array.isArray(rawPhotos) ? rawPhotos.map(formatMediaUrl) : [];
    const rawVideos = m.merchant_videos || (m.video_url || m.videoUrl ? [m.video_url || m.videoUrl] : []);
    const phoneVal = m.phone_number || m.phone || m.contact_number || m.contact_phone || m.mobile || '+91 98470 12345';

    return {
      id: m.id || m.merchant_id || m._id || `MCH-${idx + 1}`,
      name: m.business_name || m.name || m.title || 'Merchant Store',
      business_name: m.business_name || m.name,
      category: m.category || (m.categories && m.categories[0]) || m.category_name || 'Retail',
      categories: Array.isArray(m.categories) ? m.categories : [m.category || 'Retail'],
      city: m.city || m.city_region || m.location || m.district || 'Payyanur',
      address: m.address || m.location || '',
      district: m.district || m.city_region || m.state_district || 'Kannur',
      state: m.state || 'Kerala',
      landmark: m.landmark || '',
      services: Array.isArray(m.services) ? m.services : [m.category || 'Retail'],
      service_timing: m.service_timing || '09:00 AM - 09:00 PM',
      latitude: m.latitude || m.lat || null,
      longitude: m.longitude || m.lon || m.lng || null,
      rating: m.rating || m.avg_rating || 4.5,
      reviews: m.reviews_count || m.reviews || 0,
      status: m.status ? m.status.toLowerCase() : (m.is_approved || m.is_active ? 'active' : 'pending'),
      owner: m.owner_name || m.contact_person || m.owner || 'N/A',
      owner_name: m.owner_name || m.contact_person || m.owner || 'N/A',
      phone: phoneVal,
      phone_number: phoneVal,
      whatsapp: m.whatsapp || phoneVal,
      email: m.email || '',
      user_code: m.user_code || 'FLS_1',
      about: m.about || m.description || '',
      key_highlights: Array.isArray(m.key_highlights) ? m.key_highlights : Array.isArray(m.highlights) ? m.highlights : [],
      highlights: Array.isArray(m.key_highlights) ? m.key_highlights : Array.isArray(m.highlights) ? m.highlights : [],
      website: m.website || '',
      facebook: m.facebook || '',
      instagram: m.instagram || '',
      twitter: m.twitter || '',
      youtube: m.youtube || '',
      joined: (m.created_at || m.createdAt || m.joined)
        ? (m.created_at || m.createdAt || m.joined).toString().split('T')[0]
        : '2026-09-25',
      photos: formattedPhotos,
      merchant_photos: formattedPhotos,
      merchant_videos: rawVideos,
      videoUrl: (rawVideos && rawVideos[0]) || '',
      image: formattedPhotos[0] || m.image || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      location: m.city || m.location || m.district || 'Payyanur',
      categoryKey: (m.category || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
      description: m.about || m.description || '',
    };
  });
}

/**
 * 2. CREATE / ONBOARD MERCHANT: POST /api/v1/merchants/onboarding
 * Headers: Content-Type: application/json
 */
export async function createMerchant(merchantData) {
  const rawPhotos = merchantData.merchant_photos || merchantData.photos || [];
  const validPhotos = rawPhotos.filter((p) => p && typeof p === 'string' && p.trim() !== '').map(formatMediaUrl);
  
  const currentCategory = merchantData.category ? merchantData.category.trim() : 'Retail';
  const categoriesList = Array.isArray(merchantData.categories) && merchantData.categories.length > 0
    ? merchantData.categories
    : [currentCategory];

  const ownerName = merchantData.owner_name || merchantData.owner || merchantData.contactPerson || merchantData.name || 'Owner Name';
  const currentCity = merchantData.city || merchantData.district || 'Payyanur';
  const currentDistrict = merchantData.district || merchantData.city || 'Kannur';
  const currentAddress = merchantData.address || `${currentCity}, ${currentDistrict}, Kerala`;
  const businessName = (merchantData.business_name || merchantData.name || '').trim();
  const currentPhone = (
    merchantData.phone_number ||
    merchantData.phone ||
    merchantData.contact_number ||
    merchantData.mobile ||
    '+91 98470 12345'
  ).trim();
  const currentUserCode = merchantData.user_code || merchantData.userCode || getCurrentUserCode() || 'FLS_1';

  const highlights = Array.isArray(merchantData.key_highlights)
    ? merchantData.key_highlights
    : Array.isArray(merchantData.highlights)
    ? merchantData.highlights
    : ['Quality Product & Services', 'Customer Satisfaction Guaranteed'];

  const rawVideos = Array.isArray(merchantData.merchant_videos)
    ? merchantData.merchant_videos
    : merchantData.videoUrl
    ? [merchantData.videoUrl]
    : [];

  const payload = {
    business_name: businessName,
    category: currentCategory,
    categories: categoriesList,
    owner_name: ownerName,
    phone_number: currentPhone,
    email: merchantData.email ? merchantData.email.trim() : null,
    district: currentDistrict,
    city: currentCity,
    address: currentAddress,
    landmark: merchantData.landmark || currentAddress,
    services: Array.isArray(merchantData.services) && merchantData.services.length > 0 ? merchantData.services : [currentCategory],
    service_timing: merchantData.service_timing || '09:00 AM - 09:00 PM',
    merchant_photos: validPhotos,
    merchant_videos: rawVideos,
    user_code: currentUserCode,
    status: merchantData.status ? merchantData.status.toUpperCase() : 'APPROVED',

    // Alias fields for backend compatibility
    name: businessName,
    owner: ownerName,
    phone: currentPhone,
    whatsapp: merchantData.whatsapp || currentPhone,
    state: merchantData.state || 'Kerala',
    location: merchantData.location || currentAddress,
    latitude: merchantData.latitude || merchantData.lat ? Number(merchantData.latitude || merchantData.lat) : null,
    longitude: merchantData.longitude || merchantData.lon || merchantData.lng ? Number(merchantData.longitude || merchantData.lon || merchantData.lng) : null,
    about: merchantData.about || merchantData.description || 'Verified merchant listing on Logo My Locality.',
    rating: merchantData.rating ? Number(merchantData.rating) : 5.0,
    reviews_count: merchantData.reviews_count || merchantData.reviews ? Number(merchantData.reviews_count || merchantData.reviews) : 1,
    key_highlights: highlights,
    photos: validPhotos,
    website: merchantData.website || '',
    facebook: merchantData.facebook || '',
    instagram: merchantData.instagram || '',
    twitter: merchantData.twitter || '',
    youtube: merchantData.youtube || '',
  };

  let response;
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
  } catch {
    response = await apiFetch('/api/v1/merchants/onboard', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    let errorMsg = 'Failed to onboard merchant';
    if (Array.isArray(resData.detail)) {
      errorMsg = resData.detail.map((item) => (typeof item === 'object' ? item.msg || item.message : String(item))).join('\n');
    } else if (typeof resData.detail === 'string') {
      errorMsg = resData.detail;
    } else if (Array.isArray(resData.errors)) {
      errorMsg = resData.errors.join('\n');
    } else if (resData.message) {
      errorMsg = resData.message;
    }
    throw new Error(errorMsg);
  }

  const created = resData.merchant || resData.data?.merchant || resData.data || resData;
  return {
    id: created.id || created.merchant_id || `MCH-${Date.now()}`,
    name: created.business_name || created.name || payload.business_name,
    business_name: created.business_name || created.name || payload.business_name,
    category: created.category || payload.category,
    categories: created.categories || payload.categories,
    city: created.city || payload.city,
    district: created.district || payload.district,
    address: created.address || payload.address,
    landmark: created.landmark || payload.landmark,
    services: created.services || payload.services,
    service_timing: created.service_timing || payload.service_timing,
    phone_number: created.phone_number || created.phone || payload.phone_number,
    phone: created.phone_number || created.phone || payload.phone_number,
    owner_name: created.owner_name || created.owner || payload.owner_name,
    owner: created.owner_name || created.owner || payload.owner_name,
    user_code: created.user_code || payload.user_code,
    status: created.status ? created.status.toLowerCase() : 'approved',
    joined: new Date().toISOString().split('T')[0],
    photos: validPhotos,
    merchant_photos: validPhotos,
    merchant_videos: rawVideos,
    image: validPhotos[0] || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
  };
}

/**
 * Fetch list of merchant registration approval requests (/api/v1/admin/merchants/registration-requests)
 */
export async function fetchRegistrationRequests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.state) params.set('state', filters.state);
  if (filters.district) params.set('district', filters.district);
  if (filters.city) params.set('city', filters.city);

  const queryString = params.toString() ? `?${params.toString()}` : '';

  try {
    const response = await apiFetch(`/api/v1/admin/merchants/registration-requests${queryString}`, { method: 'GET' });
    if (response.ok) {
      const resData = await response.json();
      let items = resData.data || resData.items || resData.merchants || resData;
      if (Array.isArray(items)) {
        return items.map((m, idx) => ({
          id: m.id || m._id || m.merchant_id || `MCH-${idx + 100}`,
          name: m.business_name || m.name || 'Unnamed Store',
          business_name: m.business_name || m.name || 'Unnamed Store',
          owner_name: m.owner_name || m.owner || 'N/A',
          phone_number: m.phone_number || m.phone || '',
          email: m.email || '',
          category: m.category || 'Retail',
          city: m.city || 'Payyanur',
          district: m.district || 'Kannur',
          state: m.state || 'Kerala',
          status: (m.status || 'pending').toLowerCase(),
          joined: m.submitted_at || m.created_at || m.joined || new Date().toISOString().split('T')[0],
          photos: m.photos || [m.image || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80'],
          raw: m,
        }));
      }
    }
  } catch (err) {
    console.warn('Backend registration-requests API notice, fallback to fetchMerchantsList:', err);
  }

  // Fallback to fetchMerchantsList if registration-requests endpoint is not active
  return await fetchMerchantsList(filters);
}

/**
 * Approve / Reject Merchant via backend API
 */
export async function approveMerchant(merchantId) {
  const cleanId = String(merchantId).replace(/^MCH-/, '');
  const response = await apiFetch(`/api/v1/merchants/${cleanId}/approve`, { method: 'POST' });
  const resData = await response.json().catch(() => ({}));

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to approve merchant');
  }

  return resData;
}

export async function rejectMerchant(merchantId, rejectionReason = '') {
  const cleanId = String(merchantId).replace(/^MCH-/, '');
  const response = await apiFetch(`/api/v1/merchants/${cleanId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
  const resData = await response.json().catch(() => ({}));

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to reject merchant');
  }

  return resData;
}

/**
 * Update merchant profile details via backend API (/api/v1/merchants/:id)
 */
export async function updateMerchant(merchantId, updatedData) {
  const cleanId = String(merchantId).replace(/^MCH-/, '');
  const payload = {
    business_name: updatedData.business_name || updatedData.name || undefined,
    category: updatedData.category || undefined,
    categories: updatedData.categories || (updatedData.category ? [updatedData.category] : undefined),
    owner_name: updatedData.owner_name || updatedData.owner || undefined,
    phone_number: updatedData.phone_number || updatedData.phone || undefined,
    email: updatedData.email || undefined,
    district: updatedData.district || undefined,
    city: updatedData.city || undefined,
    address: updatedData.address || undefined,
    landmark: updatedData.landmark || undefined,
    service_timing: updatedData.service_timing || undefined,
    status: updatedData.status ? updatedData.status.toUpperCase() : undefined,
  };

  const response = await apiFetch(`/api/v1/merchants/${cleanId}`, {
    method: 'PUT',
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
    throw new Error(errorMsg || `Failed to update merchant profile (Status ${response.status})`);
  }

  return resData.data || resData.merchant || resData;
}

/**
 * Delete a merchant record via backend API (/api/v1/merchants/:id)
 */
export async function deleteMerchant(merchantId) {
  const cleanId = String(merchantId).replace(/^MCH-/, '');
  const response = await apiFetch(`/api/v1/merchants/${cleanId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const resData = await response.json().catch(() => ({}));
    throw new Error(resData.message || resData.detail || `Failed to delete merchant #${merchantId}`);
  }

  return true;
}

/**
 * 4. SEARCH MERCHANTS: GET /api/v1/merchants/search?q=store&location=Kannur
 * @param {string} query - Search text (business name, category, etc.)
 * @param {string} [location] - Optional location filter (district or city)
 * @returns {Promise<Array>} Normalized merchant results
 */
export async function searchMerchants(query, location) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (location && location !== 'all') params.set('location', location);

  const queryString = params.toString() ? `?${params.toString()}` : '';

  let response;
  try {
    response = await apiFetch(`/api/v1/merchants/search${queryString}`, { method: 'GET' });
    if (!response.ok && response.status === 404) {
      const fallbackParams = new URLSearchParams();
      if (query) fallbackParams.set('category', query);
      if (location && location !== 'all') fallbackParams.set('location', location);
      const fallbackQs = fallbackParams.toString() ? `?${fallbackParams.toString()}` : '';
      response = await apiFetch(`/api/v1/merchants${fallbackQs}`, { method: 'GET' });
    }
  } catch {
    const fallbackParams = new URLSearchParams();
    if (query) fallbackParams.set('category', query);
    if (location && location !== 'all') fallbackParams.set('location', location);
    const fallbackQs = fallbackParams.toString() ? `?${fallbackParams.toString()}` : '';
    response = await apiFetch(`/api/v1/merchants${fallbackQs}`, { method: 'GET' });
  }

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Search failed');
  }

  let rawItems = [];
  if (Array.isArray(resData)) {
    rawItems = resData;
  } else if (Array.isArray(resData.data)) {
    rawItems = resData.data;
  } else if (Array.isArray(resData.merchants)) {
    rawItems = resData.merchants;
  } else if (Array.isArray(resData.items)) {
    rawItems = resData.items;
  } else if (Array.isArray(resData.results)) {
    rawItems = resData.results;
  } else if (Array.isArray(resData.data?.merchants)) {
    rawItems = resData.data.merchants;
  } else if (Array.isArray(resData.data?.items)) {
    rawItems = resData.data.items;
  } else if (resData.data && typeof resData.data === 'object') {
    rawItems = [resData.data];
  }

  return rawItems.map((m, idx) => {
    const rawPhotos = m.photos || m.merchant_photos || (m.profile_picture ? [m.profile_picture] : []);
    const formattedPhotos = Array.isArray(rawPhotos) ? rawPhotos.map(formatMediaUrl) : [];
    const rawVideos = m.merchant_videos || (m.video_url || m.videoUrl ? [m.video_url || m.videoUrl] : []);

    return {
      id: m.id || m.merchant_id || m._id || `MCH-${idx + 1}`,
      name: m.business_name || m.name || m.title || 'Merchant Store',
      business_name: m.business_name || m.name,
      category: m.category || (m.categories && m.categories[0]) || m.category_name || 'Retail',
      categories: Array.isArray(m.categories) ? m.categories : [m.category || 'Retail'],
      city: m.city || m.city_region || m.location || m.district || 'N/A',
      address: m.address || m.location || '',
      district: m.district || m.city_region || m.state_district || 'N/A',
      state: m.state || 'Kerala',
      landmark: m.landmark || '',
      services: Array.isArray(m.services) ? m.services : [],
      service_timing: m.service_timing || '09:00 AM - 09:00 PM',
      latitude: m.latitude || m.lat || null,
      longitude: m.longitude || m.lon || m.lng || null,
      rating: m.rating || m.avg_rating || 4.5,
      reviews: m.reviews_count || m.reviews || 0,
      status: m.status ? m.status.toLowerCase() : (m.is_approved || m.is_active ? 'active' : 'pending'),
      owner: m.owner_name || m.contact_person || m.owner || 'N/A',
      owner_name: m.owner_name || m.contact_person || m.owner || 'N/A',
      phone: m.phone_number || m.phone || m.contact_phone || m.mobile || '',
      phone_number: m.phone_number || m.phone || m.contact_phone || m.mobile || '',
      whatsapp: m.whatsapp || m.phone_number || m.phone || '',
      email: m.email || '',
      user_code: m.user_code || 'FLS_1',
      about: m.about || m.description || '',
      key_highlights: Array.isArray(m.key_highlights) ? m.key_highlights : Array.isArray(m.highlights) ? m.highlights : [],
      highlights: Array.isArray(m.key_highlights) ? m.key_highlights : Array.isArray(m.highlights) ? m.highlights : [],
      website: m.website || '',
      joined: (m.created_at || m.createdAt || m.joined)
        ? (m.created_at || m.createdAt || m.joined).toString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      photos: formattedPhotos,
      merchant_photos: formattedPhotos,
      merchant_videos: rawVideos,
      videoUrl: (rawVideos && rawVideos[0]) || '',
      image: formattedPhotos[0] || m.image || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      location: m.city || m.location || m.district || 'N/A',
      categoryKey: (m.category || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
      description: m.about || m.description || m.business_name || '',
    };
  });
}

/**
 * 3. GET MERCHANT BY ID: GET /api/v1/merchants/{id}
 * @param {string|number} merchantId - The merchant ID
 * @returns {Promise<Object>} Normalized merchant object
 */
export async function getMerchantById(merchantId) {
  const cleanId = String(merchantId).replace(/^MCH-/, '');

  let response;
  try {
    response = await apiFetch(`/api/v1/merchants/${cleanId}`, { method: 'GET' });
  } catch (err) {
    throw new Error(`Merchant #${merchantId} not found`);
  }

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || `Merchant #${merchantId} not found`);
  }

  const m = resData.merchant || resData.data?.merchant || resData.data || resData;

  const rawPhotos = m.photos || m.merchant_photos || (m.profile_picture ? [m.profile_picture] : []);
  const formattedPhotos = Array.isArray(rawPhotos) ? rawPhotos.map(formatMediaUrl) : [];
  const rawVideos = m.merchant_videos || (m.video_url || m.videoUrl ? [m.video_url || m.videoUrl] : []);

  return {
    id: m.id || m.merchant_id || m._id || merchantId,
    name: m.business_name || m.name || m.title || 'Merchant Store',
    business_name: m.business_name || m.name,
    category: m.category || (m.categories && m.categories[0]) || 'Retail',
    categories: Array.isArray(m.categories) ? m.categories : [m.category || 'Retail'],
    city: m.city || m.city_region || m.location || m.district || 'N/A',
    address: m.address || m.location || '',
    district: m.district || m.city_region || 'N/A',
    state: m.state || 'Kerala',
    landmark: m.landmark || '',
    services: Array.isArray(m.services) ? m.services : [],
    service_timing: m.service_timing || '09:00 AM - 09:00 PM',
    latitude: m.latitude || m.lat || null,
    longitude: m.longitude || m.lon || m.lng || null,
    rating: m.rating || m.avg_rating || 4.5,
    reviews: m.reviews_count || m.reviews || 0,
    status: m.status ? m.status.toLowerCase() : 'active',
    owner: m.owner_name || m.contact_person || m.owner || 'N/A',
    owner_name: m.owner_name || m.contact_person || m.owner || 'N/A',
    phone: m.phone_number || m.phone || m.contact_phone || '',
    phone_number: m.phone_number || m.phone || m.contact_phone || '',
    whatsapp: m.whatsapp || m.phone_number || m.phone || '',
    email: m.email || '',
    user_code: m.user_code || 'FLS_1',
    about: m.about || m.description || '',
    key_highlights: Array.isArray(m.key_highlights) ? m.key_highlights : [],
    highlights: Array.isArray(m.key_highlights) ? m.key_highlights : Array.isArray(m.highlights) ? m.highlights : [],
    website: m.website || '',
    photos: formattedPhotos,
    merchant_photos: formattedPhotos,
    merchant_videos: rawVideos,
    videoUrl: (rawVideos && rawVideos[0]) || '',
    image: formattedPhotos[0] || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    location: m.city || m.location || m.district || 'N/A',
    categoryKey: (m.category || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
    description: m.about || m.description || '',
  };
}

