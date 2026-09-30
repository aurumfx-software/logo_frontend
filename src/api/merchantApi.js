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
        'ADM_4'
      );
    }
  } catch (err) {
    // ignore parse error
  }
  return localStorage.getItem('user_code') || localStorage.getItem('userCode') || 'ADM_4';
}

/**
 * Upload Merchant Media Files (Images, Videos, Docs): POST /api/v1/merchants/upload-media
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

  const rawPhotos = resData.photos || resData.all_urls || resData.urls || resData.files || [];
  const formattedPhotos = rawPhotos.map(formatMediaUrl);

  return {
    message: resData.message || 'Successfully uploaded files.',
    photos: formattedPhotos,
    all_urls: formattedPhotos,
    total_files: resData.total_files || formattedPhotos.length,
    raw: resData,
  };
}

/**
 * Fetch list of merchants from backend API (/api/v1/merchants)
 */
export async function fetchMerchantsList(userIdParam, userCodeParam) {
  let userCode = userCodeParam || getCurrentUserCode() || 'ADM_4';
  try {
    const userStr = localStorage.getItem('logo_admin_user') || localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.role === 'FIELD_STAFF' || u.role === 'Staff') {
        userCode = userCodeParam || u.user_code || u.userCode || 'FLS_1';
      }
    }
  } catch (e) {}

  const queryParam = userCode ? `?user_code=${encodeURIComponent(userCode)}` : '';

  let response;
  try {
    response = await apiFetch(`/api/v1/merchants${queryParam}`, { method: 'GET' });
    if (!response.ok && response.status === 404) {
      response = await apiFetch(`/api/v1/merchants/list${queryParam}`, { method: 'GET' });
    }
  } catch {
    response = await apiFetch(`/api/v1/merchants/list${queryParam}`, { method: 'GET' });
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
    const rawPhotos = m.photos || m.merchant_photos || (m.profile_picture ? [m.profile_picture] : []);
    const formattedPhotos = Array.isArray(rawPhotos) ? rawPhotos.map(formatMediaUrl) : [];

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
      latitude: m.latitude || m.lat || null,
      longitude: m.longitude || m.lon || m.lng || null,
      rating: m.rating || m.avg_rating || 4.5,
      reviews: m.reviews_count || m.reviews || 0,
      status: m.status ? m.status.toLowerCase() : (m.is_approved || m.is_active ? 'active' : 'pending'),
      owner: m.owner_name || m.contact_person || m.owner || 'N/A',
      phone: m.phone_number || m.phone || m.contact_phone || m.mobile || '+91 98470 12345',
      whatsapp: m.whatsapp || m.phone_number || m.phone || '',
      email: m.email || '',
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
      videoUrl: (m.merchant_videos && m.merchant_videos[0]) || m.video_url || m.videoUrl || m.video || '',
      image: formattedPhotos[0] || m.image || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    };
  });
}

/**
 * Onboard a new Merchant via backend API (/api/v1/merchants/onboarding)
 */
export async function createMerchant(merchantData) {
  const validPhotos = (merchantData.photos || []).filter((p) => p && typeof p === 'string' && p.trim() !== '').map(formatMediaUrl);
  const currentCategory = merchantData.category ? merchantData.category.trim() : 'Retail';
  const categoriesList = Array.isArray(merchantData.categories) && merchantData.categories.length > 0
    ? merchantData.categories
    : [currentCategory];

  const ownerName = merchantData.owner || merchantData.owner_name || merchantData.contactPerson || merchantData.name || 'Merchant Owner';
  const currentCity = merchantData.city || merchantData.district || 'Payyanur';
  const currentDistrict = merchantData.district || merchantData.city || 'Kannur';
  const currentAddress = merchantData.address || `${currentCity}, ${currentDistrict}, Kerala`;
  const businessName = (merchantData.name || merchantData.business_name || '').trim();
  const currentPhone = (
    merchantData.phone ||
    merchantData.phone_number ||
    merchantData.contact_number ||
    merchantData.mobile ||
    '+91 98470 12345'
  ).trim();
  const currentUserCode = merchantData.user_code || merchantData.userCode || getCurrentUserCode() || 'ADM_4';

  const highlights = Array.isArray(merchantData.key_highlights)
    ? merchantData.key_highlights
    : Array.isArray(merchantData.highlights)
    ? merchantData.highlights
    : ['Quality Product & Services', 'Customer Satisfaction Guaranteed'];

  const payload = {
    business_name: businessName,
    name: businessName,
    owner_name: ownerName,
    owner: ownerName,
    category: currentCategory,
    categories: categoriesList,
    phone: currentPhone,
    phone_number: currentPhone,
    whatsapp: merchantData.whatsapp || currentPhone,
    email: merchantData.email ? merchantData.email.trim() : null,
    address: currentAddress,
    city: currentCity,
    district: currentDistrict,
    state: merchantData.state || 'Kerala',
    location: merchantData.location || currentAddress,
    landmark: merchantData.landmark || currentAddress,
    latitude: merchantData.latitude || merchantData.lat ? Number(merchantData.latitude || merchantData.lat) : null,
    longitude: merchantData.longitude || merchantData.lon || merchantData.lng ? Number(merchantData.longitude || merchantData.lon || merchantData.lng) : null,
    about: merchantData.about || merchantData.description || 'Verified merchant listing on Logo My Locality.',
    rating: merchantData.rating ? Number(merchantData.rating) : 5.0,
    reviews_count: merchantData.reviews_count || merchantData.reviews ? Number(merchantData.reviews_count || merchantData.reviews) : 1,
    key_highlights: highlights,
    website: merchantData.website || '',
    facebook: merchantData.facebook || '',
    instagram: merchantData.instagram || '',
    twitter: merchantData.twitter || '',
    youtube: merchantData.youtube || '',
    photos: validPhotos,
    merchant_photos: validPhotos,
    verification_documents: merchantData.verification_documents || [],
    merchant_videos: merchantData.videoUrl ? [merchantData.videoUrl] : [],
    status: merchantData.status ? merchantData.status.toUpperCase() : 'APPROVED',
    user_code: currentUserCode,
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
      errorMsg = resData.detail.join('\n');
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
    category: created.category || payload.category,
    city: created.city || payload.city,
    district: created.district || payload.district,
    address: created.address || payload.address,
    latitude: created.latitude || payload.latitude,
    longitude: created.longitude || payload.longitude,
    phone: created.phone_number || created.phone || payload.phone,
    owner: created.owner_name || created.owner || payload.owner_name,
    rating: created.rating || 5.0,
    reviews: created.reviews || 1,
    status: created.status ? created.status.toLowerCase() : 'active',
    joined: new Date().toISOString().split('T')[0],
    photos: validPhotos,
    videoUrl: merchantData.videoUrl || '',
    image: validPhotos[0] || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
  };
}

/**
 * Approve / Reject Merchant via backend API
 */
export async function approveMerchant(merchantId) {
  const response = await apiFetch(`/api/v1/merchants/${merchantId}/approve`, { method: 'POST' });
  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to approve merchant');
  }

  return resData;
}

export async function rejectMerchant(merchantId, rejectionReason = '') {
  const response = await apiFetch(`/api/v1/merchants/${merchantId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to reject merchant');
  }

  return resData;
}
