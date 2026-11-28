import { apiFetch } from './apiClient';
import { STATIC_BASE_URL } from '../config/apiConfig';

/**
 * SVG Theme for merchants with no photo uploaded
 */
export const EMPTY_MERCHANT_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 250' width='100%' height='100%'><defs><linearGradient id='bgGrad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23F8FAFC'/><stop offset='50%' stop-color='%23F1F5F9'/><stop offset='100%' stop-color='%23E2E8F0'/></linearGradient><pattern id='dotGrid' x='0' y='0' width='14' height='14' patternUnits='userSpaceOnUse'><circle cx='2' cy='2' r='1.2' fill='%2364748B' opacity='0.22'/></pattern></defs><rect width='100%' height='100%' fill='url(%23bgGrad)'/><rect width='100%' height='100%' fill='url(%23dotGrid)'/><g transform='translate(200, 100)'><circle r='30' fill='%23FFFFFF' filter='drop-shadow(0 4px 10px rgba(0,0,0,0.06))'/><path d='M-14 -7 L-10 -15 L10 -15 L14 -7 Z' fill='none' stroke='%232563EB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M-14 -7 L14 -7 L14 13 C14 14.5 12.5 15.5 11 15.5 L-11 15.5 C-12.5 15.5 -14 14.5 -14 13 Z' fill='none' stroke='%232563EB' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/><path d='M-5 15.5 L-5 4 L5 4 L5 15.5' fill='none' stroke='%232563EB' stroke-width='2' stroke-linecap='round'/></g><text x='200' y='160' font-family='system-ui, -apple-system, sans-serif' font-size='11' font-weight='700' fill='%23475569' text-anchor='middle' letter-spacing='0.6'>STOREFRONT</text><text x='200' y='178' font-family='system-ui, -apple-system, sans-serif' font-size='10' font-weight='500' fill='%2364748B' text-anchor='middle'>No Photo Uploaded</text></svg>";

/**
 * Filter out bag stock image if previously assigned as placeholder
 */
export function sanitizeMerchantPhoto(url) {
  if (!url || typeof url !== 'string') return '';
  const blocked = [
    '1553062407-98eeb64c6a62',
    'f183f22512ae4d35990bbef9cbb018fe',
    'photo-1517248135467-4c7edcad34c4',
    'photo-1555396273-367ea4eb4db5',
    'photo-1563379091339-03b21ab4a4f8',
    'photo-1631515243349-e0cb75fb8d3a',
    'photo-1590846406792-0adc7f938f1d',
    'photo-1544025162-d76694265947',
  ];
  if (blocked.some((b) => url.includes(b))) {
    return '';
  }
  return url;
}

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
 * Unified helper to extract & deduplicate merchant photos (up to 4+) and videos across all backend shapes
 */
export function extractMerchantMedia(m = {}) {
  const candidates = [
    m.photo_1,
    m.photo_2,
    m.photo_3,
    m.photo_4,
    m.photo_5,
    m.photo_6,
    ...(Array.isArray(m.merchant_photos) ? m.merchant_photos : []),
    ...(Array.isArray(m.photos) ? m.photos : []),
    m.profile_picture,
    m.image,
  ];
  const photos = Array.from(
    new Set(
      candidates
        .filter((p) => p && typeof p === 'string' && p.trim() !== '')
        .map((p) => sanitizeMerchantPhoto(formatMediaUrl(p.trim())))
        .filter(Boolean)
    )
  );

  const videoCandidates = [
    ...(Array.isArray(m.merchant_videos) ? m.merchant_videos : []),
    m.video_url,
    m.videoUrl,
  ];
  const videos = Array.from(
    new Set(
      videoCandidates
        .filter((v) => v && typeof v === 'string' && v.trim() !== '' && !v.startsWith('data:'))
        .map((v) => formatMediaUrl(v.trim()))
        .filter(Boolean)
    )
  );

  return {
    photos,
    videos,
    videoUrl: videos[0] || '',
    coverImage: photos[0] || EMPTY_MERCHANT_IMAGE,
  };
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

  const response = await apiFetch(`/api/v1/merchants${queryString}`, { method: 'GET' });

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
    const media = extractMerchantMedia(m);
    const phoneVal = m.phone_number || m.phone || m.contact_number || m.contact_phone || m.mobile || '+91 98470 12345';

    return {
      id: m.id || m.merchant_id || m._id || `MCH-${idx + 1}`,
      merchant_id: m.id || m.merchant_id || null,
      user_id: m.user_id !== undefined ? m.user_id : (m.userId || (m.linked_user?.id) || null),
      name: m.business_name || m.name || m.title || 'Merchant Store',
      business_name: m.business_name || m.name,
      raw: m,
      category: m.category || (m.categories && m.categories[0]) || m.category_name || 'Retail',
      categories: Array.isArray(m.categories) ? m.categories : [m.category || 'Retail'],
      city: m.city || m.city_region || m.location || m.district || 'Payyanur',
      place: m.place || m.landmark || m.location || m.city || 'Payyanur',
      address: m.address || m.location || '',
      district: m.district || m.city_region || m.state_district || 'Kannur',
      state: m.state || 'Kerala',
      landmark: m.landmark || m.place || '',
      services: Array.isArray(m.services) ? m.services : [m.category || 'Retail'],
      service_timing: m.service_timing || '09:00 AM - 09:00 PM',
      latitude: m.latitude || m.lat || null,
      longitude: m.longitude || m.lon || m.lng || null,
      rating: m.rating || m.avg_rating || 4.5,
      reviews: m.reviews_count || m.reviews || 0,
      status: (m.approval_status || '').toUpperCase() === 'APPROVED' || (m.status || '').toUpperCase() === 'APPROVED'
        ? 'approved'
        : (m.status ? m.status.toLowerCase() : (m.is_approved || m.is_active ? 'active' : 'pending')),
      approval_status: m.approval_status || (m.status ? m.status.toUpperCase() : 'APPROVED'),
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
      created_at: m.created_at || m.createdAt || null,
      photo_1: m.photo_1 ? formatMediaUrl(m.photo_1) : media.photos[0] || '',
      photo_2: m.photo_2 ? formatMediaUrl(m.photo_2) : media.photos[1] || '',
      photo_3: m.photo_3 ? formatMediaUrl(m.photo_3) : media.photos[2] || '',
      photo_4: m.photo_4 ? formatMediaUrl(m.photo_4) : media.photos[3] || '',
      photos: media.photos,
      merchant_photos: media.photos,
      merchant_videos: media.videos,
      video_url: media.videoUrl,
      videoUrl: media.videoUrl,
      image: media.coverImage,
      location: m.city || m.location || m.district || 'Payyanur',
      categoryKey: (m.category || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
      description: m.about || m.description || '',
      can_create_promotions: Boolean(m.can_create_promotions ?? m.promotion_access ?? false),
      promotion_access: Boolean(m.can_create_promotions ?? m.promotion_access ?? false),
      cashback_percent: m.cashback_percent !== undefined && m.cashback_percent !== null ? Number(m.cashback_percent) : 3.0,
      company_fee_percent: m.company_fee_percent !== undefined && m.company_fee_percent !== null ? Number(m.company_fee_percent) : 2.0,
      total_deduction_percent: m.total_deduction_percent !== undefined && m.total_deduction_percent !== null ? Number(m.total_deduction_percent) : 5.0,
      login_id: m.login_id || m.linked_user?.login_id || m.user?.login_id || m.raw?.login_id || null,
      active_subscriptions: Array.isArray(m.active_subscriptions) ? m.active_subscriptions : [],
      subscription_plan_name: m.subscription_plan_name || null,
      subscription_amount_paid: m.subscription_amount_paid !== undefined && m.subscription_amount_paid !== null ? Number(m.subscription_amount_paid) : null,
      has_active_subscription: Boolean(m.has_active_subscription),
      merchant_grants: m.merchant_grants || {},
    };
  });

  // Guarantee newest created merchant appears at the top (avasanam create cheyytha merchant listinte athyam varanam)
  mappedItems.sort((a, b) => {
    const timeA = new Date(a.created_at || a.createdAt || a.joined || 0).getTime();
    const timeB = new Date(b.created_at || b.createdAt || b.joined || 0).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });

  return mappedItems;
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
    status: merchantData.status ? merchantData.status.toUpperCase() : 'PENDING',

    // Alias fields for backend compatibility
    name: businessName,
    owner: ownerName,
    phone: currentPhone,
    whatsapp: merchantData.whatsapp || currentPhone,
    state: merchantData.state || 'Kerala',
    place: merchantData.place || merchantData.city || 'Payyanur',
    location: merchantData.place || merchantData.location || currentAddress,
    landmark: merchantData.place || merchantData.landmark || '',
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
    cashback_percent: merchantData.cashback_percent !== undefined ? Number(merchantData.cashback_percent) : 3.0,
    company_fee_percent: merchantData.company_fee_percent !== undefined ? Number(merchantData.company_fee_percent) : 2.0,
    total_deduction_percent: merchantData.total_deduction_percent !== undefined ? Number(merchantData.total_deduction_percent) : 5.0,
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
    place: created.place || payload.place || created.landmark || payload.landmark || created.city || payload.city,
    location: created.location || payload.location || payload.place || created.city || payload.city,
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
    status: created.status ? created.status.toLowerCase() : 'pending',
    joined: new Date().toISOString().split('T')[0],
    photos: validPhotos.map(sanitizeMerchantPhoto).filter(Boolean),
    merchant_photos: validPhotos.map(sanitizeMerchantPhoto).filter(Boolean),
    merchant_videos: rawVideos,
    image: sanitizeMerchantPhoto(validPhotos[0]) || EMPTY_MERCHANT_IMAGE,
    can_create_promotions: Boolean(created.can_create_promotions ?? created.promotion_access ?? false),
    promotion_access: Boolean(created.can_create_promotions ?? created.promotion_access ?? false),
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
  if (filters.limit) params.set('limit', filters.limit);

  const queryString = params.toString() ? `?${params.toString()}` : '';

  try {
    let response = await apiFetch(`/api/v1/admin/merchants/registration-requests${queryString}`, { method: 'GET' });
    if (!response || !response.ok) {
      response = await apiFetch(`/api/v1/merchants/registration-requests${queryString}`, { method: 'GET' });
    }
    if (response && response.ok) {
      const resData = await response.json();
      let items = resData.data || resData.items || resData.requests || resData.merchants || resData;
      if (Array.isArray(items)) {
        return items.map((m, idx) => ({
          id: m.id || m._id || m.merchant_id || `MCH-${idx + 100}`,
          name: m.business_name || m.name || 'Unnamed Store',
          business_name: m.business_name || m.name || 'Unnamed Store',
          owner_name: m.owner_name || m.owner || 'N/A',
          phone_number: m.phone_number || m.phone || m.contact_number || '',
          email: m.email || '',
          category: m.category || (m.categories && m.categories[0]) || 'Retail',
          city: m.city || 'Payyanur',
          district: m.district || 'Kannur',
          state: m.state || 'Kerala',
          address: m.address || m.location || '',
          status: (m.status || m.approval_status || 'pending').toLowerCase(),
          approval_status: m.approval_status || m.status || 'PENDING',
          joined: m.submitted_at || m.created_at || m.joined || new Date().toISOString().split('T')[0],
          created_at: m.created_at,
          updated_at: m.updated_at,
          photos: (Array.isArray(m.photos) ? m.photos : Array.isArray(m.merchant_photos) ? m.merchant_photos : [m.photo_1, m.image]).map(sanitizeMerchantPhoto).filter(Boolean),
          active_subscriptions: Array.isArray(m.active_subscriptions) ? m.active_subscriptions : [],
          subscription_plan_name: m.subscription_plan_name || null,
          subscription_amount_paid: m.subscription_amount_paid !== undefined && m.subscription_amount_paid !== null ? Number(m.subscription_amount_paid) : null,
          merchant_grants: m.merchant_grants || {},
          login_id: m.login_id || m.linked_user?.login_id || m.user?.login_id || null,
          latitude: m.latitude ?? null,
          longitude: m.longitude ?? null,
          owner: m.owner_name || m.owner || 'N/A',
          phone: m.phone_number || m.phone || m.contact_number || '',
          whatsapp: m.whatsapp || m.phone_number || m.phone || '',
          service_timing: m.service_timing || 'General Store Hours',
          user_code: m.user_code || '',
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
  const cleanId = String(merchantId).trim().replace(/^MCH-/, '');
  const storeName = updatedData.business_name || updatedData.name;
  const ownerName = updatedData.owner_name || updatedData.owner || updatedData.contact_person;
  const phoneVal = updatedData.phone_number || updatedData.phone || updatedData.contact_number;

  const payload = {
    business_name: storeName || undefined,
    name: storeName || undefined,
    category: updatedData.category || undefined,
    categories: updatedData.categories || (updatedData.category ? [updatedData.category] : undefined),
    owner_name: ownerName || undefined,
    owner: ownerName || undefined,
    contact_person: ownerName || undefined,
    phone_number: phoneVal || undefined,
    phone: phoneVal || undefined,
    contact_number: phoneVal || undefined,
    whatsapp: updatedData.whatsapp || undefined,
    email: updatedData.email || undefined,
    district: updatedData.district || undefined,
    city: updatedData.city || undefined,
    place: updatedData.place || undefined,
    state: updatedData.state || undefined,
    location: updatedData.place || updatedData.location || undefined,
    address: updatedData.address || undefined,
    landmark: updatedData.place || updatedData.landmark || undefined,
    service_timing: updatedData.service_timing || undefined,
    status: updatedData.status ? updatedData.status.toUpperCase() : undefined,
    approval_status: updatedData.approval_status ? updatedData.approval_status.toUpperCase() : undefined,
    about: updatedData.about || updatedData.description || undefined,
    description: updatedData.description || updatedData.about || undefined,
    website: updatedData.website || undefined,
    facebook: updatedData.facebook || undefined,
    instagram: updatedData.instagram || undefined,
    twitter: updatedData.twitter || undefined,
    youtube: updatedData.youtube || undefined,
    photo_1: updatedData.photo_1 || (Array.isArray(updatedData.photos) ? updatedData.photos[0] : undefined),
    photo_2: updatedData.photo_2 || (Array.isArray(updatedData.photos) ? updatedData.photos[1] : undefined),
    photo_3: updatedData.photo_3 || (Array.isArray(updatedData.photos) ? updatedData.photos[2] : undefined),
    photo_4: updatedData.photo_4 || (Array.isArray(updatedData.photos) ? updatedData.photos[3] : undefined),
    photos: updatedData.photos || updatedData.merchant_photos || undefined,
    merchant_photos: updatedData.merchant_photos || updatedData.photos || undefined,
    video_url: updatedData.video_url || updatedData.videoUrl || undefined,
    can_create_promotions: updatedData.can_create_promotions !== undefined ? updatedData.can_create_promotions : updatedData.promotion_access,
    cashback_percent: updatedData.cashback_percent !== undefined ? Number(updatedData.cashback_percent) : undefined,
    company_fee_percent: updatedData.company_fee_percent !== undefined ? Number(updatedData.company_fee_percent) : undefined,
    total_deduction_percent: updatedData.total_deduction_percent !== undefined ? Number(updatedData.total_deduction_percent) : undefined,
  };

  let response = await apiFetch(`/api/v1/merchants/${cleanId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!response || !response.ok) {
    // Attempt fallback to admin route if public/merchant route had issue
    try {
      const adminResp = await apiFetch(`/api/v1/admin/merchants/${cleanId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (adminResp && adminResp.ok) {
        response = adminResp;
      }
    } catch {
      // ignore and use initial response
    }
  }

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
 * Toggle Admin Promotion Access for a Merchant: PATCH /api/v1/admin/merchants/${id}/promotion-access
 */
export async function togglePromotionAccess(merchantId, enabled) {
  const cleanId = String(merchantId).replace(/^MCH-/, '');
  let response = await apiFetch(`/api/v1/admin/merchants/${cleanId}/promotion-access`, {
    method: 'PATCH',
    body: JSON.stringify({ can_create_promotions: enabled, promotion_access: enabled }),
  });

  if (!response || !response.ok) {
    response = await apiFetch(`/api/v1/merchants/${cleanId}`, {
      method: 'PATCH',
      body: JSON.stringify({ can_create_promotions: enabled, promotion_access: enabled }),
    });
  }

  const resData = await response.json().catch(() => ({}));
  if (!response || !response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to toggle promotion access');
  }

  return resData.data || resData.merchant || resData;
}

/**
 * Submit a request for promotion creation access (from Merchant Portal)
 */
export async function requestPromotionAccess(merchantId, reason = '') {
  const cleanId = String(merchantId).replace(/^MCH-/, '');
  const response = await apiFetch(`/api/v1/merchants/${cleanId}/request-promo-access`, {
    method: 'POST',
    body: JSON.stringify({ merchant_id: Number(cleanId), reason: reason || 'Merchant requested promotion access via portal' }),
  });
  const resData = await response.json().catch(() => ({}));
  if (!response || !response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to submit promotion access request');
  }
  return resData.data || resData;
}

/**
 * Fetch list of promo access requests (for Admin Registration Requests page)
 */
export async function fetchPromoAccessRequests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.limit) params.set('limit', filters.limit);
  const queryString = params.toString() ? `?${params.toString()}` : '';

  try {
    const response = await apiFetch(`/api/v1/admin/merchants/promo-access-requests${queryString}`, { method: 'GET' });
    if (response && response.ok) {
      const resData = await response.json();
      return resData.data || resData.items || resData.requests || [];
    }
  } catch (err) {
    console.warn('Failed to fetch promo access requests:', err);
  }
  return [];
}

/**
 * Approve a promo access request (Admin)
 */
export async function approvePromoAccessRequest(requestId) {
  const response = await apiFetch(`/api/v1/admin/merchants/promo-access-requests/${requestId}/approve`, {
    method: 'POST',
  });
  const resData = await response.json().catch(() => ({}));
  if (!response || !response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to approve promotion access request');
  }
  return resData.data || resData;
}

/**
 * Reject a promo access request (Admin)
 */
export async function rejectPromoAccessRequest(requestId, reason = '') {
  const response = await apiFetch(`/api/v1/admin/merchants/promo-access-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  const resData = await response.json().catch(() => ({}));
  if (!response || !response.ok || resData.success === false) {
    throw new Error(resData.message || resData.detail || 'Failed to reject promotion access request');
  }
  return resData.data || resData;
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

  const response = await apiFetch(`/api/v1/merchants/search${queryString}`, { method: 'GET' });

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
    const media = extractMerchantMedia(m);

    return {
      id: m.id || m.merchant_id || m._id || `MCH-${idx + 1}`,
      name: m.business_name || m.name || m.title || 'Merchant Store',
      business_name: m.business_name || m.name,
      category: m.category || (m.categories && m.categories[0]) || m.category_name || 'Retail',
      categories: Array.isArray(m.categories) ? m.categories : [m.category || 'Retail'],
      city: m.city || m.city_region || m.location || m.district || 'N/A',
      place: m.place || m.landmark || m.location || m.city || 'N/A',
      address: m.address || m.location || '',
      district: m.district || m.city_region || m.state_district || 'N/A',
      state: m.state || 'Kerala',
      landmark: m.landmark || m.place || '',
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
      photo_1: m.photo_1 ? formatMediaUrl(m.photo_1) : media.photos[0] || '',
      photo_2: m.photo_2 ? formatMediaUrl(m.photo_2) : media.photos[1] || '',
      photo_3: m.photo_3 ? formatMediaUrl(m.photo_3) : media.photos[2] || '',
      photo_4: m.photo_4 ? formatMediaUrl(m.photo_4) : media.photos[3] || '',
      photos: media.photos,
      merchant_photos: media.photos,
      merchant_videos: media.videos,
      video_url: media.videoUrl,
      videoUrl: media.videoUrl,
      image: media.coverImage,
      location: m.city || m.location || m.district || 'N/A',
      categoryKey: (m.category || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
      description: m.about || m.description || m.business_name || '',
      can_create_promotions: Boolean(m.can_create_promotions ?? m.promotion_access ?? false),
      promotion_access: Boolean(m.can_create_promotions ?? m.promotion_access ?? false),
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
  const media = extractMerchantMedia(m);

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
    photo_1: m.photo_1 ? formatMediaUrl(m.photo_1) : media.photos[0] || '',
    photo_2: m.photo_2 ? formatMediaUrl(m.photo_2) : media.photos[1] || '',
    photo_3: m.photo_3 ? formatMediaUrl(m.photo_3) : media.photos[2] || '',
    photo_4: m.photo_4 ? formatMediaUrl(m.photo_4) : media.photos[3] || '',
    photos: media.photos,
    merchant_photos: media.photos,
    merchant_videos: media.videos,
    video_url: media.videoUrl,
    videoUrl: media.videoUrl,
    image: media.coverImage,
    location: m.city || m.location || m.district || 'N/A',
    categoryKey: (m.category || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
    description: m.about || m.description || '',
    can_create_promotions: Boolean(m.can_create_promotions ?? m.promotion_access ?? false),
    promotion_access: Boolean(m.can_create_promotions ?? m.promotion_access ?? false),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// MOBILE APP PARITY: MERCHANT AUTHENTICATION & PORTAL APIS
// ═════════════════════════════════════════════════════════════════════════════

const MERCHANT_TOKEN_KEY = 'logo_merchant_token';
const MERCHANT_USER_KEY = 'logo_merchant_user';

export function getMerchantToken() {
  return localStorage.getItem(MERCHANT_TOKEN_KEY) || localStorage.getItem('logo_admin_token') || '';
}

export function getMerchantAuthHeaders(extra = {}) {
  const tok = getMerchantToken();
  return {
    'Content-Type': 'application/json',
    ...(tok ? { Authorization: tok.startsWith('Bearer ') ? tok : `Bearer ${tok}` } : {}),
    ...extra,
  };
}

export async function getMyMerchants() {
  const res = await apiFetch('/api/v1/merchants/my-merchants', {
    method: 'GET',
    headers: getMerchantAuthHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  return Array.isArray(json) ? json : json?.merchants || json?.data || [];
}

export async function getMerchantProfile() {
  const res = await apiFetch('/api/v1/merchants/me', {
    method: 'GET',
    headers: getMerchantAuthHeaders(),
  });
  if (res.ok) {
    const json = await res.json().catch(() => ({}));
    return json?.merchant || json?.data?.merchant || json?.data || json;
  }
  const list = await getMyMerchants().catch(() => []);
  if (Array.isArray(list) && list.length > 0) return list[0];
  return getStoredMerchantUser();
}

export function getStoredMerchantUser() {
  try {
    const raw = localStorage.getItem(MERCHANT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setMerchantSession(authData) {
  const token = authData?.access_token || authData?.token || '';
  if (token) {
    localStorage.setItem(MERCHANT_TOKEN_KEY, token.trim());
  }
  const userObj = authData?.user || authData?.merchant || authData?.data;
  if (userObj && typeof userObj === 'object') {
    localStorage.setItem(MERCHANT_USER_KEY, JSON.stringify(userObj));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('merchant-session-changed'));
  }
}

export function clearMerchantSession() {
  localStorage.removeItem(MERCHANT_TOKEN_KEY);
  localStorage.removeItem(MERCHANT_USER_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('merchant-session-changed'));
  }
}

export async function merchantEmailLogin({ email, identifier, login_id, password }) {
  const rawIdentifier = String(login_id || identifier || email || '').trim();
  if (!rawIdentifier || rawIdentifier.includes('@')) {
    const err = new Error('Email login is not allowed. Please sign in using your Merchant Login ID and password.');
    err.status = 400;
    throw err;
  }
  const loginIdentifier = rawIdentifier.toUpperCase();

  let res = await apiFetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: loginIdentifier,
      login_id: loginIdentifier,
      login_id_only: true,
      password,
    }),
  });
  let data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = data?.detail;
    const isSetupRequired =
      res.status === 403 &&
      (detail?.password_setup_required === true ||
        detail?.code === 'MERCHANT_PASSWORD_NOT_SET' ||
        String(detail?.message || data?.message || '').toLowerCase().includes('password'));
    if (isSetupRequired) {
      const setupErr = new Error(
        detail?.message ||
          'Password setup is required for this merchant. Please verify with OTP to set your password.'
      );
      setupErr.status = 403;
      setupErr.passwordSetupRequired = true;
      setupErr.code = 'MERCHANT_PASSWORD_NOT_SET';
      throw setupErr;
    }

    throw new Error(
      typeof data.detail === 'string'
        ? data.detail
        : data.detail?.message || data.message || 'Invalid Merchant Login ID or password'
    );
  }

  setMerchantSession(data);
  return data;
}

export async function merchantSendOTP(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const res = await apiFetch('/api/v1/merchants/login/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : data.message || 'Could not send merchant OTP'
    );
  }
  return data;
}

export async function merchantVerifyOTP(email, otp) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const res = await apiFetch('/api/v1/merchants/login/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, otp: String(otp || '').trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : data.message || 'Invalid or expired OTP'
    );
  }
  setMerchantSession(data);
  return data;
}

export async function merchantForgotPassword(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const res = await apiFetch('/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : data.message || 'Could not send reset code'
    );
  }
  return data;
}

export async function merchantResetPassword({ email, otp, new_password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const res = await apiFetch('/api/v1/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cleanEmail,
      otp: String(otp || '').trim(),
      new_password: String(new_password || '').trim(),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : data.message || 'Failed to reset merchant password'
    );
  }
  return data;
}

export async function logoutMerchantSession() {
  const token = getMerchantToken();
  if (token) {
    try {
      await apiFetch('/api/v1/merchants/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (_) {}
  }
  clearMerchantSession();
}

export async function createMerchantRegistrationOrder({ email, phone_number, business_name, package_id, package_code } = {}) {
  const response = await apiFetch('/api/v1/merchants/register/razorpay-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: String(email || '').trim().toLowerCase() || undefined,
      phone_number: String(phone_number || '').trim() || undefined,
      business_name: String(business_name || '').trim() || undefined,
      package_id: package_id ? Number(package_id) : undefined,
      package_code: package_code ? String(package_code).trim() : undefined,
    }),
  });
  const resData = await response.json().catch(() => ({}));
  if (!response.ok || resData.success === false) {
    throw new Error(
      typeof resData.detail === 'string'
        ? resData.detail
        : resData.message || 'Failed to initialize merchant subscription payment'
    );
  }
  return resData?.data || resData;
}

export async function onboardMerchant(merchantData = {}) {
  const validPhotos = (Array.isArray(merchantData.photos) ? merchantData.photos : merchantData.merchant_photos || [])
    .filter((p) => p && typeof p === 'string' && p.trim() !== '')
    .map(formatMediaUrl);

  const rawVideos = Array.isArray(merchantData.merchant_videos)
    ? merchantData.merchant_videos
    : merchantData.video_url
    ? [merchantData.video_url]
    : [];
  const cleanVideos = rawVideos.filter((v) => v && typeof v === 'string' && v.trim() !== '').map(formatMediaUrl);

  const payload = {
    ...merchantData,
    merchant_photos: validPhotos,
    photos: validPhotos,
    photo_1: validPhotos[0] || merchantData.photo_1 || null,
    photo_2: validPhotos[1] || merchantData.photo_2 || null,
    photo_3: validPhotos[2] || merchantData.photo_3 || null,
    photo_4: validPhotos[3] || merchantData.photo_4 || null,
    merchant_videos: cleanVideos,
    video_url: cleanVideos[0] || merchantData.video_url || null,
  };

  let response = await apiFetch('/api/v1/merchants/onboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok && response.status === 404) {
    response = await apiFetch('/api/v1/merchants/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  const resData = await response.json().catch(() => ({}));
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
  return resData?.data || resData;
}


