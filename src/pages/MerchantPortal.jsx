import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiOutlineOfficeBuilding,
  HiOutlineSpeakerphone,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlinePhotograph,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineRefresh,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
  HiOutlineChatAlt2,
  HiOutlineTrash,
  HiOutlineLockClosed,
  HiOutlineCreditCard,
  HiOutlineVideoCamera,
  HiOutlineDocumentText,
  HiOutlinePencil,
  HiOutlineExternalLink,
  HiOutlineX,
} from 'react-icons/hi';
import CircularSpinner from '../components/UI/CircularSpinner';
import GoogleMapsLocationInput from '../components/UI/GoogleMapsLocationInput';
import ChangePasswordCard from '../components/UI/ChangePasswordCard';
import PromotionImageCropperModal from '../components/UI/PromotionImageCropperModal';
import VideoAdCropModal from '../components/UI/VideoAdCropModal';
import CustomerAddProductModal from '../components/products/CustomerAddProductModal';
import MyProductsPanel from '../components/products/MyProductsPanel';
import SellerOrdersPanel from '../components/products/SellerOrdersPanel';
import {
  getMerchantProfile,
  getMyMerchants,
  getMerchantToken,
  getStoredMerchantUser,
  setMerchantSession,
  updateMerchant,
  uploadMerchantMedia,
  formatMediaUrl,
  merchantForgotPassword,
  merchantResetPassword,
} from '../api/merchantApi';
import { apiFetch, getAccessToken } from '../api/apiClient';
import {
  fetchMerchantPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  uploadPromotionMedia,
  fetchSliderSettings,
  updateMerchantSliderInterval,
} from '../api/promotionApi';
import {
  getBuyerOrders,
  fetchMyProducts,
  fetchMyOrders,
} from '../api/productApi';
import {
  getStoredSliderIntervalSec,
  setStoredMerchantSliderOverrideSec,
} from '../utils/useSliderInterval';
import { complaintsApi } from '../api/complaintsApi';
import { fetchCategoriesList } from '../api/categoryApi';
import {
  fetchAdminSubscriptionPackages,
  fetchMyActiveSubscriptions,
  hasActiveSellerSubscription,
  startCustomerRazorpaySubscription,
  cancelMySubscription,
  computeDaysRemaining,
} from '../api/subscriptionApi';
import {
  getStatesList,
  getDistrictsForState,
  getCitiesForDistrict,
  getStateForDistrict,
  DEFAULT_STATE,
  DEFAULT_DISTRICT,
} from '../utils/locations';
import { useAuth } from '../context/AuthContext';
import {
  MERCHANT_PERMISSION_ITEMS,
  mergeMerchantGrants,
  hasAnyAdGrant,
  getUnlockedPermissionItems,
  getRequiredAdPermissionKey,
} from '../utils/merchantPermissions';

const COMPLAINT_CATEGORIES = [
  'Promotion & Banner Issue',
  'Profile & Store Listing',
  'Customer Dispute',
  'General Support',
];

const AD_BG_PRESETS = [
  { label: 'Royal Blue', value: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)', text: '#ffffff' },
  { label: 'Sunset Pink', value: 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)', text: '#ffffff' },
  { label: 'Emerald', value: 'linear-gradient(135deg, #047857 0%, #0d9488 100%)', text: '#ffffff' },
  { label: 'Midnight Dark', value: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', text: '#ffffff' },
  { label: 'Crimson Red', value: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)', text: '#ffffff' },
  { label: 'Festive Gold', value: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', text: '#0f172a' },
];

const INITIAL_PROMO = {
  id: null,
  title: '',
  description: '',
  type: 'Featured',
  placement: 'Merchant Store',
  category: 'Retail & Shopping',
  location: 'Kerala',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '2027-12-31',
  mediaType: 'image', // 'image' | 'text' | 'video'
  imageUrl: '',
  videoUrl: '',
  bgColor: AD_BG_PRESETS[0].value,
  textColor: '#ffffff',
  targetUrl: '',
  status: 'active',
};

const cardStyle = {
  background: '#ffffff',
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  padding: 24,
  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  fontSize: 13.5,
  color: '#0f172a',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#475569',
  marginBottom: 6,
};

export default function MerchantPortal() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activePanel = searchParams.get('tab') || 'edit';
  const setTab = (tab) => setSearchParams({ tab });

  const isFormInitialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [categoriesList, setCategoriesList] = useState([
    'Retail & Shopping',
    'Automobile & Spares',
    'Car mechanic',
    'Solar & Electricals',
    'Healthcare & Medicals',
    'Hotels & Dining',
    'Interiors & Furniture',
  ]);
  const [saving, setSaving] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Store Profile Edit Form State (exact Mobile MerchantProfileModal parity)
  const [formData, setFormData] = useState({
    id: '',
    business_name: '',
    owner_name: '',
    category: '',
    phone_number: '',
    whatsapp: '',
    landline: '',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    address: '',
    landmark: '',
    city: '',
    district: DEFAULT_DISTRICT,
    state: DEFAULT_STATE,
    latitude: null,
    longitude: null,
    service_timing: '09:00 AM - 09:00 PM',
    about: '',
    photos: ['', '', '', ''],
    videoUrl: '',
    approval_status: 'PENDING',
    can_create_promotions: false,
    has_active_subscription: false,
  });

  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Promotions & Store Advertisement State
  const [promotions, setPromotions] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [newPromo, setNewPromo] = useState(INITIAL_PROMO);
  const [promoUploading, setPromoUploading] = useState(false);
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoSwipeSeconds, setPromoSwipeSeconds] = useState(() =>
    getStoredSliderIntervalSec(4, 'merchant_store')
  );
  const [savingSwipeSpeed, setSavingSwipeSpeed] = useState(false);
  const [imageCropState, setImageCropState] = useState({
    isOpen: false,
    src: '',
    rawFile: null,
  });
  const [videoCropState, setVideoCropState] = useState({
    isOpen: false,
    src: '',
    rawFile: null,
  });

  // Merchant Growth & Seller Subscriptions State
  const [subPackages, setSubPackages] = useState([]);
  const [activeSubData, setActiveSubData] = useState(null);
  const [userSubPackages, setUserSubPackages] = useState([]);
  const [userSubData, setUserSubData] = useState(null);
  const [sellerAccountUser, setSellerAccountUser] = useState(() => user || null);
  const [subscribingId, setSubscribingId] = useState(null);
  const [planActionModal, setPlanActionModal] = useState(null); // null | 'upgrade' | 'renew'

  // Merchant Product Selling State (Exact Customer Dashboard Parity)
  const [ordersSubTab, setOrdersSubTab] = useState('seller');
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loadingSellerPanel, setLoadingSellerPanel] = useState(false);

  // Complaints & Grievance State
  const [complaints, setComplaints] = useState([]);
  const [complaintCounts, setComplaintCounts] = useState({ all: 0, open: 0, 'in-progress': 0, resolved: 0 });
  const [complaintFilter, setComplaintFilter] = useState('all');
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    subject: '',
    category: 'Promotion & Banner Issue',
    priority: 'medium',
    description: '',
  });

  const showNotice = (msg) => {
    setErrorMsg('');
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(''), 5000);
  };

  const populateFormFromShop = (shop) => {
    if (!shop) return;
    const rawPhotos = [
      shop.photo_1,
      shop.photo_2,
      shop.photo_3,
      shop.photo_4,
      ...(Array.isArray(shop.merchant_photos) ? shop.merchant_photos : []),
      ...(Array.isArray(shop.photos) ? shop.photos : []),
    ].filter((u, idx, arr) => u && typeof u === 'string' && u.trim() !== '' && arr.indexOf(u) === idx);

    const photosArr = [rawPhotos[0] || '', rawPhotos[1] || '', rawPhotos[2] || '', rawPhotos[3] || ''];
    const dist = shop.district || shop.city_region || DEFAULT_DISTRICT;
    const st = shop.state || getStateForDistrict(dist, DEFAULT_STATE);

    setFormData({
      id: shop.id || '',
      business_name: shop.business_name || shop.name || '',
      owner_name: shop.owner_name || shop.contact_person || shop.owner || '',
      category: shop.category || (Array.isArray(shop.categories) ? shop.categories[0] : '') || '',
      phone_number: shop.contact_number || shop.phone_number || shop.phone || '',
      whatsapp: shop.whatsapp || shop.contact_number || shop.phone_number || shop.phone || '',
      landline: shop.landline || '',
      email: shop.email || '',
      website: shop.website || '',
      facebook: shop.facebook || '',
      instagram: shop.instagram || '',
      twitter: shop.twitter || '',
      youtube: shop.youtube || '',
      address: shop.address || '',
      landmark: shop.landmark || '',
      city: shop.city || shop.city_region || '',
      district: dist,
      state: st,
      latitude: shop.latitude || shop.lat || null,
      longitude: shop.longitude || shop.lon || shop.lng || null,
      service_timing: shop.service_timing || '09:00 AM - 09:00 PM',
      about: shop.about || shop.description || '',
      photos: photosArr,
      videoUrl: shop.video_url || shop.videoUrl || (Array.isArray(shop.merchant_videos) ? shop.merchant_videos[0] : '') || '',
      approval_status: shop.approval_status || shop.status || 'APPROVED',
      can_create_promotions: Boolean(shop.can_create_promotions ?? shop.promotion_access ?? false),
      has_active_subscription: Boolean(shop.has_active_subscription ?? false),
    });

    setNewPromo((prev) => ({
      ...prev,
      category: shop.category || prev.category,
      location: `${shop.city || ''}${shop.city && dist ? ', ' : ''}${dist || 'Kerala'}`,
    }));
  };

  const loadMerchantWorkspace = async (forceFormSync = false) => {
    setErrorMsg('');
    if (!isFormInitialized.current) setLoading(true);
    try {
      const isImpersonation = localStorage.getItem('is_impersonation') === 'true';
      const liveToken = isImpersonation
        ? getAccessToken() || getMerchantToken()
        : getMerchantToken() || getAccessToken();
      if (liveToken && !localStorage.getItem('logo_merchant_token') && user) {
        setMerchantSession({ access_token: liveToken, user });
      }
      const authHeaders = liveToken
        ? {
            'Content-Type': 'application/json',
            Authorization: liveToken.startsWith('Bearer ') ? liveToken : `Bearer ${liveToken}`,
          }
        : { 'Content-Type': 'application/json' };

      const [meShop, shopsList, cats, meUserRes, userSubRes, userPkgsRes] = await Promise.all([
        getMerchantProfile().catch(() => null),
        getMyMerchants().catch(() => []),
        fetchCategoriesList().catch(() => null),
        liveToken
          ? apiFetch('/api/v1/auth/me', { method: 'GET', headers: authHeaders })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          : null,
        fetchMyActiveSubscriptions('USER').catch(() => null),
        fetchAdminSubscriptionPackages({ audience: 'USER', activeOnly: true }).catch(() => []),
      ]);

      if (meUserRes && typeof meUserRes === 'object') {
        const mergedAuthUser = { ...(user || {}), ...meUserRes };
        setSellerAccountUser(mergedAuthUser);
        if (updateUser) updateUser(mergedAuthUser);
      } else if (user) {
        setSellerAccountUser(user);
      }
      if (userSubRes) setUserSubData(userSubRes);
      if (Array.isArray(userPkgsRes)) setUserSubPackages(userPkgsRes);

      if (Array.isArray(cats) && cats.length > 0) {
        setCategoriesList(cats.map((c) => (typeof c === 'string' ? c : c.name || c.title)).filter(Boolean));
      }

      const combinedShops = Array.isArray(shopsList) && shopsList.length > 0
        ? shopsList
        : meShop
          ? [meShop]
          : getStoredMerchantUser()
            ? [getStoredMerchantUser()]
            : [];

      setShops(combinedShops);
      const activeShop =
        (selectedShop && combinedShops.find((s) => String(s.id) === String(selectedShop.id))) ||
        combinedShops[0] ||
        meShop;

      if (activeShop) {
        setSelectedShop(activeShop);
        if (!isFormInitialized.current || forceFormSync) {
          isFormInitialized.current = true;
          populateFormFromShop(activeShop);
        }

        const targetId = activeShop.id;
        const targetName = (activeShop.business_name || activeShop.name || '').trim();

        const [promosRes, compRes, countsRes, pkgsRes, activeSubRes, sliderRes] = await Promise.all([
          targetId ? fetchMerchantPromotions(targetId).catch(() => []) : [],
          complaintsApi.list({ merchant: targetName || undefined }).catch(() => []),
          complaintsApi.getCounts().catch(() => ({ all: 0, open: 0, 'in-progress': 0, resolved: 0 })),
          fetchAdminSubscriptionPackages({ audience: 'MERCHANT', activeOnly: true }).catch(() => []),
          fetchMyActiveSubscriptions('MERCHANT', targetId).catch(() => null),
          targetId ? fetchSliderSettings(targetId).catch(() => null) : null,
        ]);

        setPromotions(Array.isArray(promosRes) ? promosRes : []);
        setComplaints(Array.isArray(compRes) ? compRes : []);
        setComplaintCounts(countsRes || { all: 0, open: 0, 'in-progress': 0, resolved: 0 });
        setSubPackages(Array.isArray(pkgsRes) ? pkgsRes : []);
        setActiveSubData(activeSubRes);
        if (sliderRes) {
          const mSec = Number(
            sliderRes.merchant_interval_seconds ?? sliderRes.merchant_store_seconds ?? sliderRes.interval_seconds ?? 4
          );
          if (Number.isFinite(mSec) && mSec >= 2) {
            setPromoSwipeSeconds(Math.min(60, Math.round(mSec)));
            if (targetId) {
              setStoredMerchantSliderOverrideSec(targetId, mSec, sliderRes);
            }
          }
        }
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to load merchant workspace');
    } finally {
      setLoading(false);
    }
  };

  const loadMerchantSellerData = async (panel = activePanel) => {
    if (!['seller-orders', 'dispatched', 'my-products', 'sell-ad', 'subscriptions'].includes(panel)) {
      return;
    }
    setLoadingSellerPanel(true);
    try {
      const [meUserRes, userSubRes] = await Promise.all([
        (() => {
          const liveTok = getAccessToken() || getMerchantToken();
          if (!liveTok) return null;
          return apiFetch('/api/v1/auth/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: liveTok.startsWith('Bearer ') ? liveTok : `Bearer ${liveTok}`,
            },
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);
        })(),
        fetchMyActiveSubscriptions('USER').catch(() => null),
      ]);
      if (meUserRes && typeof meUserRes === 'object') {
        const merged = { ...(user || {}), ...meUserRes };
        setSellerAccountUser(merged);
        if (updateUser) updateUser(merged);
      }
      if (userSubRes) setUserSubData(userSubRes);

      if (panel === 'seller-orders' || panel === 'dispatched') {
        const [sOrders, bOrders] = await Promise.all([
          fetchMyOrders().catch(() => []),
          getBuyerOrders().catch(() => []),
        ]);
        setSellerOrders(Array.isArray(sOrders) ? sOrders : []);
        setBuyerOrders(Array.isArray(bOrders) ? bOrders : []);
      } else if (panel === 'my-products') {
        const prods = await fetchMyProducts().catch(() => []);
        setMyProducts(Array.isArray(prods) ? prods : []);
      } else if (panel === 'subscriptions') {
        const pkgs = await fetchAdminSubscriptionPackages({ audience: 'USER', activeOnly: true }).catch(() => []);
        setUserSubPackages(Array.isArray(pkgs) ? pkgs : []);
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to load seller products data');
    } finally {
      setLoadingSellerPanel(false);
    }
  };

  useEffect(() => {
    loadMerchantWorkspace(false);
  }, []);

  useEffect(() => {
    loadMerchantSellerData(activePanel);
  }, [activePanel]);

  const handleSelectShop = async (shopId) => {
    const match = shops.find((s) => String(s.id) === String(shopId));
    if (!match) return;
    setSelectedShop(match);
    populateFormFromShop(match);
    const [promosRes, compRes, activeSubRes, sliderRes] = await Promise.all([
      match.id ? fetchMerchantPromotions(match.id).catch(() => []) : [],
      complaintsApi.list({ merchant: (match.business_name || match.name || '').trim() || undefined }).catch(() => []),
      fetchMyActiveSubscriptions('MERCHANT', match.id).catch(() => null),
      match.id ? fetchSliderSettings(match.id).catch(() => null) : null,
    ]);
    setPromotions(Array.isArray(promosRes) ? promosRes : []);
    setComplaints(Array.isArray(compRes) ? compRes : []);
    if (activeSubRes) setActiveSubData(activeSubRes);
    if (sliderRes) {
      const mSec = Number(
        sliderRes.merchant_interval_seconds ?? sliderRes.merchant_store_seconds ?? sliderRes.interval_seconds ?? 4
      );
      if (Number.isFinite(mSec) && mSec >= 2) {
        setPromoSwipeSeconds(Math.min(60, Math.round(mSec)));
        setStoredMerchantSliderOverrideSec(match.id, mSec, sliderRes);
      }
    }
  };

  // Save Store Profile via Mobile PUT /api/v1/merchants/{id}
  const handleSaveStore = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const targetId = formData.id || selectedShop?.id;
    if (!targetId) {
      setErrorMsg('No store profile found to update.');
      return;
    }
    if (!formData.business_name.trim()) {
      setErrorMsg('Business / Store Name is required.');
      return;
    }

    setSaving(true);
    try {
      const validPhotos = (formData.photos || []).filter((p) => p && typeof p === 'string' && p.trim() !== '');
      const payload = {
        business_name: formData.business_name.trim(),
        name: formData.business_name.trim(),
        owner_name: formData.owner_name.trim(),
        category: formData.category.trim(),
        contact_number: formData.phone_number.trim(),
        phone_number: formData.phone_number.trim(),
        phone: formData.phone_number.trim(),
        whatsapp: formData.whatsapp.trim() || formData.phone_number.trim(),
        landline: formData.landline.trim(),
        email: formData.email.trim(),
        website: formData.website.trim(),
        facebook: formData.facebook.trim(),
        instagram: formData.instagram.trim(),
        twitter: formData.twitter.trim(),
        youtube: formData.youtube.trim(),
        address: formData.address.trim(),
        landmark: formData.landmark.trim(),
        city: formData.city.trim(),
        district: formData.district,
        state: formData.state,
        latitude: formData.latitude,
        longitude: formData.longitude,
        service_timing: formData.service_timing.trim(),
        about: formData.about.trim(),
        photo_1: validPhotos[0] || formData.photos[0] || null,
        photo_2: validPhotos[1] || formData.photos[1] || null,
        photo_3: validPhotos[2] || formData.photos[2] || null,
        photo_4: validPhotos[3] || formData.photos[3] || null,
        photos: validPhotos,
        merchant_photos: validPhotos,
        video_url: formData.videoUrl || null,
      };
      await updateMerchant(targetId, payload);
      showNotice('Store profile and photos updated successfully!');
      await loadMerchantWorkspace(true);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to update store profile.');
    } finally {
      setSaving(false);
    }
  };

  // Auto-Detect Store GPS & Reverse Geocode (exact Mobile behavior)
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported in this browser.');
      return;
    }
    setDetectingGps(true);
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        let detectedCity = formData.city;
        let detectedDistrict = formData.district;
        let detectedAddress = formData.address;

        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (geoRes.ok) {
            const data = await geoRes.json();
            const addr = data.address || {};
            const town = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood;
            const dist = addr.state_district || addr.county;
            if (town) detectedCity = town;
            if (dist) detectedDistrict = dist.replace(/ District$/i, '');
            if (data.display_name) {
              detectedAddress = data.display_name.split(',').map((s) => s.trim()).slice(0, 4).join(', ');
            }
          }
        } catch (_) { }

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          city: detectedCity,
          district: detectedDistrict,
          address: detectedAddress,
        }));
        setDetectingGps(false);
        showNotice(`GPS Coordinates detected (${lat}, ${lng}). Click Save Store Changes to persist.`);
      },
      (geoErr) => {
        setDetectingGps(false);
        setErrorMsg(geoErr?.message || 'Unable to detect GPS location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoUpload = async (slotIdx, file) => {
    if (!file) return;
    if (!merchantGrants?.merchant_profile_photos) {
      setErrorMsg("Locked: Your current subscription does not include 'Store Profile Photos'. Subscribe to a plan that unlocks photos.");
      return;
    }
    setUploadingPhotoIndex(slotIdx);
    setErrorMsg('');
    try {
      const fd = new FormData();
      fd.append('photos', file);
      const res = await uploadMerchantMedia(fd);
      const url = res?.photos?.[0] || res?.all_urls?.[0];
      if (!url) throw new Error('Upload succeeded but no URL returned.');
      setFormData((prev) => {
        const nextPhotos = [...(prev.photos || ['', '', '', ''])];
        nextPhotos[slotIdx] = url;
        return { ...prev, photos: nextPhotos };
      });
      showNotice(`Photo #${slotIdx + 1} uploaded! Click Save Store Changes to update.`);
    } catch (err) {
      setErrorMsg(err?.message || 'Photo upload failed.');
    } finally {
      setUploadingPhotoIndex(null);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    if (!merchantGrants?.merchant_profile_video) {
      setErrorMsg("Locked: Your current subscription does not include 'Store Tour & Promo Video'. Subscribe to a plan that unlocks store video.");
      return;
    }
    setUploadingVideo(true);
    setErrorMsg('');
    try {
      const fd = new FormData();
      fd.append('videos', file);
      const res = await uploadMerchantMedia(fd);
      const url = res?.videos?.[0];
      if (!url) throw new Error('Video upload succeeded but no URL returned.');
      setFormData((prev) => ({ ...prev, videoUrl: url }));
      showNotice('Store video uploaded! Click Save Store Changes to update.');
    } catch (err) {
      setErrorMsg(err?.message || 'Video upload failed.');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Store Advertisement Handlers (Image / Text with Bg / Video)
  const resetPromoDraft = () => {
    setNewPromo({
      ...INITIAL_PROMO,
      category: formData.category || 'Retail & Shopping',
      location: `${formData.city || ''}${formData.city && formData.district ? ', ' : ''}${formData.district || 'Kerala'}`,
    });
  };

  const handlePromoMediaUpload = async (file) => {
    if (!file) return;
    setPromoUploading(true);
    setErrorMsg('');
    try {
      const res = await uploadPromotionMedia(file);
      const isVid = file.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name);
      const url = res?.url || res?.image_url || res?.video_url || res?.photos?.[0] || res?.videos?.[0];
      if (!url) throw new Error('Upload failed.');
      setNewPromo((prev) => ({
        ...prev,
        mediaType: isVid ? 'video' : 'image',
        type: 'Featured',
        imageUrl: isVid ? '' : url,
        videoUrl: isVid ? url : '',
      }));
      showNotice(`Advertisement ${isVid ? 'video' : 'image'} uploaded!`);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to upload advertisement media.');
    } finally {
      setPromoUploading(false);
    }
  };

  const handlePickPromoFileWithCrop = (file, mode = 'image') => {
    if (!file) return;
    const isVid = mode === 'video' || file.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name);
    const localUrl = URL.createObjectURL(file);
    if (isVid) {
      setVideoCropState({ isOpen: true, src: localUrl, rawFile: file });
    } else {
      setImageCropState({ isOpen: true, src: localUrl, rawFile: file });
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!newPromo.title.trim()) {
      setErrorMsg('Please enter an advertisement headline / title.');
      return;
    }
    if (newPromo.mediaType === 'image' && !String(newPromo.imageUrl || '').trim()) {
      setErrorMsg('Please upload or paste an advertisement image.');
      return;
    }
    if (newPromo.mediaType === 'video' && !String(newPromo.videoUrl || '').trim()) {
      setErrorMsg('Please upload or paste an advertisement video URL.');
      return;
    }
    setPromoSubmitting(true);
    setErrorMsg('');
    try {
      const targetId = formData.id || selectedShop?.id;
      const chosenPlacement = newPromo.placement || 'Merchant Store';
      const chosenMedia = newPromo.mediaType || 'image';
      const isStorePlacement = String(chosenPlacement).trim().toLowerCase() === 'merchant store';
      const reqPermKey = getRequiredAdPermissionKey(chosenPlacement, chosenMedia);
      if (!merchantGrants?.[reqPermKey]) {
        setErrorMsg(`Your current plan does not unlock ${chosenPlacement} (${chosenMedia}). Please subscribe to a plan with this permission.`);
        setPromoSubmitting(false);
        return;
      }
      const payload = {
        ...newPromo,
        title: newPromo.title.trim(),
        description: String(newPromo.description || '').trim(),
        placement: chosenPlacement,
        media_type: chosenMedia,
        type: chosenMedia === 'text' ? 'Text Banner' : 'Featured',
        image_url: chosenMedia === 'image' ? String(newPromo.imageUrl || '').trim() : null,
        video_url: chosenMedia === 'video' ? String(newPromo.videoUrl || '').trim() : null,
        bg_color: chosenMedia === 'text' ? newPromo.bgColor : null,
        text_color: chosenMedia === 'text' ? newPromo.textColor : null,
        target_url: String(newPromo.targetUrl || '').trim() || null,
        merchant_id: Number(targetId),
        status: isStorePlacement ? (newPromo.status || 'active') : 'pending',
      };
      const cleanSwipeSec = Math.max(2, Math.min(60, Math.round(Number(promoSwipeSeconds) || 4)));
      if (targetId) {
        try {
          const speedRes = await updateMerchantSliderInterval(targetId, cleanSwipeSec);
          setStoredMerchantSliderOverrideSec(targetId, cleanSwipeSec, speedRes?.slider_settings);
        } catch (_) {}
      }
      if (newPromo.id) {
        await updatePromotion(newPromo.id, payload);
        showNotice(
          isStorePlacement
            ? 'Store advertisement updated & saved!'
            : 'Platform advertisement updated and sent to Admin Approval Queue.'
        );
      } else {
        await createPromotion(payload);
        showNotice(
          isStorePlacement
            ? 'Store advertisement published above Location on your Store page!'
            : 'Advertisement submitted to Admin Pending Requests! It will appear on the Landing Page once Admin approves.'
        );
      }
      resetPromoDraft();
      const updatedPromos = await fetchMerchantPromotions(targetId).catch(() => []);
      setPromotions(Array.isArray(updatedPromos) ? updatedPromos : []);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to save store advertisement.');
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleSavePromoSwipeSpeed = async () => {
    const targetId = formData.id || selectedShop?.id;
    if (!targetId) return;
    const cleanSec = Math.max(2, Math.min(60, Math.round(Number(promoSwipeSeconds) || 4)));
    setPromoSwipeSeconds(cleanSec);
    setSavingSwipeSpeed(true);
    setErrorMsg('');
    try {
      const res = await updateMerchantSliderInterval(targetId, cleanSec);
      setStoredMerchantSliderOverrideSec(targetId, cleanSec, res?.slider_settings);
      showNotice(`Store advertisement auto-swipe speed set to every ${cleanSec} seconds!`);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to update advertisement swipe speed.');
    } finally {
      setSavingSwipeSpeed(false);
    }
  };

  const handleEditPromo = (promo) => {
    setNewPromo({
      id: promo.id,
      title: promo.title || '',
      description: promo.description || '',
      type: promo.type || 'Featured',
      placement: promo.placement || 'Merchant Store',
      category: promo.category || formData.category || 'Retail & Shopping',
      location: promo.location || `${formData.city || ''}${formData.city && formData.district ? ', ' : ''}${formData.district || 'Kerala'}`,
      startDate: promo.start_date || INITIAL_PROMO.startDate,
      endDate: promo.end_date || '2027-12-31',
      mediaType: promo.media_type || (promo.video_url ? 'video' : promo.image_url ? 'image' : 'text'),
      imageUrl: promo.image_url || promo.imageUrl || '',
      videoUrl: promo.video_url || promo.videoUrl || '',
      bgColor: promo.bg_color || AD_BG_PRESETS[0].value,
      textColor: promo.text_color || '#ffffff',
      targetUrl: promo.target_url || promo.targetUrl || '',
      status: String(promo.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTogglePromoStatus = async (promo) => {
    const targetId = formData.id || selectedShop?.id;
    const isCurrentlyActive = ['active', 'approved'].includes(String(promo.status || '').toLowerCase());
    const nextStatus = isCurrentlyActive ? 'inactive' : 'active';
    try {
      await updatePromotion(promo.id, { status: nextStatus });
      const updatedPromos = await fetchMerchantPromotions(targetId).catch(() => []);
      setPromotions(Array.isArray(updatedPromos) ? updatedPromos : []);
      showNotice(nextStatus === 'active' ? 'Advertisement set Live on Store page!' : 'Advertisement paused.');
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to update advertisement status.');
    }
  };

  const handleDeletePromo = async (promo) => {
    if (!window.confirm(`Delete advertisement "${promo.title}"?`)) return;
    const targetId = formData.id || selectedShop?.id;
    try {
      await deletePromotion(promo.id);
      if (newPromo.id === promo.id) resetPromoDraft();
      const updatedPromos = await fetchMerchantPromotions(targetId).catch(() => []);
      setPromotions(Array.isArray(updatedPromos) ? updatedPromos : []);
      showNotice('Advertisement deleted.');
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to delete advertisement.');
    }
  };

  // Growth Subscription Handler (Mobile audience=MERCHANT)
  const handleSubscribePlan = async (pkg, { renew = false } = {}) => {
    const targetShop = selectedShop || formData;
    setSubscribingId(pkg.id || pkg.code);
    setErrorMsg('');
    try {
      await startCustomerRazorpaySubscription({
        packageItem: pkg,
        customerUser: {
          name: formData.owner_name || formData.business_name || user?.name || 'Merchant',
          email: formData.email || user?.email || '',
          phone: formData.phone_number || user?.phone || '',
        },
        audience: 'MERCHANT',
        merchantProfileId: targetShop?.id ? Number(targetShop.id) : null,
        renew: Boolean(renew),
        onSuccess: async (subRes) => {
          if (subRes?.cancelled) return;
          showNotice(
            renew
              ? `"${pkg.name}" renewed & validity extended!`
              : 'Merchant Growth Subscription activated!'
          );
          await loadMerchantWorkspace(true);
        },
        onError: (payErr) => setErrorMsg(payErr?.message || 'Subscription activation failed.'),
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Subscription failed.');
    } finally {
      setSubscribingId(null);
    }
  };

  // ₹500 Seller Plan Subscription Handler (Same USER_SELLER_500 plan as Customer Profile)
  const handleSubscribeSeller500Plan = async (pkgOverride = null) => {
    const targetPkg =
      pkgOverride ||
      userSubPackages.find((p) => String(p.code || '').toUpperCase() === 'USER_SELLER_500') ||
      userSubPackages.find((p) => Number(p.price ?? p.amount) === 500) || {
        id: 'default-500',
        code: 'USER_SELLER_500',
        name: '₹500 Seller Plan',
        price: 500,
        duration_days: 30,
        description: 'Unlock My Products, Sell / Post an Ad, Customer Orders & Dispatch Tracking.',
      };

    setSubscribingId(targetPkg.id || targetPkg.code || 'USER_SELLER_500');
    setErrorMsg('');
    setNoticeMsg('');
    try {
      await startCustomerRazorpaySubscription({
        packageItem: targetPkg,
        customerUser: {
          id: sellerAccountUser?.id || user?.id,
          name: formData.owner_name || formData.business_name || sellerAccountUser?.name || 'Merchant',
          email: formData.email || sellerAccountUser?.email || '',
          phone: formData.phone_number || sellerAccountUser?.phone || '',
        },
        audience: 'USER',
        onSuccess: async () => {
          showNotice('₹500 Seller Plan activated! Product selling & customer orders are now unlocked.');
          await loadMerchantWorkspace(true);
          await loadMerchantSellerData(activePanel);
        },
        onError: (payErr) => setErrorMsg(payErr?.message || 'Seller Plan activation failed.'),
      });
    } catch (err) {
      setErrorMsg(err?.message || 'Seller Plan activation failed.');
    } finally {
      setSubscribingId(null);
    }
  };

  const renderSellerPlanLockCard = (title) => (
    <div style={{ textAlign: 'center', padding: '44px 24px', background: '#f8fafc', borderRadius: 16, border: '1.5px dashed #cbd5e1' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <HiOutlineLockClosed size={26} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
        {title} Requires a Merchant Plan
      </h3>
      <p style={{ margin: '0 auto 20px', maxWidth: 460, fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
        Subscribe to an Admin-configured Merchant Plan that includes <strong>Product Selling &amp; Storefront Orders</strong> to unlock My Products, Sell / Post an Ad, Customer Orders, and Dispatched tracking.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        {productUnlockPkg && (
          <button
            type="button"
            disabled={Boolean(subscribingId)}
            onClick={() => handleSubscribePlan(productUnlockPkg)}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '11px 22px',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <HiOutlineCreditCard size={18} />
            <span>
              {subscribingId
                ? 'Processing Razorpay...'
                : `Unlock with ${productUnlockPkg.name} (₹${Number(productUnlockPkg.price ?? productUnlockPkg.amount ?? 0).toLocaleString('en-IN')})`}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab('subscriptions')}
          style={{
            background: '#ffffff',
            color: '#1d4ed8',
            border: '1.5px solid #2563eb',
            borderRadius: 10,
            padding: '11px 18px',
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          View Merchant Plans
        </button>
      </div>
    </div>
  );

  // Complaints & Grievance Submission Handler
  const handleCreateComplaint = async (e, isGrievance = false) => {
    e.preventDefault();
    if (!newComplaint.subject.trim() || !newComplaint.description.trim()) {
      setErrorMsg('Please enter both a subject and detailed description.');
      return;
    }
    setComplaintSubmitting(true);
    setErrorMsg('');
    try {
      const targetName = (formData.business_name || selectedShop?.name || user?.name || 'Merchant').trim();
      const created = await complaintsApi.create({
        subject: newComplaint.subject.trim(),
        merchant: targetName,
        user: `${formData.owner_name || targetName} (Merchant)`,
        user_phone: formData.phone_number || '',
        user_email: formData.email || '',
        category: isGrievance ? newComplaint.category || 'General Support' : newComplaint.category || 'Promotion & Banner Issue',
        priority: newComplaint.priority || 'medium',
        status: 'open',
        date: new Date().toISOString().split('T')[0],
        description: newComplaint.description.trim(),
      });
      if (created) {
        setComplaints((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      }
      setNewComplaint({
        subject: '',
        category: 'Promotion & Banner Issue',
        priority: 'medium',
        description: '',
      });
      showNotice('Submitted successfully! Logo Admin will review and reply here.');
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to submit.');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <CircularSpinner />
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#64748b' }}>Loading your merchant workspace...</p>
      </div>
    );
  }

  const currentShopId = Number(formData.id || selectedShop?.id || 0);
  const merchantGrants = mergeMerchantGrants(activeSubData, selectedShop, userSubData);
  const canUploadProfilePhotos = Boolean(merchantGrants.merchant_profile_photos);
  const canUploadProfileVideo = Boolean(merchantGrants.merchant_profile_video);
  const canStoreImageTextAd = Boolean(merchantGrants.merchant_store_ad);
  const canStoreVideoAd = Boolean(merchantGrants.merchant_store_video_ad);
  const hasAnyMerchantAdPerm = hasAnyAdGrant(merchantGrants);

  const hasActiveMerchantSub = MERCHANT_PERMISSION_ITEMS.some((item) => Boolean(merchantGrants[item.key]));
  const isSellerSubscribed =
    Boolean(merchantGrants.merchant_product_section) ||
    Boolean(userSubData?.can_sell_products) ||
    Boolean(activeSubData?.can_sell_products);
  const sellerUserContext = sellerAccountUser
    ? {
        ...sellerAccountUser,
        name:
          formData.business_name ||
          sellerAccountUser.name ||
          formData.owner_name ||
          'Merchant',
        phone: formData.phone_number || sellerAccountUser.phone || '',
        district: formData.district || sellerAccountUser.district || 'Ernakulam',
        city: formData.city || sellerAccountUser.city || '',
      }
    : null;

  const merchantFeaturePackages = subPackages.filter(
    (p) => String(p.code || '').toUpperCase() !== 'MERCHANT_REGISTER_1000'
  );
  const rawMerchantSubs =
    Array.isArray(activeSubData?.merchant_subscriptions) && activeSubData.merchant_subscriptions.length > 0
      ? activeSubData.merchant_subscriptions
      : Array.isArray(selectedShop?.active_subscriptions)
      ? selectedShop.active_subscriptions
      : [];
  const activeMerchantSubs = rawMerchantSubs.filter((s) => {
    const code = String(s.package_code || '').toUpperCase();
    const st = String(s.status || 'ACTIVE').toUpperCase();
    if (code === 'MERCHANT_REGISTER_1000' || st !== 'ACTIVE') return false;
    if (s.expires_at && new Date(s.expires_at).getTime() < Date.now()) return false;
    return true;
  });
  const isPkgSubscribed = (pkg) =>
    activeMerchantSubs.some(
      (s) =>
        String(s.package_id || '') === String(pkg?.id || '') ||
        (pkg?.code && String(s.package_code || '').toUpperCase() === String(pkg.code).toUpperCase())
    );
  const maxSubscribedPrice = activeMerchantSubs.reduce((mx, s) => {
    const matchedPkg = merchantFeaturePackages.find(
      (p) =>
        String(p.id) === String(s.package_id) ||
        (s.package_code && String(p.code || '').toUpperCase() === String(s.package_code).toUpperCase())
    );
    const val = Number(matchedPkg?.price ?? matchedPkg?.amount ?? s.price ?? s.amount_paid ?? 0);
    return val > mx ? val : mx;
  }, 0);
  const upgradePackages = merchantFeaturePackages.filter((pkg) => {
    if (isPkgSubscribed(pkg)) return false;
    const price = Number(pkg.price ?? pkg.amount ?? 0);
    return price > maxSubscribedPrice;
  });
  const activePlanSummaryList = activeMerchantSubs.map((s) => {
    const matchedPkg = merchantFeaturePackages.find(
      (p) =>
        String(p.id) === String(s.package_id) ||
        (s.package_code && String(p.code || '').toUpperCase() === String(s.package_code).toUpperCase())
    );
    return {
      ...s,
      pkg: matchedPkg || {
        id: s.package_id,
        code: s.package_code,
        name: s.package_name || 'Merchant Plan',
        price: s.price ?? s.amount_paid ?? 0,
        duration_days: s.duration_days || 30,
      },
      planName: s.package_name || matchedPkg?.name || 'Merchant Plan',
      daysLeft: computeDaysRemaining(s),
    };
  });
  const primaryActivePlanLabel =
    activePlanSummaryList.length > 0
      ? activePlanSummaryList.map((item) => item.planName).join(', ')
      : selectedShop?.subscription_plan_name || '';
  const minDaysRemaining = activePlanSummaryList.reduce((mn, item) => {
    if (item.daysLeft === null || item.daysLeft === undefined) return mn;
    return mn === null ? item.daysLeft : Math.min(mn, item.daysLeft);
  }, null);

  const productUnlockPkg = merchantFeaturePackages.find((p) =>
    getUnlockedPermissionItems(p).some((item) => item.key === 'merchant_product_section')
  );

  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'all') return true;
    return String(c.status || 'open').toLowerCase().replace(/\s+/g, '-') === complaintFilter;
  });

  const districts = getDistrictsForState(formData.state || DEFAULT_STATE);
  const cities = getCitiesForDistrict(formData.district || DEFAULT_DISTRICT);

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Clean Workspace Action Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {shops.length > 1 && (
            <select
              value={String(selectedShop?.id || formData.id || '')}
              onChange={(e) => handleSelectShop(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, background: '#fff', color: '#0f172a' }}
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.business_name || s.name} (#{s.id})
                </option>
              ))}
            </select>
          )}
          <span
            style={{
              padding: '5px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              background: String(formData.approval_status || '').toUpperCase() === 'APPROVED' ? '#dcfce7' : '#fef3c7',
              color: String(formData.approval_status || '').toUpperCase() === 'APPROVED' ? '#166534' : '#92400e',
            }}
          >
            {formData.business_name || 'Merchant Store'} • {String(formData.approval_status || 'PENDING').toUpperCase()}
          </span>

          {primaryActivePlanLabel ? (
            <button
              type="button"
              onClick={() => setPlanActionModal('renew')}
              title="Click to view remaining days or renew subscription"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 999,
                border: '1px solid #6ee7b7',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                color: '#065f46',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <HiOutlineSparkles size={14} color="#059669" />
              <span>Plan: {primaryActivePlanLabel}</span>
              {minDaysRemaining !== null && (
                <span style={{ padding: '1px 7px', borderRadius: 999, background: '#059669', color: '#fff', fontSize: 11, fontWeight: 800 }}>
                  {minDaysRemaining}d left
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setTab('subscriptions')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 999,
                border: '1px solid #fcd34d',
                background: '#fffbeb',
                color: '#92400e',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <HiOutlineLockClosed size={13} />
              <span>No Active Plan — Subscribe</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => loadMerchantWorkspace(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer' }}
        >
          <HiOutlineRefresh size={16} />
          Refresh
        </button>
      </div>

      {noticeMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 13.5, fontWeight: 700 }}>
          {noticeMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13.5, fontWeight: 700 }}>
          {errorMsg}
        </div>
      )}

      {/* Active Workspace Panel */}
      <div style={cardStyle}>
        {(activePanel === 'seller-orders' || activePanel === 'dispatched') && (
          loadingSellerPanel && sellerOrders.length === 0 && isSellerSubscribed ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <CircularSpinner />
            </div>
          ) : (
            <SellerOrdersPanel
              mode={activePanel === 'dispatched' ? 'dispatched' : 'orders'}
              sellerOrders={sellerOrders}
              setSellerOrders={setSellerOrders}
              buyerOrders={buyerOrders}
              ordersSubTab={ordersSubTab}
              setOrdersSubTab={setOrdersSubTab}
              isSellerSubscribed={isSellerSubscribed}
              renderPlanLockCard={renderSellerPlanLockCard}
              navigate={navigate}
              onReload={() => loadMerchantSellerData(activePanel)}
              setNoticeMsg={showNotice}
              setErrorMsg={setErrorMsg}
            />
          )
        )}

        {(activePanel === 'my-products' || activePanel === 'sell-ad') && (
          !isSellerSubscribed ? (
            renderSellerPlanLockCard(activePanel === 'sell-ad' ? 'Sell / Post an Ad' : 'My Products')
          ) : activePanel === 'sell-ad' ? (
            <CustomerAddProductModal
              isOpen={true}
              embedded={true}
              onClose={() => setTab('my-products')}
              customerUser={sellerUserContext}
              onProductCreated={() => {
                showNotice('Product created successfully!');
                setTab('my-products');
              }}
              onSubscriptionActivated={() => loadMerchantWorkspace(true)}
            />
          ) : loadingSellerPanel && myProducts.length === 0 ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <CircularSpinner />
            </div>
          ) : (
            <MyProductsPanel
              products={myProducts}
              setProducts={setMyProducts}
              customerUser={sellerUserContext}
              onReload={() => loadMerchantSellerData('my-products')}
              setNoticeMsg={showNotice}
              setErrorMsg={setErrorMsg}
            />
          )
        )}

        {activePanel === 'edit' && (
          <>
            <form onSubmit={handleSaveStore}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Manage & Edit Store</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                    Edit store details, hours, location & photos (synced with Logo Mobile App).
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}
                >
                  {saving ? 'Saving...' : 'Save Store Changes'}
                </button>
              </div>

              {/* Current Active Plan Top Banner inside Merchant Profile */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: primaryActivePlanLabel ? 'linear-gradient(135deg, #ecfdf5 0%, #f0f9ff 100%)' : '#fffbeb',
                  border: primaryActivePlanLabel ? '1px solid #a7f3d0' : '1px solid #fde68a',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: primaryActivePlanLabel ? '#047857' : '#92400e' }}>
                    {primaryActivePlanLabel ? 'Your Subscribed Plan' : 'Subscription Status'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>{primaryActivePlanLabel || 'No Active Subscription Plan'}</span>
                    {minDaysRemaining !== null && (
                      <span style={{ padding: '2px 9px', borderRadius: 999, background: '#16a34a', color: '#fff', fontSize: 11.5, fontWeight: 800 }}>
                        {minDaysRemaining} Days Remaining
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setPlanActionModal('upgrade')}
                    className="logo-upgrade-btn"
                  >
                    <HiOutlineSparkles size={15} />
                    <span>Upgrade Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanActionModal('renew')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '7px 13px',
                      borderRadius: 9,
                      border: '1.5px solid #059669',
                      background: '#ffffff',
                      color: '#047857',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <HiOutlineRefresh size={14} />
                    <span>Renew</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Merchant / Store Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Owner Name</label>
                  <input
                    type="text"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={inputStyle}
                  >
                    {formData.category && !categoriesList.includes(formData.category) && (
                      <option value={formData.category}>{formData.category}</option>
                    )}
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Mobile / Contact Number *</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp Number</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Landline Number</label>
                  <input
                    type="text"
                    value={formData.landline}
                    onChange={(e) => setFormData({ ...formData, landline: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Business / Service Hours</label>
                  <input
                    type="text"
                    value={formData.service_timing}
                    onChange={(e) => setFormData({ ...formData, service_timing: e.target.value })}
                    placeholder="09:00 AM - 09:00 PM"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Location & GPS */}
              <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                    <HiOutlineLocationMarker size={18} color="#2563eb" />
                    Location & GPS Address
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    disabled={detectingGps}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {detectingGps ? 'Detecting GPS...' : 'Auto-Detect Store GPS'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => {
                        const st = e.target.value;
                        const dists = getDistrictsForState(st);
                        setFormData({ ...formData, state: st, district: dists[0] || '', city: '' });
                      }}
                      style={inputStyle}
                    >
                      {getStatesList().map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>District</label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      style={inputStyle}
                    >
                      {formData.district && !districts.includes(formData.district) && (
                        <option value={formData.district}>{formData.district}</option>
                      )}
                      {districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>City / Town</label>
                    <input
                      type="text"
                      list="merchant-city-suggestions"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      style={inputStyle}
                    />
                    <datalist id="merchant-city-suggestions">
                      {cities.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label style={labelStyle}>Landmark</label>
                    <input
                      type="text"
                      value={formData.landmark}
                      onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Full Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={inputStyle}
                  />
                </div>

                <GoogleMapsLocationInput
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  address={formData.address}
                  onLocationChange={(loc) =>
                    setFormData((prev) => ({
                      ...prev,
                      latitude: loc.lat ?? loc.latitude ?? prev.latitude,
                      longitude: loc.lng ?? loc.longitude ?? prev.longitude,
                      address: loc.address || prev.address,
                      city: loc.city || prev.city,
                      district: loc.district || prev.district,
                    }))
                  }
                />
              </div>

              {/* About & Social */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>About Business & Services</label>
                <textarea
                  rows={3}
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Instagram</label>
                  <input type="text" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Facebook</label>
                  <input type="text" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>YouTube</label>
                  <input type="text" value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} style={inputStyle} />
                </div>
              </div>

              {/* 4 Showcase Photos & Video */}
              <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <label style={{ ...labelStyle, fontSize: 13.5, marginBottom: 0 }}>
                    Storefront &amp; Business Photos (Up to 4)
                  </label>
                  {!canUploadProfilePhotos && (
                    <button
                      type="button"
                      onClick={() => navigate('/merchant?tab=subscriptions')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 11px',
                        borderRadius: 8,
                        border: '1px solid #fcd34d',
                        background: '#fffbeb',
                        color: '#92400e',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <HiOutlineLockClosed size={13} />
                      Unlock Store Photos Plan
                    </button>
                  )}
                </div>

                {!canUploadProfilePhotos && (
                  <div style={{ padding: '10px 12px', borderRadius: 9, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
                    🔒 Adding or replacing shop gallery photos requires an active subscription with &quot;Store Profile Photos&quot; enabled.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  {(formData.photos || ['', '', '', '']).map((photoUrl, idx) => (
                    <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, opacity: canUploadProfilePhotos ? 1 : 0.72 }}>
                      {photoUrl ? (
                        <div style={{ position: 'relative', height: 110, borderRadius: 8, overflow: 'hidden' }}>
                          <img src={photoUrl} alt={`Store ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => {
                                const next = [...prev.photos];
                                next[idx] = '';
                                return { ...prev, photos: next };
                              })
                            }
                            style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(220,38,38,0.9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ height: 110, borderRadius: 8, border: '1.5px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>
                          <HiOutlinePhotograph size={24} />
                          <span>Photo #{idx + 1}</span>
                        </div>
                      )}
                      {canUploadProfilePhotos ? (
                        <label style={{ textAlign: 'center', padding: '6px 10px', borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          {uploadingPhotoIndex === idx ? 'Uploading...' : photoUrl ? 'Replace Photo' : 'Upload Photo'}
                          <input type="file" accept="image/*" hidden onChange={(e) => handlePhotoUpload(idx, e.target.files?.[0])} />
                        </label>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/merchant?tab=subscriptions')}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #f59e0b', background: '#fffbeb', color: '#92400e', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                        >
                          <span className="logo-lock-badge-anim" style={{ width: 22, height: 22 }}>
                            <HiOutlineLockClosed size={13} />
                          </span>
                          <span>Locked</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {canUploadProfileVideo ? (
                    <label style={{ padding: '8px 14px', borderRadius: 8, background: '#fff', border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                      {uploadingVideo ? 'Uploading Video...' : formData.videoUrl ? 'Replace Store Video' : 'Upload Store Video'}
                      <input type="file" accept="video/*" hidden onChange={(e) => handleVideoUpload(e.target.files?.[0])} />
                    </label>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/merchant?tab=subscriptions')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9, background: '#fffbeb', border: '1.5px solid #f59e0b', fontSize: 12.5, fontWeight: 800, color: '#92400e', cursor: 'pointer' }}
                    >
                      <span className="logo-lock-badge-anim" style={{ width: 24, height: 24 }}>
                        <HiOutlineLockClosed size={15} />
                      </span>
                      <span>Store Tour Video Locked — Subscribe to Unlock</span>
                    </button>
                  )}
                  {formData.videoUrl && (
                    <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>Video attached ✓</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
                >
                  {saving ? 'Saving Changes...' : 'Save All Store Changes'}
                </button>
              </div>
            </form>

            <ChangePasswordCard
              defaultEmail={formData.email || selectedShop?.email || user?.email || ''}
              title="Reset / Change Merchant Password"
              subtitle="Verify with a 6-digit email OTP to update your merchant password across Mobile App & Web."
              onSendOtp={merchantForgotPassword}
              onResetPassword={merchantResetPassword}
            />
          </>
        )}

        {activePanel === 'promotions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: '#0f172a' }}>
                  Store Advertisement Studio
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  Publish your store&apos;s own Image, Text with Background, or Video advertisement displayed right above Location on your Merchant Page.
                </p>
              </div>
              {currentShopId > 0 && hasActiveMerchantSub && (
                <a
                  href={`/merchant/${currentShopId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1d4ed8',
                    fontSize: 12.5,
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  <span>Preview Store Page</span>
                  <HiOutlineExternalLink size={15} />
                </a>
              )}
            </div>

            {!hasAnyMerchantAdPerm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div
                  style={{
                    padding: 22,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                    border: '1.5px solid #fcd34d',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#d97706',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <HiOutlineLockClosed size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#78350f' }}>
                        Advertisement Section Locked — Choose a Merchant Plan
                      </h3>
                      <p style={{ margin: '3px 0 0', fontSize: 13, color: '#92400e' }}>
                        Only features ticked inside your active Admin-configured Merchant Plan unlock here. Subscribe to a plan below to unlock Store Ads, Video Ads, or Landing Page Banner placements.
                      </p>
                    </div>
                  </div>
                </div>

                {merchantFeaturePackages.length === 0 ? (
                  <p style={{ fontSize: 13.5, color: '#64748b' }}>No active merchant promotion plans have been published by Admin yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))', gap: 14 }}>
                    {merchantFeaturePackages.map((pkg, idx) => {
                      const unlocked = getUnlockedPermissionItems(pkg);
                      const subscribed = isPkgSubscribed(pkg);
                      return (
                        <div key={pkg.id || idx} style={{ padding: 18, borderRadius: 14, border: subscribed ? '2px solid #16a34a' : '1.5px solid #cbd5e1', background: subscribed ? '#f0fdf4' : '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{pkg.name}</span>
                              <span style={{ fontSize: 18, fontWeight: 900, color: subscribed ? '#16a34a' : '#2563eb' }}>₹{Number(pkg.price ?? pkg.amount ?? 0).toLocaleString('en-IN')}</span>
                            </div>
                            <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#475569' }}>
                              {pkg.description || 'Admin-configured Merchant Plan with granular permissions.'}
                            </p>
                            {pkg.duration_days && (
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>Duration: {pkg.duration_days} Days</div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {unlocked.length === 0 ? (
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>No permissions configured</span>
                              ) : unlocked.map((item) => (
                                <span
                                  key={item.key}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '3px 7px',
                                    borderRadius: 6,
                                    background: subscribed ? '#dcfce7' : '#eff6ff',
                                    color: subscribed ? '#166534' : '#1d4ed8',
                                  }}
                                >
                                  <HiOutlineCheckCircle size={12} />
                                  {item.label}
                                </span>
                              ))}
                            </div>
                          </div>
                          {subscribed ? (
                            <button
                              type="button"
                              disabled
                              style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                            >
                              <HiOutlineCheckCircle size={17} />
                              <span>Subscribed</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={subscribingId === (pkg.id || pkg.code)}
                              onClick={() => handleSubscribePlan(pkg)}
                              style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}
                            >
                              {subscribingId === (pkg.id || pkg.code)
                                ? 'Processing...'
                                : `Pay ₹${Number(pkg.price ?? pkg.amount ?? 0).toLocaleString('en-IN')} & Unlock via Razorpay`}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 15px', borderRadius: 12, background: '#ecfdf5', border: '1px solid #a7f3d0', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <HiOutlineCheckCircle size={18} />
                    <span>Advertisement Permissions Active — Select from your unlocked placements and formats below.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setPlanActionModal('upgrade')}
                      className="logo-upgrade-btn"
                    >
                      <HiOutlineSparkles size={15} />
                      <span>Upgrade Plan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanActionModal('renew')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        border: '1.5px solid #059669',
                        background: '#ffffff',
                        color: '#047857',
                        borderRadius: 9,
                        padding: '7px 14px',
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <HiOutlineRefresh size={14} />
                      <span>Renew</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleCreatePromo} style={{ padding: 20, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: '#0f172a' }}>
                      {newPromo.id ? 'Edit Advertisement' : 'Create Advertisement'}
                    </h4>
                    {newPromo.id && (
                      <button
                        type="button"
                        onClick={resetPromoDraft}
                        style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  {/* Placement Selector driven by Admin subscription ticks */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Choose Ad Placement Section *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {[
                        { placement: 'Merchant Store', label: 'Store Page', unlocked: canStoreImageTextAd || canStoreVideoAd },
                        ...MERCHANT_PERMISSION_ITEMS.filter((i) => i.placement).map((i) => ({
                          placement: i.placement,
                          label: i.label.replace(/ Ad$/, ''),
                          unlocked: Boolean(merchantGrants[i.key]),
                        })),
                      ].map((opt) => {
                        const selected = (newPromo.placement || 'Merchant Store') === opt.placement;
                        return (
                          <button
                            key={opt.placement}
                            type="button"
                            onClick={() => {
                              if (!opt.unlocked) {
                                setPlanActionModal('upgrade');
                                return;
                              }
                              setNewPromo((prev) => ({ ...prev, placement: opt.placement }));
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 7,
                              padding: opt.unlocked ? '8px 13px' : '7px 12px',
                              borderRadius: 10,
                              border: !opt.unlocked
                                ? '1.5px solid #f59e0b'
                                : selected
                                ? '2px solid #2563eb'
                                : '1px solid #cbd5e1',
                              background: !opt.unlocked ? '#fffbeb' : selected ? '#eff6ff' : '#ffffff',
                              color: !opt.unlocked ? '#78350f' : selected ? '#1d4ed8' : '#334155',
                              fontSize: 12.5,
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {!opt.unlocked && (
                              <span className="logo-lock-badge-anim" style={{ width: 22, height: 22 }}>
                                <HiOutlineLockClosed size={14} />
                              </span>
                            )}
                            <span>{opt.label}</span>
                            {!opt.unlocked && (
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 900,
                                  padding: '2px 5px',
                                  borderRadius: 5,
                                  background: '#fde68a',
                                  color: '#92400e',
                                  letterSpacing: '0.03em',
                                }}
                              >
                                LOCKED
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ad Format Switcher: Image / Text with Bg / Video */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Choose Advertisement Format *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                      {[
                        { key: 'image', label: 'Image Banner', icon: <HiOutlinePhotograph size={17} /> },
                        { key: 'text', label: 'Text with Background', icon: <HiOutlineDocumentText size={17} /> },
                        { key: 'video', label: 'Video Advertisement', icon: <HiOutlineVideoCamera size={17} /> },
                      ].map((fmt) => {
                        const chosenPlace = newPromo.placement || 'Merchant Store';
                        const fmtAllowed =
                          chosenPlace === 'Merchant Store'
                            ? fmt.key === 'video'
                              ? canStoreVideoAd
                              : canStoreImageTextAd
                            : Boolean(merchantGrants[getRequiredAdPermissionKey(chosenPlace, fmt.key)]);
                        const active = newPromo.mediaType === fmt.key;
                        return (
                          <button
                            key={fmt.key}
                            type="button"
                            onClick={() => {
                              if (!fmtAllowed) {
                                setPlanActionModal('upgrade');
                                return;
                              }
                              setNewPromo((prev) => ({ ...prev, mediaType: fmt.key }));
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 9,
                              padding: '11px 12px',
                              borderRadius: 11,
                              border: `2px solid ${!fmtAllowed ? '#f59e0b' : active ? '#2563eb' : '#cbd5e1'}`,
                              background: !fmtAllowed ? '#fffbeb' : active ? '#eff6ff' : '#ffffff',
                              color: !fmtAllowed ? '#78350f' : active ? '#1d4ed8' : '#334155',
                              fontSize: 13,
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {fmtAllowed ? (
                              fmt.icon
                            ) : (
                              <span className="logo-lock-badge-anim" style={{ width: 26, height: 26 }}>
                                <HiOutlineLockClosed size={16} />
                              </span>
                            )}
                            <span>{fmt.label}</span>
                            {!fmtAllowed && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 900,
                                  padding: '2px 6px',
                                  borderRadius: 6,
                                  background: '#fde68a',
                                  color: '#92400e',
                                }}
                              >
                                LOCKED
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={labelStyle}>
                        {newPromo.mediaType === 'text' ? 'Offer Headline / Main Text *' : 'Advertisement Title *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={newPromo.title}
                        onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                        placeholder={newPromo.mediaType === 'text' ? 'e.g. Flat 25% OFF This Weekend!' : 'e.g. Grand Festival Mega Offer'}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Action / Link URL (optional)</label>
                      <input
                        type="text"
                        value={newPromo.targetUrl}
                        onChange={(e) => setNewPromo({ ...newPromo, targetUrl: e.target.value })}
                        placeholder="https://... or leave blank"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Start Date</label>
                      <input type="date" value={newPromo.startDate} onChange={(e) => setNewPromo({ ...newPromo, startDate: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>End Date</label>
                      <input type="date" value={newPromo.endDate} onChange={(e) => setNewPromo({ ...newPromo, endDate: e.target.value })} style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Description / Offer Details</label>
                    <textarea
                      rows={2}
                      value={newPromo.description}
                      onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                      placeholder="Short offer message shown to visitors on your store page..."
                      style={inputStyle}
                    />
                  </div>

                  {/* Auto-Swipe Speed Control (Seconds) right inside Create/Edit Ad */}
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: '#ffffff', border: '1px solid #cbd5e1', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>
                        ⏱️ Ad Auto-Swipe Speed (Seconds)
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>
                        Choose after how many seconds store ads automatically swipe on your Store page (2s – 60s).
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {[2, 3, 4, 5, 8, 10].map((secOpt) => {
                        const activeSec = Number(promoSwipeSeconds) === secOpt;
                        return (
                          <button
                            key={secOpt}
                            type="button"
                            onClick={() => setPromoSwipeSeconds(secOpt)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 8,
                              border: `1.5px solid ${activeSec ? '#2563eb' : '#cbd5e1'}`,
                              background: activeSec ? '#eff6ff' : '#f8fafc',
                              color: activeSec ? '#1d4ed8' : '#334155',
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {secOpt}s
                          </button>
                        );
                      })}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                        <input
                          type="number"
                          min={2}
                          max={60}
                          value={promoSwipeSeconds}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setPromoSwipeSeconds(Number.isNaN(v) ? '' : Math.max(1, Math.min(60, v)));
                          }}
                          style={{ ...inputStyle, width: 64, padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>sec</span>
                      </div>
                      <button
                        type="button"
                        disabled={savingSwipeSpeed}
                        onClick={handleSavePromoSwipeSpeed}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid #bfdbfe',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {savingSwipeSpeed ? 'Saving...' : 'Save Speed'}
                      </button>
                    </div>
                  </div>

                  {/* IMAGE UPLOAD / PREVIEW */}
                  {newPromo.mediaType === 'image' && (
                    <div style={{ padding: 14, borderRadius: 12, background: '#ffffff', border: '1px solid #cbd5e1', marginBottom: 14 }}>
                      <label style={labelStyle}>Advertisement Image *</label>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                        <label style={{ padding: '9px 14px', borderRadius: 9, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                          {promoUploading ? 'Uploading Image...' : 'Upload & Crop Ad Image'}
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              const picked = e.target.files?.[0];
                              e.target.value = '';
                              if (picked) handlePickPromoFileWithCrop(picked, 'image');
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={newPromo.imageUrl}
                          onChange={(e) => setNewPromo({ ...newPromo, imageUrl: e.target.value })}
                          placeholder="Or paste image URL..."
                          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                        />
                        {newPromo.imageUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setImageCropState({
                                isOpen: true,
                                src: formatMediaUrl(newPromo.imageUrl),
                                rawFile: null,
                              })
                            }
                            style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid #bfdbfe', background: '#f0f9ff', color: '#0369a1', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            ✂️ Crop Image
                          </button>
                        )}
                      </div>
                      {newPromo.imageUrl && (
                        <div
                          style={{
                            width: '100%',
                            background: '#0f172a',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={formatMediaUrl(newPromo.imageUrl)}
                            alt="Ad Preview"
                            style={{ width: '100%', height: 'auto', maxHeight: 320, objectFit: 'contain', display: 'block' }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* TEXT WITH BACKGROUND PICKER & LIVE PREVIEW */}
                  {newPromo.mediaType === 'text' && (
                    <div style={{ padding: 14, borderRadius: 12, background: '#ffffff', border: '1px solid #cbd5e1', marginBottom: 14 }}>
                      <label style={labelStyle}>Background Color / Gradient Presets</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                        {AD_BG_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setNewPromo((prev) => ({ ...prev, bgColor: preset.value, textColor: preset.text }))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              border: newPromo.bgColor === preset.value ? '2px solid #0f172a' : '1px solid #cbd5e1',
                              background: preset.value,
                              color: preset.text,
                              fontSize: 11.5,
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155', marginLeft: 4 }}>
                          <span>Custom Bg:</span>
                          <input
                            type="color"
                            value={String(newPromo.bgColor || '').startsWith('#') ? newPromo.bgColor : '#1d4ed8'}
                            onChange={(e) => setNewPromo((prev) => ({ ...prev, bgColor: e.target.value }))}
                            style={{ width: 32, height: 28, border: '1px solid #cbd5e1', borderRadius: 6, padding: 1, cursor: 'pointer' }}
                          />
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                          <span>Text Color:</span>
                          <input
                            type="color"
                            value={newPromo.textColor || '#ffffff'}
                            onChange={(e) => setNewPromo((prev) => ({ ...prev, textColor: e.target.value }))}
                            style={{ width: 32, height: 28, border: '1px solid #cbd5e1', borderRadius: 6, padding: 1, cursor: 'pointer' }}
                          />
                        </label>
                      </div>

                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Live Banner Preview:</div>
                      <div
                        style={{
                          background: newPromo.bgColor || AD_BG_PRESETS[0].value,
                          color: newPromo.textColor || '#ffffff',
                          padding: '24px 20px',
                          borderRadius: 12,
                        }}
                      >
                        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
                          {newPromo.title || 'Your Headline Will Appear Here'}
                        </div>
                        <div style={{ fontSize: 13.5, opacity: 0.92 }}>
                          {newPromo.description || 'Your offer details and promotional message will appear in this banner right above Location.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VIDEO UPLOAD / URL PREVIEW */}
                  {newPromo.mediaType === 'video' && (
                    <div style={{ padding: 14, borderRadius: 12, background: '#ffffff', border: '1px solid #cbd5e1', marginBottom: 14 }}>
                      <label style={labelStyle}>Advertisement Video *</label>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                        <label style={{ padding: '9px 14px', borderRadius: 9, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                          {promoUploading ? 'Uploading Video...' : 'Upload & Crop Video (MP4/WEBM)'}
                          <input
                            type="file"
                            accept="video/*"
                            hidden
                            onChange={(e) => {
                              const picked = e.target.files?.[0];
                              e.target.value = '';
                              if (picked) handlePickPromoFileWithCrop(picked, 'video');
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={newPromo.videoUrl}
                          onChange={(e) => setNewPromo({ ...newPromo, videoUrl: e.target.value })}
                          placeholder="Or paste MP4 / YouTube video URL..."
                          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                        />
                        {newPromo.videoUrl && !/youtu/i.test(newPromo.videoUrl) && (
                          <button
                            type="button"
                            onClick={() =>
                              setVideoCropState({
                                isOpen: true,
                                src: formatMediaUrl(newPromo.videoUrl),
                                rawFile: null,
                              })
                            }
                            style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid #bfdbfe', background: '#f0f9ff', color: '#0369a1', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            ✂️ Crop / Trim Video
                          </button>
                        )}
                      </div>
                      {newPromo.videoUrl && !/youtu/i.test(newPromo.videoUrl) && (
                        <video
                          src={formatMediaUrl(newPromo.videoUrl)}
                          controls
                          style={{ width: '100%', maxHeight: 240, borderRadius: 10, background: '#000' }}
                        />
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    {(newPromo.placement || 'Merchant Store') === 'Merchant Store' ? (
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newPromo.status !== 'inactive'}
                          onChange={(e) => setNewPromo((prev) => ({ ...prev, status: e.target.checked ? 'active' : 'inactive' }))}
                        />
                        <span>Publish Live Immediately on Store Page</span>
                      </label>
                    ) : (
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '6px 12px', borderRadius: 8, border: '1px solid #fde68a' }}>
                        ⏳ Goes to Admin Approval Requests before Landing Page display
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={promoSubmitting || promoUploading}
                      style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}
                    >
                      {promoSubmitting
                        ? 'Saving...'
                        : newPromo.id
                        ? 'Update Advertisement'
                        : (newPromo.placement || 'Merchant Store') === 'Merchant Store'
                        ? 'Publish Store Advertisement'
                        : 'Submit Ad for Admin Approval'}
                    </button>
                  </div>
                </form>

                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  My Store Advertisements ({promotions.length})
                </h3>
                {loadingPromos ? (
                  <CircularSpinner />
                ) : promotions.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#64748b' }}>No store advertisements created yet. Create your first Image, Text, or Video ad above.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
                    {promotions.map((p, idx) => {
                      const st = String(p.status || 'active').toUpperCase();
                      const mType = String(p.media_type || (p.video_url ? 'video' : p.image_url ? 'image' : 'text')).toLowerCase();
                      const isLive = st === 'ACTIVE' || st === 'APPROVED';
                      return (
                        <div key={p.id || idx} style={{ borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            {mType === 'text' ? (
                              <div style={{ background: p.bg_color || AD_BG_PRESETS[0].value, color: p.text_color || '#fff', padding: '18px 14px', minHeight: 96, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ fontSize: 15, fontWeight: 900 }}>{p.title}</div>
                                {p.description && <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>{p.description}</div>}
                              </div>
                            ) : mType === 'video' ? (
                              <div style={{ background: '#0f172a', height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0', gap: 8, fontSize: 13, fontWeight: 700 }}>
                                <HiOutlineVideoCamera size={22} />
                                <span>Video Advertisement</span>
                              </div>
                            ) : (p.image_url || p.imageUrl) ? (
                              <img src={formatMediaUrl(p.image_url || p.imageUrl)} alt={p.title} style={{ width: '100%', height: 130, objectFit: 'cover' }} />
                            ) : null}

                            <div style={{ padding: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <strong style={{ fontSize: 13.5, color: '#0f172a' }}>{p.title}</strong>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    background: isLive ? '#dcfce7' : st === 'PENDING' ? '#fef3c7' : '#f1f5f9',
                                    color: isLive ? '#166534' : st === 'PENDING' ? '#92400e' : '#475569',
                                  }}
                                >
                                  {isLive ? 'LIVE' : st === 'PENDING' ? 'PENDING APPROVAL' : 'PAUSED'}
                                </span>
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748b' }}>
                                {p.placement || 'Merchant Store'} • {mType.toUpperCase()} • {p.start_date || ''} → {p.end_date || ''}
                              </div>
                            </div>
                          </div>

                          <div style={{ padding: '0 12px 12px', display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleTogglePromoStatus(p)}
                              style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 11.5, fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                            >
                              {isLive ? 'Pause' : 'Go Live'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditPromo(p)}
                              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #bfdbfe', background: '#eff6ff', fontSize: 11.5, fontWeight: 700, color: '#1d4ed8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <HiOutlinePencil size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePromo(p)}
                              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', fontSize: 11.5, fontWeight: 700, color: '#dc2626', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <HiOutlineTrash size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activePanel === 'subscriptions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Merchant Subscription Plans</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  Subscribe to Admin-configured Merchant Plans to unlock Photos, Store Tour Video, Product Selling, and Banner Placements for your business.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setPlanActionModal('upgrade')}
                  className="logo-upgrade-btn"
                >
                  <HiOutlineSparkles size={15} />
                  <span>Upgrade Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlanActionModal('renew')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 14px',
                    borderRadius: 9,
                    border: '1.5px solid #059669',
                    background: '#ffffff',
                    color: '#047857',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <HiOutlineRefresh size={14} />
                  <span>Renew</span>
                </button>
              </div>
            </div>

            {(hasActiveMerchantSub || activePlanSummaryList.length > 0) && (
              <div style={{ padding: 16, borderRadius: 14, background: '#ecfdf5', border: '1px solid #a7f3d0', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Your Current Active Plan(s)
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#065f46', marginTop: 2 }}>
                      {primaryActivePlanLabel || 'Active Merchant Plan'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {activePlanSummaryList.map((sub) => (
                      <div
                        key={sub.id || sub.package_id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 12px',
                          borderRadius: 10,
                          background: '#ffffff',
                          border: '1px solid #6ee7b7',
                        }}
                      >
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>{sub.planName}</span>
                        {sub.daysLeft !== null && (
                          <span style={{ fontSize: 11.5, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: '#16a34a', color: '#fff' }}>
                            {sub.daysLeft} days left
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#065f46', marginBottom: 6 }}>Active Merchant Plan Permissions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {MERCHANT_PERMISSION_ITEMS.filter((item) => Boolean(merchantGrants[item.key])).map((item) => (
                    <span
                      key={item.key}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '4px 9px',
                        borderRadius: 8,
                        background: '#ffffff',
                        color: '#065f46',
                        border: '1px solid #6ee7b7',
                      }}
                    >
                      <HiOutlineCheckCircle size={13} />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {merchantFeaturePackages.length === 0 ? (
              <p style={{ fontSize: 13.5, color: '#64748b' }}>No active merchant plans found right now.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(275px, 1fr))', gap: 14 }}>
                {merchantFeaturePackages.map((pkg, idx) => {
                  const unlocked = getUnlockedPermissionItems(pkg);
                  const subscribed = isPkgSubscribed(pkg);
                  const activeSub = activePlanSummaryList.find(
                    (s) =>
                      String(s.package_id || '') === String(pkg.id || '') ||
                      (pkg.code && String(s.package_code || '').toUpperCase() === String(pkg.code).toUpperCase())
                  );
                  return (
                    <div key={pkg.id || idx} style={{ padding: 18, borderRadius: 14, border: subscribed ? '2px solid #16a34a' : '1px solid #cbd5e1', background: subscribed ? '#f0fdf4' : '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{pkg.name}</span>
                          <span style={{ fontSize: 18, fontWeight: 900, color: subscribed ? '#16a34a' : '#2563eb' }}>₹{Number(pkg.price ?? pkg.amount ?? 0).toLocaleString('en-IN')}</span>
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#475569' }}>
                          {pkg.description || 'Boost store visibility across Kerala directory and home banners.'}
                        </p>
                        {pkg.duration_days && (
                          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>
                            Duration: {pkg.duration_days} Days
                            {subscribed && activeSub?.daysLeft !== null && activeSub?.daysLeft !== undefined ? ` • ${activeSub.daysLeft} days left` : ''}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {unlocked.map((item) => (
                            <span
                              key={item.key}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 7px',
                                borderRadius: 6,
                                background: subscribed ? '#dcfce7' : '#eff6ff',
                                color: subscribed ? '#166534' : '#1d4ed8',
                              }}
                            >
                              <HiOutlineCheckCircle size={12} />
                              {item.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      {subscribed ? (
                        <button
                          type="button"
                          disabled
                          style={{
                            width: '100%',
                            padding: '11px',
                            borderRadius: 10,
                            border: 'none',
                            background: '#16a34a',
                            color: '#fff',
                            fontSize: 13.5,
                            fontWeight: 800,
                            cursor: 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <HiOutlineCheckCircle size={17} />
                          <span>Subscribed</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={subscribingId === (pkg.id || pkg.code)}
                          onClick={() => handleSubscribePlan(pkg)}
                          style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}
                        >
                          {subscribingId === (pkg.id || pkg.code) ? 'Processing...' : 'Subscribe via Razorpay'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activePanel === 'complaints' && (
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Store Complaints & Support</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
              File store complaints, track ticket status, and view Logo Admin replies.
            </p>

            {/* New Complaint Form */}
            <form onSubmit={(e) => handleCreateComplaint(e, false)} style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
                <input
                  type="text"
                  required
                  placeholder="Complaint Subject *"
                  value={newComplaint.subject}
                  onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
                  style={inputStyle}
                />
                <select
                  value={newComplaint.category}
                  onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                  style={inputStyle}
                >
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={newComplaint.priority}
                  onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
                  style={inputStyle}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <textarea
                rows={3}
                required
                placeholder="Describe your store issue or request..."
                value={newComplaint.description}
                onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <button
                type="submit"
                disabled={complaintSubmitting}
                style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                {complaintSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </form>

            {/* Status Filter Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {[
                { key: 'all', label: `All (${complaintCounts.all ?? complaints.length})` },
                { key: 'open', label: `Open (${complaintCounts.open ?? 0})` },
                { key: 'in-progress', label: `In Progress (${complaintCounts['in-progress'] ?? 0})` },
                { key: 'resolved', label: `Resolved (${complaintCounts.resolved ?? 0})` },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setComplaintFilter(t.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: complaintFilter === t.key ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    background: complaintFilter === t.key ? '#eff6ff' : '#fff',
                    color: complaintFilter === t.key ? '#1d4ed8' : '#475569',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {loadingComplaints ? (
              <CircularSpinner />
            ) : filteredComplaints.length === 0 ? (
              <p style={{ fontSize: 13, color: '#64748b' }}>No store complaints in this category.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredComplaints.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    onClick={() => setSelectedComplaint(selectedComplaint?.id === c.id ? null : c)}
                    style={{ padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ fontSize: 14, color: '#0f172a' }}>{c.subject || c.category}</strong>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#e0f2fe', color: '#0369a1' }}>
                        {String(c.status || 'OPEN').toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#475569' }}>{c.description}</p>
                    {(c.admin_reply || c.reply || c.resolution_notes) && (
                      <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: '#ecfdf5', color: '#065f46', fontSize: 12.5 }}>
                        <strong>Admin Reply:</strong> {c.admin_reply || c.reply || c.resolution_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activePanel === 'helpline' && (
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Merchant Helpline</h2>
            <p style={{ margin: '0 0 18px', fontSize: 13.5, color: '#64748b' }}>
              Direct phone support for registered Logo Kerala merchant stores.
            </p>
            <div style={{ padding: 20, borderRadius: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Official Merchant Helpline Number</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#15803d', marginTop: 4 }}>+91 93727 02692</div>
                <div style={{ fontSize: 12.5, color: '#166534', marginTop: 4 }}>Store ID: #{formData.id || selectedShop?.id || '—'} • {formData.business_name || 'Merchant'}</div>
              </div>
              <a
                href="tel:+919372702692"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 10, background: '#16a34a', color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}
              >
                <HiOutlinePhone size={18} />
                Call 93727 02692
              </a>
            </div>
          </div>
        )}

        {activePanel === 'grievance' && (
          <div>
            <h2 style={{ margin: '0 0 12px', fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Report an Issue / Grievance</h2>
            <form onSubmit={(e) => handleCreateComplaint(e, true)} style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 10 }}>
                <input
                  type="text"
                  required
                  placeholder="Grievance Subject *"
                  value={newComplaint.subject}
                  onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
                  style={inputStyle}
                />
                <select
                  value={newComplaint.category}
                  onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
                  style={inputStyle}
                >
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <textarea
                rows={3}
                required
                placeholder="Describe your grievance for Logo App administration..."
                value={newComplaint.description}
                onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <button
                type="submit"
                disabled={complaintSubmitting}
                style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                {complaintSubmitting ? 'Submitting...' : 'Submit Grievance'}
              </button>
            </form>

            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#334155' }}>Submitted Grievances</h4>
            {complaints.length === 0 ? (
              <p style={{ fontSize: 13, color: '#64748b' }}>No grievances submitted.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {complaints.map((c, idx) => (
                  <div key={c.id || idx} style={{ padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13.5, color: '#0f172a' }}>{c.subject || c.category}</strong>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#e0f2fe', color: '#0369a1' }}>{c.status || 'OPEN'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#475569' }}>{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activePanel === 'help' && (
          <div>
            <h2 style={{ margin: '0 0 12px', fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Help & Customer Support</h2>
            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7 }}>
              Logo App connects Kerala customers with verified local businesses. Keep your store details, photos, location, and timings up to date so buyers across Kerala can reach you easily.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>Store & Promotion Guidelines</strong>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Store edits and banner ads are reviewed by the Logo Admin team before going live.</p>
              </div>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>Direct Merchant Helpline</strong>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Call 93727 02692 or raise a Store Complaint / Grievance from the left sidebar anytime.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Crop Modal for Merchant Advertisements */}
      <PromotionImageCropperModal
        isOpen={imageCropState.isOpen}
        onClose={() => setImageCropState({ isOpen: false, src: '', rawFile: null })}
        imageSrc={imageCropState.src}
        placement="Free"
        onCropSave={(croppedFile) => handlePromoMediaUpload(croppedFile)}
        onUseOriginal={imageCropState.rawFile ? () => handlePromoMediaUpload(imageCropState.rawFile) : undefined}
      />

      {/* Video Crop & Trim Modal for Merchant Advertisements */}
      <VideoAdCropModal
        isOpen={videoCropState.isOpen}
        onClose={() => setVideoCropState({ isOpen: false, src: '', rawFile: null })}
        videoSrc={videoCropState.src}
        videoFile={videoCropState.rawFile}
        onCropSave={(croppedFile) => handlePromoMediaUpload(croppedFile)}
        onUseOriginal={videoCropState.rawFile ? () => handlePromoMediaUpload(videoCropState.rawFile) : undefined}
      />

      {/* Upgrade Plan / Renew & All Plans Modal */}
      {planActionModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPlanActionModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.58)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 860,
              maxHeight: '88vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 18,
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)',
              border: '1px solid #e2e8f0',
              padding: 22,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {planActionModal === 'upgrade' ? (
                    <>
                      <HiOutlineSparkles size={20} color="#7c3aed" />
                      <span>Upgrade Your Merchant Plan</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineRefresh size={20} color="#059669" />
                      <span>Renew Plan &amp; View All Plans</span>
                    </>
                  )}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  {planActionModal === 'upgrade'
                    ? 'Showing only plans above your current active plan tier (current & lower plans are hidden).'
                    : 'Check your current active plan validity days left, extend your active plan, or switch across all available plans.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlanActionModal(null)}
                style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <HiOutlineX size={18} />
              </button>
            </div>

            {planActionModal === 'upgrade' ? (
              <div>
                {primaryActivePlanLabel && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14, fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                    Current Plan: <strong style={{ color: '#0f172a' }}>{primaryActivePlanLabel}</strong> (₹{maxSubscribedPrice.toLocaleString('en-IN')})
                  </div>
                )}

                {upgradePackages.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', borderRadius: 14, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#166534', marginBottom: 6 }}>
                      You are already on our highest plan tier!
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: '#15803d' }}>
                      There are no plans higher than ₹{maxSubscribedPrice.toLocaleString('en-IN')} at the moment.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPlanActionModal('renew')}
                      style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Open Renew &amp; All Plans
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
                    {upgradePackages.map((pkg, idx) => {
                      const unlocked = getUnlockedPermissionItems(pkg);
                      return (
                        <div key={pkg.id || idx} style={{ padding: 16, borderRadius: 14, border: '1.5px solid #c4b5fd', background: '#faf5ff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{pkg.name}</span>
                              <span style={{ fontSize: 18, fontWeight: 900, color: '#6d28d9' }}>₹{Number(pkg.price ?? pkg.amount ?? 0).toLocaleString('en-IN')}</span>
                            </div>
                            {pkg.description && (
                              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#475569' }}>{pkg.description}</p>
                            )}
                            {pkg.duration_days && (
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Duration: {pkg.duration_days} Days</div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {unlocked.map((item) => (
                                <span key={item.key} style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: '#ede9fe', color: '#5b21b6' }}>
                                  ✓ {item.label}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={subscribingId === (pkg.id || pkg.code)}
                            onClick={() => handleSubscribePlan(pkg)}
                            className="logo-upgrade-btn"
                            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                          >
                            {subscribingId === (pkg.id || pkg.code)
                              ? 'Processing...'
                              : `Upgrade to ${pkg.name} (₹${Number(pkg.price ?? pkg.amount ?? 0).toLocaleString('en-IN')})`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Section 1: Currently Active Plans + Remaining Days */}
                <div style={{ padding: 14, borderRadius: 14, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#065f46', marginBottom: 10 }}>
                    Current Active Subscription(s) &amp; Remaining Validity
                  </div>
                  {activePlanSummaryList.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#047857', fontWeight: 600 }}>
                      You don&apos;t have an active subscription yet. Choose any plan below to subscribe!
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                      {activePlanSummaryList.map((sub) => (
                        <div key={sub.id || sub.package_id} style={{ padding: 12, borderRadius: 12, background: '#ffffff', border: '1px solid #6ee7b7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{sub.planName}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                              {sub.daysLeft !== null ? `⏳ ${sub.daysLeft} Days Remaining` : 'Active Validity'}
                              {sub.expires_at ? ` • Expires ${new Date(sub.expires_at).toLocaleDateString('en-IN')}` : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={subscribingId === (sub.pkg?.id || sub.package_id)}
                            onClick={() => handleSubscribePlan(sub.pkg, { renew: true })}
                            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                          >
                            {subscribingId === (sub.pkg?.id || sub.package_id) ? 'Extending...' : 'Renew Now'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: All Available Merchant Plans */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                    All Available Merchant Plans
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                    {merchantFeaturePackages.map((pkg, idx) => {
                      const unlocked = getUnlockedPermissionItems(pkg);
                      const subscribed = isPkgSubscribed(pkg);
                      return (
                        <div key={pkg.id || idx} style={{ padding: 15, borderRadius: 12, border: subscribed ? '2px solid #16a34a' : '1px solid #cbd5e1', background: subscribed ? '#f0fdf4' : '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{pkg.name}</span>
                              <span style={{ fontSize: 16, fontWeight: 900, color: subscribed ? '#16a34a' : '#2563eb' }}>₹{Number(pkg.price ?? pkg.amount ?? 0).toLocaleString('en-IN')}</span>
                            </div>
                            {pkg.duration_days && (
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Duration: {pkg.duration_days} Days</div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {unlocked.map((item) => (
                                <span key={item.key} style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: subscribed ? '#dcfce7' : '#eff6ff', color: subscribed ? '#166534' : '#1d4ed8' }}>
                                  ✓ {item.label}
                                </span>
                              ))}
                            </div>
                          </div>
                          {subscribed ? (
                            <button
                              type="button"
                              disabled
                              style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                            >
                              <HiOutlineCheckCircle size={16} />
                              <span>Subscribed</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={subscribingId === (pkg.id || pkg.code)}
                              onClick={() => handleSubscribePlan(pkg)}
                              style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                            >
                              {subscribingId === (pkg.id || pkg.code) ? 'Processing...' : 'Subscribe via Razorpay'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
