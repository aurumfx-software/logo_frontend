import { apiFetch } from './apiClient';

/**
 * Get current User ID from localStorage session
 */
export function getCurrentUserId() {
  try {
    const userStr = localStorage.getItem('logo_admin_user');
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
    const userStr = localStorage.getItem('logo_admin_user');
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
 * Fetch list of merchants from backend API (/api/v1/merchants/list?user_code=FLS_1)
 */
export async function fetchMerchantsList(userIdParam, userCodeParam) {
  const userCode = userCodeParam || getCurrentUserCode() || 'FLS_1';
  const queryParam = `?user_code=${encodeURIComponent(userCode)}`;

  // GET /api/v1/merchants/list?user_code=...
  const response = await apiFetch(`/api/v1/merchants/list${queryParam}`, {
    method: 'GET',
  });

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

  return rawItems.map((m, idx) => ({
    id: m.id || m.merchant_id || m._id || `MCH-${idx + 1}`,
    name: m.business_name || m.name || m.title || 'Merchant Store',
    category: m.category || (m.categories && m.categories[0]) || m.category_name || 'Retail',
    city: m.city || m.city_region || m.location || m.district || 'Payyanur',
    address: m.address || m.location || '',
    district: m.district || m.city_region || m.state_district || '',
    latitude: m.latitude || m.lat || null,
    longitude: m.longitude || m.lon || m.lng || null,
    rating: m.rating || m.avg_rating || 4.5,
    status: m.status || (m.is_approved || m.is_active ? 'active' : 'pending'),
    owner: m.owner_name || m.contact_person || m.owner || 'N/A',
    phone: m.phone_number || m.phone || m.contact_phone || m.mobile || '+91 98765 43210',
    joined: (m.created_at || m.createdAt || m.joined)
      ? (m.created_at || m.createdAt || m.joined).toString().split('T')[0]
      : '2026-09-25',
    photos: m.merchant_photos || m.photos || m.images || (m.profile_picture ? [m.profile_picture] : []),
    videoUrl: (m.merchant_videos && m.merchant_videos[0]) || m.video_url || m.videoUrl || m.video || '',
    image:
      (m.merchant_photos && m.merchant_photos[0]) ||
      m.profile_picture ||
      m.image ||
      (m.photos && m.photos[0]) ||
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
  }));
}

/**
 * Onboard a new Merchant via backend API (/api/v1/merchants/onboard)
 */
export async function createMerchant(merchantData) {
  let response;
  const validPhotos = (merchantData.photos || []).filter((p) => p && p.trim() !== '');
  const videoList = merchantData.videoUrl && merchantData.videoUrl.trim() !== '' ? [merchantData.videoUrl.trim()] : [];
  const currentCategory = merchantData.category ? merchantData.category.trim() : 'Retail';
  const ownerName = merchantData.owner || merchantData.contactPerson || merchantData.name || 'Merchant Owner';
  const currentCity = merchantData.city || merchantData.district || 'Kannur';
  const currentDistrict = merchantData.district || merchantData.city || 'Kannur';
  const currentAddress = merchantData.address || `${currentCity}, ${currentDistrict}`;
  const currentPhone = merchantData.phone ? merchantData.phone.trim() : '+91 98470 12345';
  const currentUserId = merchantData.user_id || merchantData.userId || getCurrentUserId() || 1;
  const currentUserCode = merchantData.user_code || merchantData.userCode || getCurrentUserCode() || '';

  const payload = {
    // Exact Onboard Endpoint Raw POST Schema (/api/v1/merchants/onboard)
    business_name: merchantData.name ? merchantData.name.trim() : '',
    category: currentCategory,
    categories: [currentCategory],
    owner_name: ownerName,
    phone_number: currentPhone,
    email: merchantData.email ? merchantData.email.trim() : null,
    district: currentDistrict,
    city: currentCity,
    location: merchantData.location || currentCity,
    city_region: merchantData.city_region || currentDistrict,
    address: currentAddress,
    landmark: merchantData.landmark || currentAddress,
    merchant_photos: validPhotos,
    verification_documents: merchantData.verification_documents || [],
    merchant_videos: videoList,
    services: merchantData.services || ['Retail', 'Services'],
    service_timing: merchantData.service_timing || 'General Store Hours',
    user_code: currentUserCode,
    userCode: currentUserCode,

    // Fallback/Standard Backend fields
    name: merchantData.name ? merchantData.name.trim() : '',
    phone: currentPhone,
    contact_person: ownerName,
    user_id: currentUserId,
    userId: currentUserId,
    latitude: merchantData.latitude || merchantData.lat || null,
    longitude: merchantData.longitude || merchantData.lon || merchantData.lng || null,
    status: merchantData.status || 'active',
    photos: validPhotos,
    video_url: merchantData.videoUrl || null,
  };

  // Single direct POST request to onboard endpoint
  response = await apiFetch('/api/v1/merchants/onboard', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const resData = await response.json();

  if (!response.ok || resData.success === false) {
    throw new Error(
      resData.message ||
        resData.detail ||
        (resData.errors && Array.isArray(resData.errors) ? resData.errors.join(', ') : null) ||
        'Failed to onboard merchant'
    );
  }

  const created = resData.data || resData.merchant || resData;
  return {
    id: created.id || created.merchant_id || `MCH-${Date.now()}`,
    name: created.business_name || created.name || payload.business_name,
    category: created.category || (created.categories && created.categories[0]) || payload.category,
    city: created.city || payload.city,
    district: created.district || payload.district,
    address: created.address || payload.address,
    latitude: created.latitude || payload.latitude,
    longitude: created.longitude || payload.longitude,
    phone: created.phone_number || created.phone || payload.phone_number,
    owner: created.owner_name || created.owner || payload.owner_name,
    rating: created.rating || 5.0,
    reviews: created.reviews || 1,
    status: created.status || payload.status,
    joined: new Date().toISOString().split('T')[0],
    photos: created.merchant_photos || created.photos || validPhotos,
    videoUrl: (created.merchant_videos && created.merchant_videos[0]) || created.video_url || payload.video_url || '',
    image: (created.merchant_photos && created.merchant_photos[0]) || validPhotos[0] || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
  };
}


