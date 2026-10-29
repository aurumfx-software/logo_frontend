import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineOfficeBuilding,
  HiOutlineSpeakerphone,
  HiOutlineClipboardCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlinePhotograph,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineGlobe,
  HiOutlineLocationMarker,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineInformationCircle,
  HiOutlineSparkles,
  HiOutlineKey,
  HiOutlineChatAlt2,
} from 'react-icons/hi';
import { FaWhatsapp, FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import PageHeader from '../components/UI/PageHeader';
import Modal from '../components/UI/Modal';
import CircularSpinner from '../components/UI/CircularSpinner';
import StatusBadge from '../components/UI/StatusBadge';
import GoogleMapsLocationInput from '../components/UI/GoogleMapsLocationInput';
import {
  fetchMerchantsList,
  getMerchantById,
  updateMerchant,
  createMerchant,
  uploadMerchantMedia,
  requestPromotionAccess,
} from '../api/merchantApi';
import { apiFetch } from '../api/apiClient';
import {
  fetchMerchantPromotions,
  createPromotion,
  uploadPromotionMedia,
} from '../api/promotionApi';
import { complaintsApi } from '../api/complaintsApi';
import { fetchCategoriesList } from '../api/categoryApi';
import {
  getStatesList,
  getDistrictsForState,
  getCitiesForDistrict,
  getStateForDistrict,
  DEFAULT_STATE,
  DEFAULT_DISTRICT,
} from '../utils/locations';

const CARTECH_MERCHANT_ID = 1130;

const initialPromoState = {
  title: '',
  description: '',
  type: 'Banner',
  placement: 'Home Top',
  category: 'Car mechanic',
  location: 'Payyanur, Kerala',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '2027-12-31',
  mediaType: 'image',
  imageUrl: '',
  videoUrl: '',
  targetUrl: '',
  status: 'pending',
};

export default function MerchantPortal() {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'promotions' | 'tracking' | 'complaints'
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Track if form data has been populated from DB so polling won't overwrite active typing
  const isFormInitialized = useRef(false);

  // Merchant Profile State (Targeted to Cartech, ID: 1130)
  const [merchant, setMerchant] = useState(null);
  const [categoriesList, setCategoriesList] = useState([
    'Car mechanic',
    'Automobile & Spares',
    'Retail & Shopping',
    'Solar & Electricals',
    'Healthcare & Medicals',
    'Hotels & Dining',
    'Interiors & Furniture',
  ]);

  // Edit Merchant Form State
  const [formData, setFormData] = useState({
    id: CARTECH_MERCHANT_ID,
    name: 'Cartech',
    business_name: 'Cartech',
    owner_name: 'Cartech',
    owner: 'Cartech',
    category: 'Car mechanic',
    categories: ['Car mechanic'],
    phone: '9048230954',
    phone_number: '9048230954',
    whatsapp: '9048230954',
    landline: '',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    address: 'Ambalathara, Payyanur',
    landmark: 'Near Town Center',
    city: 'Payyanur',
    district: 'Kannur',
    state: 'Kerala',
    latitude: null,
    longitude: null,
    service_timing: 'General Store Hours (09:00 AM - 08:00 PM)',
    about: 'Cartech located at Payyanur. Professional car repair, inspection, spare parts, and servicing.',
    photos: ['', '', '', ''],
    videoUrl: '',
    approval_status: 'PENDING',
    can_create_promotions: false,
  });

  // Media Upload State
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Promotions State
  const [promotions, setPromotions] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [newPromo, setNewPromo] = useState(initialPromoState);
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  const [promoUploading, setPromoUploading] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Promo Access Request State
  const [isAccessRequestModalOpen, setIsAccessRequestModalOpen] = useState(false);
  const [accessRequestReason, setAccessRequestReason] = useState('');
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);

  const handleSendAccessRequest = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsRequestingAccess(true);
      const targetId = formData.id || (merchant && merchant.id) || CARTECH_MERCHANT_ID;
      await requestPromotionAccess(targetId, accessRequestReason);
      setAccessRequested(true);
      setIsAccessRequestModalOpen(false);
      setSuccessToast('✓ Promotion access request sent to Admin successfully! Administrators have been notified.');
      setTimeout(() => setSuccessToast(''), 6000);
    } catch (err) {
      alert(`Request failed: ${err.message}`);
    } finally {
      setIsRequestingAccess(false);
    }
  };

  // Complaints & Support State
  const [complaintsList, setComplaintsList] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [selectedViewComplaint, setSelectedViewComplaint] = useState(null);
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintError, setComplaintError] = useState('');
  const [newComplaint, setNewComplaint] = useState({
    subject: '',
    category: 'Promotion & Banner Issue',
    priority: 'medium',
    description: '',
  });

  const loadMerchantComplaints = async () => {
    try {
      setLoadingComplaints(true);
      const targetName = (formData.business_name || formData.name || 'Cartech').trim();
      const items = await complaintsApi.list({ merchant: targetName });
      setComplaintsList(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Failed to load merchant complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleCreateComplaint = async (e) => {
    if (e) e.preventDefault();
    setComplaintError('');
    if (!newComplaint.subject.trim()) {
      setComplaintError('Please enter a complaint subject');
      return;
    }
    if (!newComplaint.description.trim()) {
      setComplaintError('Please provide a complete description of the issue');
      return;
    }

    setComplaintSubmitting(true);
    try {
      const targetName = (formData.business_name || formData.name || 'Cartech').trim();
      const payload = {
        subject: newComplaint.subject.trim(),
        merchant: targetName,
        user: `${formData.owner_name || 'Cartech'} (Merchant)`,
        user_phone: formData.phone || formData.phone_number || '',
        user_email: formData.email || '',
        category: newComplaint.category || 'General Support',
        priority: newComplaint.priority || 'medium',
        status: 'open',
        date: new Date().toISOString().split('T')[0],
        description: newComplaint.description.trim(),
      };

      const created = await complaintsApi.create(payload);
      if (created) {
        setComplaintsList((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
      }
      setIsComplaintModalOpen(false);
      setNewComplaint({
        subject: '',
        category: 'Promotion & Banner Issue',
        priority: 'medium',
        description: '',
      });
      showToast('✓ Complaint registered & sent to Logo Admin successfully! Track admin replies here.');
    } catch (err) {
      setComplaintError(err.message || 'Failed to submit complaint');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  // 1. Load Merchant Data & Promotions
  const loadMerchantData = async (forceFormSync = false) => {
    try {
      if (!isFormInitialized.current) {
        setLoading(true);
      }
      let foundMerchant = null;

      // Try fetching via /merchants/me if authenticated as merchant
      try {
        const meRes = await apiFetch('/api/v1/merchants/me');
        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          const raw = meData.merchant || meData.data?.merchant || meData.data || meData;
          if (raw && (raw.id || raw.business_name)) {
            foundMerchant = {
              ...raw,
              can_create_promotions: Boolean(raw.can_create_promotions ?? raw.promotion_access ?? false),
              promotion_access: Boolean(raw.can_create_promotions ?? raw.promotion_access ?? false),
            };
          }
        }
      } catch (err) {
        console.warn('Merchant /me fetch notice:', err);
      }

      // Try fetching by Cartech ID
      if (!foundMerchant) {
        try {
          foundMerchant = await getMerchantById(CARTECH_MERCHANT_ID);
        } catch (err) {
          console.warn('Cartech fetch by ID notice:', err);
        }
      }

      // Fallback search by name if not found
      if (!foundMerchant) {
        const list = await fetchMerchantsList({ search: 'Cartech' }).catch(() => []);
        if (Array.isArray(list) && list.length > 0) {
          foundMerchant = list.find((m) => (m.business_name || m.name || '').toLowerCase().includes('cartech')) || list[0];
        }
      }

      if (foundMerchant) {
        setMerchant(foundMerchant);
        const photosArr = Array.isArray(foundMerchant.photos) && foundMerchant.photos.length > 0
          ? [...foundMerchant.photos, '', '', '', ''].slice(0, 4)
          : ['', '', '', ''];

        const resolvedDist = foundMerchant.district || 'Kannur';
        const resolvedState = foundMerchant.state || getStateForDistrict(resolvedDist, DEFAULT_STATE);
        const resolvedCity = foundMerchant.city || 'Payyanur';

        if (!isFormInitialized.current || forceFormSync) {
          isFormInitialized.current = true;
          setFormData({
            id: foundMerchant.id || CARTECH_MERCHANT_ID,
            name: foundMerchant.business_name || foundMerchant.name || 'Cartech',
            business_name: foundMerchant.business_name || foundMerchant.name || 'Cartech',
            owner_name: foundMerchant.owner_name || foundMerchant.owner || 'Cartech',
            owner: foundMerchant.owner || foundMerchant.owner_name || 'Cartech',
            category: foundMerchant.category || 'Car mechanic',
            categories: foundMerchant.categories || [foundMerchant.category || 'Car mechanic'],
            phone: foundMerchant.phone || foundMerchant.phone_number || '9048230954',
            phone_number: foundMerchant.phone_number || foundMerchant.phone || '9048230954',
            whatsapp: foundMerchant.whatsapp || foundMerchant.phone || '9048230954',
            landline: foundMerchant.landline || '',
            email: foundMerchant.email || '',
            website: foundMerchant.website || '',
            facebook: foundMerchant.facebook || '',
            instagram: foundMerchant.instagram || '',
            twitter: foundMerchant.twitter || '',
            youtube: foundMerchant.youtube || '',
            address: foundMerchant.address || 'Ambalathara, Payyanur',
            landmark: foundMerchant.landmark || '',
            city: resolvedCity,
            district: resolvedDist,
            state: resolvedState,
            latitude: foundMerchant.latitude || null,
            longitude: foundMerchant.longitude || null,
            service_timing: foundMerchant.service_timing || 'General Store Hours (09:00 AM - 08:00 PM)',
            about: foundMerchant.about || foundMerchant.description || '',
            photos: photosArr,
            videoUrl: foundMerchant.videoUrl || foundMerchant.video_url || '',
            approval_status: foundMerchant.approval_status || foundMerchant.status || 'PENDING',
            can_create_promotions: Boolean(foundMerchant.can_create_promotions ?? foundMerchant.promotion_access),
          });
        } else {
          // Live background sync: only update permissions and approval status without overwriting active user typing
          setFormData((prev) => ({
            ...prev,
            approval_status: foundMerchant.approval_status || foundMerchant.status || prev.approval_status,
            can_create_promotions: Boolean(foundMerchant.can_create_promotions ?? foundMerchant.promotion_access),
          }));
        }

        // Check if there is currently a pending promo access request for this merchant
        try {
          const reqRes = await apiFetch('/api/v1/admin/merchants/promo-access-requests?status=PENDING');
          if (reqRes && reqRes.ok) {
            const reqData = await reqRes.json();
            const list = Array.isArray(reqData) ? reqData : reqData.data || [];
            const myTargetId = foundMerchant.id || CARTECH_MERCHANT_ID;
            const myPending = list.some((r) => r.merchant_id === myTargetId);
            setAccessRequested(myPending);
          }
        } catch (_) {}

        // Load promotions for this merchant
        loadPromotions(foundMerchant.id || CARTECH_MERCHANT_ID);

        // Load complaints for this merchant
        loadMerchantComplaints();
      }
    } catch (err) {
      console.error('Failed to load merchant data:', err);
    } finally {
      setLoading(false);
    }

    // Load available categories
    try {
      const cats = await fetchCategoriesList();
      if (Array.isArray(cats) && cats.length > 0) {
        const catNames = cats.map((c) => c.name || c.category_name).filter(Boolean);
        if (catNames.length > 0) {
          setCategoriesList(Array.from(new Set(['Car mechanic', ...catNames])));
        }
      }
    } catch (_) {}
  };

  const loadPromotions = async (merchantId) => {
    try {
      setLoadingPromos(true);
      const promos = await fetchMerchantPromotions(merchantId);
      setPromotions(Array.isArray(promos) ? promos : []);
    } catch (err) {
      console.warn('Failed to load merchant promotions:', err);
      setPromotions([]);
    } finally {
      setLoadingPromos(false);
    }
  };

  useEffect(() => {
    loadMerchantData(true);
    // Live polling every 6 seconds to detect promo access toggle from Admin immediately
    const intervalId = setInterval(() => loadMerchantData(false), 6000);
    const handleSync = () => loadMerchantData(false);
    window.addEventListener('focus', handleSync);
    window.addEventListener('merchant-promo-access-updated', handleSync);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('merchant-promo-access-updated', handleSync);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'promotions') {
      loadMerchantData(false);
    } else if (activeTab === 'complaints') {
      loadMerchantComplaints();
    }
  }, [activeTab]);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 6000);
  };

  // Upload Photo Handler
  const handlePhotoUpload = async (index, file) => {
    if (!file) return;
    setUploadingPhotoIndex(index);
    try {
      const mediaFormData = new FormData();
      mediaFormData.append('photos', file);
      const res = await uploadMerchantMedia(mediaFormData);
      if (res && res.photos && res.photos[0]) {
        const nextPhotos = [...formData.photos];
        nextPhotos[index] = res.photos[0];
        setFormData((prev) => ({ ...prev, photos: nextPhotos }));
      }
    } catch (err) {
      console.warn('Photo upload failed:', err);
      // Fallback local base64 preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const nextPhotos = [...formData.photos];
        nextPhotos[index] = reader.result;
        setFormData((prev) => ({ ...prev, photos: nextPhotos }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhotoIndex(null);
    }
  };

  // Upload Video Handler
  const handleVideoUpload = async (file) => {
    if (!file) return;
    setIsUploadingVideo(true);
    try {
      const mediaFormData = new FormData();
      mediaFormData.append('videos', file);
      const res = await uploadMerchantMedia(mediaFormData);
      const vidUrl = (res.videos && res.videos[0]) || (res.photos && res.photos[0]);
      if (vidUrl) {
        setFormData((prev) => ({ ...prev, videoUrl: vidUrl }));
      }
    } catch (err) {
      console.warn('Video upload failed:', err);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // 2. Submit Merchant Profile / "Edit Merchant: Cartech"
  const handleProfileSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const storeName = (formData.business_name || formData.name || '').trim();
    if (!storeName) {
      setErrorMessage('Please enter a business / store name');
      return;
    }
    if (!formData.phone && !formData.phone_number) {
      setErrorMessage('Please enter a contact phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const validPhotos = (formData.photos || []).filter((p) => p && typeof p === 'string' && p.trim() !== '');

      const payload = {
        business_name: storeName,
        name: storeName,
        owner_name: formData.owner_name || formData.owner || 'Cartech',
        owner: formData.owner_name || formData.owner || 'Cartech',
        category: formData.category || 'Car mechanic',
        categories: [formData.category || 'Car mechanic'],
        phone_number: formData.phone_number || formData.phone,
        phone: formData.phone_number || formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        landline: formData.landline,
        email: formData.email,
        district: formData.district || 'Kannur',
        city: formData.city || 'Payyanur',
        state: formData.state || 'Kerala',
        address: formData.address || 'Ambalathara, Payyanur',
        landmark: formData.landmark,
        service_timing: formData.service_timing,
        about: formData.about,
        photos: validPhotos,
        merchant_photos: validPhotos,
        video_url: formData.videoUrl,
        website: formData.website,
        facebook: formData.facebook,
        instagram: formData.instagram,
        twitter: formData.twitter,
        youtube: formData.youtube,
        // Crucial: Set initial approval state to PENDING for admin review
        status: 'PENDING',
        approval_status: 'PENDING',
      };

      if (formData.id) {
        await updateMerchant(formData.id, payload);
      } else {
        const created = await createMerchant(payload);
        if (created && created.id) {
          setFormData((prev) => ({ ...prev, id: created.id }));
        }
      }

      setFormData((prev) => ({
        ...prev,
        business_name: storeName,
        name: storeName,
        owner_name: payload.owner_name,
        owner: payload.owner_name,
        approval_status: 'PENDING',
      }));

      setMerchant((prev) => ({
        ...(prev || {}),
        business_name: storeName,
        name: storeName,
        owner_name: payload.owner_name,
        owner: payload.owner_name,
        approval_status: 'PENDING',
        status: 'pending',
      }));

      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const uObj = JSON.parse(storedUser);
          if (payload.owner_name) {
            uObj.name = payload.owner_name;
            localStorage.setItem('user', JSON.stringify(uObj));
            localStorage.setItem('logo_admin_user', JSON.stringify(uObj));
          }
        }
      } catch (e) {}

      window.dispatchEvent(new Event('merchants-updated'));
      window.dispatchEvent(new Event('registration-count-updated'));

      showToast('✓ Merchant details submitted successfully! Your application is now Pending Admin Approval in Logo Admin.');
      setActiveTab('tracking');
    } catch (err) {
      console.error('Merchant update submit error:', err);
      setErrorMessage(err.message || 'Failed to submit merchant details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Promotion Request
  const handlePromotionSubmit = async (e) => {
    if (e) e.preventDefault();
    setPromoError('');

    if (!merchant?.can_create_promotions && !formData.can_create_promotions) {
      setPromoError('Promotion access is disabled for this merchant account. You cannot submit promotions.');
      return;
    }

    if (!newPromo.title.trim()) {
      setPromoError('Please enter a promotion title');
      return;
    }

    setPromoSubmitting(true);
    try {
      const payload = {
        title: newPromo.title.trim(),
        description: newPromo.description,
        type: newPromo.type || 'Banner',
        placement: newPromo.placement || 'Home Top',
        category: newPromo.category || formData.category || 'Car mechanic',
        location: newPromo.location || `${formData.city}, ${formData.state}`,
        startDate: newPromo.startDate,
        endDate: newPromo.endDate,
        imageUrl: newPromo.imageUrl,
        videoUrl: newPromo.videoUrl,
        mediaType: newPromo.mediaType || (newPromo.videoUrl ? 'video' : 'image'),
        targetUrl: newPromo.targetUrl || '#',
        merchantId: formData.id || CARTECH_MERCHANT_ID,
        merchant_id: formData.id || CARTECH_MERCHANT_ID,
        merchant_name: formData.business_name || 'Cartech',
        status: 'pending',
      };

      const res = await createPromotion(payload);
      showToast('✓ Promotion submitted successfully! It has been sent to Logo Admin for review & approval.');
      setShowPromoModal(false);
      setNewPromo(initialPromoState);
      loadPromotions(formData.id || CARTECH_MERCHANT_ID);
      setActiveTab('promotions');
    } catch (err) {
      console.error('Failed to submit promotion:', err);
      setPromoError(err.message || 'Failed to submit promotion. Please verify promotion access permission.');
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handlePromoFileUpload = async (file) => {
    if (!file) return;
    setPromoUploading(true);
    setPromoError('');
    try {
      const res = await uploadPromotionMedia(file);
      const url = res.media_url || res.url || res.image_url || res.video_url || '';
      const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);
      if (url) {
        setNewPromo((prev) => ({
          ...prev,
          imageUrl: isVideo ? prev.imageUrl : url,
          videoUrl: isVideo ? url : prev.videoUrl,
          mediaType: isVideo ? 'video' : 'image',
        }));
      }
    } catch (err) {
      setPromoError('Media upload failed. Please try another image/video.');
    } finally {
      setPromoUploading(false);
    }
  };

  const currentApprovalStatus = (formData.approval_status || merchant?.approval_status || 'PENDING').toUpperCase();
  const hasPromoAccess = Boolean(formData.can_create_promotions ?? merchant?.can_create_promotions);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 60 }}>
      {/* Page Header */}
      <PageHeader
        title="Logo Merchant Portal"
        subtitle="Manage your merchant profile, promotions, and track admin approval requests in real time"
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => loadMerchantData(true)} title="Refresh Live Data">
            <HiOutlineRefresh /> Refresh
          </button>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: hasPromoAccess ? '#ECFDF5' : '#F1F5F9',
              color: hasPromoAccess ? '#059669' : '#64748B',
              border: `1px solid ${hasPromoAccess ? '#A7F3D0' : '#CBD5E1'}`,
            }}
          >
            <span>{hasPromoAccess ? '⚡ Promo Access: ENABLED' : '🔒 Promo Access: DISABLED'}</span>
          </div>
        </div>
      </PageHeader>

      {/* Success Notification Banner */}
      {successToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#ECFDF5',
            color: '#065F46',
            border: '1.5px solid #A7F3D0',
            padding: '14px 18px',
            borderRadius: 12,
            marginBottom: 20,
            fontWeight: 600,
            fontSize: 13.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HiOutlineCheckCircle style={{ fontSize: 20, color: '#059669' }} />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 800, color: '#065F46' }}
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Merchant Overview Header Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
          color: '#FFFFFF',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 24,
          boxShadow: '0 8px 24px rgba(49, 46, 129, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                border: '1px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              🚗
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>
                  {formData.business_name || 'Cartech'}
                </h2>
                <span
                  style={{
                    background: currentApprovalStatus === 'APPROVED' ? '#10B981' : currentApprovalStatus === 'REJECTED' ? '#EF4444' : '#F59E0B',
                    color: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                  }}
                >
                  {currentApprovalStatus}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#C7D2FE' }}>
                ID: #{formData.id} · Category: {formData.category} · Location: {formData.city}, {formData.district}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={() => setActiveTab('profile')}
              style={{
                background: activeTab === 'profile' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                color: activeTab === 'profile' ? '#312E81' : '#FFFFFF',
                border: 'none',
                fontWeight: 700,
              }}
            >
              <HiOutlinePencil /> Edit Merchant: {formData.business_name || 'Profile'}
            </button>
            <button
              className="btn"
              onClick={() => setActiveTab('promotions')}
              style={{
                background: activeTab === 'promotions' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                color: activeTab === 'promotions' ? '#312E81' : '#FFFFFF',
                border: 'none',
                fontWeight: 700,
              }}
            >
              <HiOutlineSpeakerphone /> Promotions ({promotions.length})
            </button>
            <button
              className="btn"
              onClick={() => setActiveTab('tracking')}
              style={{
                background: activeTab === 'tracking' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                color: activeTab === 'tracking' ? '#312E81' : '#FFFFFF',
                border: 'none',
                fontWeight: 700,
              }}
            >
              <HiOutlineClipboardCheck /> Request Status Tracking
            </button>
            <button
              className="btn"
              onClick={() => setActiveTab('complaints')}
              style={{
                background: activeTab === 'complaints' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)',
                color: activeTab === 'complaints' ? '#312E81' : '#FFFFFF',
                border: 'none',
                fontWeight: 700,
              }}
            >
              <HiOutlineChatAlt2 /> Complaints & Support ({complaintsList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <HiOutlineOfficeBuilding style={{ marginRight: 6 }} /> Edit Merchant: {formData.business_name || 'Profile'}
        </button>
        <button
          className={`tab ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotions')}
        >
          <HiOutlineSpeakerphone style={{ marginRight: 6 }} /> Promotion Management
        </button>
        <button
          className={`tab ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          <HiOutlineClipboardCheck style={{ marginRight: 6 }} /> Request Status Tracking
        </button>
        <button
          className={`tab ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          <HiOutlineChatAlt2 style={{ marginRight: 6 }} /> Complaints & Support ({complaintsList.length})
        </button>
      </div>

      {/* ========================================================
          TAB 1: EDIT MERCHANT: PROFILE
          ======================================================== */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E293B' }}>
                Edit Merchant: {formData.business_name || 'Store Details'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
                Fill in or update your merchant details. Submitting creates an approval request for Logo Admin.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Status:</span>
              <StatusBadge status={currentApprovalStatus} />
            </div>
          </div>

          <div className="card-body">
            {errorMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 8,
                  color: '#991B1B',
                  marginBottom: 16,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⚠️ {errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              {/* Notice: No manual status field — merchant cannot approve their own account */}

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Merchant / Business Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cartech"
                    value={formData.business_name ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, business_name: e.target.value, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Owner Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Owner / Contact Person"
                    value={formData.owner_name ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, owner_name: e.target.value, owner: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={formData.category || 'Retail'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    {categoriesList.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">📞 Mobile / Phone Contact *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 90482 30954"
                    value={formData.phone_number ?? formData.phone ?? ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone_number: e.target.value, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Contact Details Section */}
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px', marginBottom: 16, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📋 Contact & Communication Details
                </div>

                <div className="grid-2">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaWhatsapp style={{ color: '#25D366' }} /> WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 90482 30954"
                      value={formData.whatsapp ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HiOutlinePhone style={{ color: '#475569' }} /> Landline Number
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="04985-200000"
                      value={formData.landline ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, landline: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HiOutlineMail style={{ color: '#6C63FF' }} /> Business Email ID
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="cartech@gmail.com"
                      value={formData.email ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HiOutlineGlobe style={{ color: '#3B82F6' }} /> Website URL
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://cartech.in"
                      value={formData.website ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Links Section */}
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px', marginBottom: 16, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🔗 Social Media Profiles
                </div>

                <div className="grid-2">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaFacebook style={{ color: '#1877F2' }} /> Facebook Page
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://facebook.com/cartech"
                      value={formData.facebook ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, facebook: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaInstagram style={{ color: '#E1306C' }} /> Instagram Profile
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://instagram.com/cartech"
                      value={formData.instagram ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, instagram: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaTwitter style={{ color: '#1DA1F2' }} /> Twitter / X Profile
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://twitter.com/cartech"
                      value={formData.twitter ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, twitter: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaYoutube style={{ color: '#FF0000' }} /> YouTube Channel
                    </label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://youtube.com/@cartech"
                      value={formData.youtube ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, youtube: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="form-group">
                <label className="form-label">📍 Location & Street Address *</label>
                <GoogleMapsLocationInput
                  value={formData.address}
                  onChange={(addr) => setFormData({ ...formData, address: addr })}
                  onSelectLocation={(place) => {
                    setFormData((prev) => ({
                      ...prev,
                      address: place.address,
                      city: place.city || place.name,
                      district: place.district || prev.district,
                      state: place.state || prev.state,
                      latitude: place.latitude || place.lat || null,
                      longitude: place.longitude || place.lon || null,
                    }));
                  }}
                  placeholder="Ambalathara, Payyanur"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">State *</label>
                  <select
                    className="form-select"
                    value={formData.state || DEFAULT_STATE}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  >
                    {getStatesList().map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">District *</label>
                  <select
                    className="form-select"
                    value={formData.district || DEFAULT_DISTRICT}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                  >
                    {getDistrictsForState(formData.state || DEFAULT_STATE).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">City / Region *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Payyanur"
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Landmark</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Near Ambalathara Junction"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Service Timing / Business Hours</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="09:00 AM - 08:00 PM (Mon-Sat)"
                    value={formData.service_timing}
                    onChange={(e) => setFormData({ ...formData, service_timing: e.target.value })}
                  />
                </div>
              </div>

              {/* Photos Section */}
              <div className="form-group">
                <label className="form-label">📸 Merchant Storefront & Workshop Photos (Up to 4)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {formData.photos.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      style={{
                        height: 120,
                        border: '2px dashed #CBD5E1',
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: photoUrl ? `url(${photoUrl}) center/cover no-repeat` : '#F8FAFC',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {photoUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            const nextPhotos = [...formData.photos];
                            nextPhotos[idx] = '';
                            setFormData({ ...formData, photos: nextPhotos });
                          }}
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            background: 'rgba(0, 0, 0, 0.65)',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            cursor: 'pointer',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ✕
                        </button>
                      ) : (
                        <label style={{ cursor: 'pointer', textAlign: 'center', padding: 8 }}>
                          {uploadingPhotoIndex === idx ? (
                            <CircularSpinner size={24} color="#6C63FF" />
                          ) : (
                            <>
                              <HiOutlinePhotograph style={{ fontSize: 24, color: '#94A3B8' }} />
                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: 600 }}>
                                Upload Photo {idx + 1}
                              </div>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handlePhotoUpload(idx, e.target.files?.[0])}
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Video URL or Upload */}
              <div className="form-group">
                <label className="form-label">🎥 Promotional Video URL / Video File</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://youtu.be/... or MP4 video URL"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  />
                  <label className="btn btn-outline" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {isUploadingVideo ? 'Uploading...' : 'Upload Video'}
                    <input
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              {/* About Merchant */}
              <div className="form-group">
                <label className="form-label">About Merchant / Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Describe your business, services offered, warranties, specializations..."
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                />
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 28px',
                    fontSize: 14,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <CircularSpinner size={16} color="#FFFFFF" />
                      <span>Submitting to Logo Admin...</span>
                    </>
                  ) : (
                    'Submit for Admin Approval'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: PROMOTION MANAGEMENT (ADMIN CONTROLLED ACCESS)
          ======================================================== */}
      {activeTab === 'promotions' && (
        <div>
          {!hasPromoAccess ? (
            /* Promotion Access Disabled Warning */
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                border: '2px dashed #CBD5E1',
                borderRadius: 16,
                background: '#F8FAFC',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>
                Promotion Access is Currently Disabled
              </h3>
              <p style={{ maxWidth: 540, margin: '0 auto 20px auto', fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
                Logo Admin controls promotion permissions independently for each merchant. Promotion creation and management is currently turned <strong>OFF</strong> for <strong>{formData.business_name}</strong>.
              </p>
              <div
                style={{
                  display: 'inline-block',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#1E40AF',
                  fontWeight: 600,
                }}
              >
                ℹ️ To enable promotion publishing, an administrator must toggle <strong>Promotion Access ON</strong> inside the Logo Admin merchant directory.
              </div>

              {/* Request Promotion Access Button */}
              <div style={{ marginTop: 24 }}>
                {accessRequested ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#FEF3C7',
                      color: '#92400E',
                      border: '1px solid #FCD34D',
                      padding: '12px 24px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    <span>⏳ Promotion Access Request Submitted & Pending Admin Review</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIsAccessRequestModalOpen(true)}
                    disabled={isRequestingAccess}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 28px',
                      fontSize: 14.5,
                      fontWeight: 700,
                      borderRadius: 10,
                      boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                    }}
                  >
                    <HiOutlineSparkles style={{ fontSize: 18 }} />
                    <span>Request Promotion Access from Admin</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Promotion Access Enabled: List & Create */
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 18,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E293B' }}>
                    My Promotions & Banner Campaigns
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
                    Create and submit promotions to be displayed on the Logo landing page after admin approval.
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setPromoError('');
                    setNewPromo({
                      ...initialPromoState,
                      category: formData.category,
                      location: `${formData.city}, ${formData.state}`,
                    });
                    setShowPromoModal(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <HiOutlinePlus /> + Create New Promotion
                </button>
              </div>

              {loadingPromos ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                  <CircularSpinner size={32} color="#6C63FF" />
                  <p style={{ marginTop: 12, fontWeight: 600 }}>Loading promotions...</p>
                </div>
              ) : promotions.length === 0 ? (
                <div
                  className="card"
                  style={{
                    padding: '48px 20px',
                    textAlign: 'center',
                    background: '#FFFFFF',
                    borderRadius: 16,
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                    No Promotions Submitted Yet
                  </h4>
                  <p style={{ margin: '6px 0 16px 0', fontSize: 13, color: '#64748B' }}>
                    Click the button below to submit your first banner or discount offer to Logo Admin.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setPromoError('');
                      setShowPromoModal(true);
                    }}
                  >
                    <HiOutlinePlus /> Create Promotion
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {promotions.map((p) => {
                    const st = (p.status || 'pending').toLowerCase();
                    const isApproved = st === 'active' || st === 'approved';
                    const isRejected = st === 'rejected';

                    return (
                      <div
                        key={p.id}
                        className="card"
                        style={{
                          borderRadius: 14,
                          overflow: 'hidden',
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div
                          style={{
                            height: 140,
                            background: p.imageUrl || p.image_url
                              ? `url(${p.imageUrl || p.image_url}) center/cover no-repeat`
                              : 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-end',
                            padding: 10,
                          }}
                        >
                          <span
                            style={{
                              background: isApproved ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B',
                              color: '#FFFFFF',
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            }}
                          >
                            {isApproved ? 'Approved & Live' : isRejected ? 'Rejected' : 'Pending Approval'}
                          </span>
                        </div>

                        <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1E293B' }}>
                            {p.title}
                          </h4>
                          <p style={{ margin: '4px 0 10px 0', fontSize: 12, color: '#64748B' }}>
                            Placement: <strong>{p.placement || 'Home Top'}</strong> · Category: {p.category || 'Automobile'}
                          </p>
                          {p.description && (
                            <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#475569', lineHeight: 1.4, flex: 1 }}>
                              {p.description}
                            </p>
                          )}
                          <div style={{ fontSize: 11.5, color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                            Dates: {p.startDate || p.start_date || 'Ongoing'} to {p.endDate || p.end_date || '2027'}
                          </div>
                          {p.rejection_reason && isRejected && (
                            <div style={{ marginTop: 8, padding: '6px 10px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 11.5, color: '#991B1B' }}>
                              Reason: {p.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: REQUEST SUBMISSION & STATUS TRACKING
          ======================================================== */}
      {activeTab === 'tracking' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E293B' }}>
              Submission & Request Status Tracking
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
              Track review decisions from Logo Admin for your merchant profile and promotions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Merchant Profile Status Card */}
            <div className="card" style={{ padding: 22, borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🏪 Merchant Registration / Profile
                </div>
                <StatusBadge status={currentApprovalStatus} />
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13, color: '#334155' }}>
                <div><strong>Business:</strong> {formData.business_name}</div>
                <div><strong>Merchant ID:</strong> #{formData.id}</div>
                <div><strong>Owner:</strong> {formData.owner_name}</div>
                <div><strong>Current State:</strong> {currentApprovalStatus === 'APPROVED' ? 'Approved & Listed on Public Landing Page' : currentApprovalStatus === 'REJECTED' ? 'Application Rejected by Admin' : 'Pending Review by Logo Admin'}</div>
              </div>

              {currentApprovalStatus === 'APPROVED' && (
                <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                  ✓ Your store is approved and active in the public directory on the landing page!
                </div>
              )}

              {currentApprovalStatus === 'PENDING' && (
                <div style={{ background: '#FFFBEB', color: '#92400E', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                  ⏳ Your update was submitted and is waiting for Logo Admin to review and approve.
                </div>
              )}

              {currentApprovalStatus === 'REJECTED' && (
                <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                  ✕ Your application was rejected. Please review your details and resubmit via the "Edit Merchant: {formData.business_name || 'Profile'}" tab.
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setActiveTab('profile')}
                  style={{ width: '100%' }}
                >
                  <HiOutlinePencil /> Edit / Resubmit Details
                </button>
              </div>
            </div>

            {/* Promotion Permission Status Card */}
            <div className="card" style={{ padding: 22, borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⚡ Promotion Access Permission
                </div>
                <span
                  style={{
                    background: hasPromoAccess ? '#10B981' : '#64748B',
                    color: '#FFFFFF',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {hasPromoAccess ? 'ACCESS ON' : 'ACCESS OFF'}
                </span>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13, color: '#334155' }}>
                <div><strong>Admin Permission:</strong> {hasPromoAccess ? 'Granted by Admin' : 'Not Granted (Disabled)'}</div>
                <div><strong>Total Promotions:</strong> {promotions.length} submitted</div>
                <div><strong>Approved Live Promos:</strong> {promotions.filter((p) => (p.status || '').toLowerCase() === 'active' || (p.status || '').toLowerCase() === 'approved').length}</div>
              </div>

              {hasPromoAccess ? (
                <div style={{ background: '#ECFDF5', color: '#065F46', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                  ✓ Promotion access is enabled. You can submit landing page banners and special offers.
                </div>
              ) : (
                <div style={{ background: '#F1F5F9', color: '#475569', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                  🔒 Promotion creation is currently turned off. Admin must enable Promotion Access for this merchant.
                </div>
              )}

              <div style={{ marginTop: 14 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setActiveTab('promotions')}
                  style={{ width: '100%' }}
                >
                  <HiOutlineSpeakerphone /> View All Submitted Promotions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: COMPLAINTS & DISPUTE RESOLUTION
          ======================================================== */}
      {activeTab === 'complaints' && (
        <div>
          {/* Header Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HiOutlineChatAlt2 size={22} color="#4F46E5" />
                  Merchant Complaints & Dispute Center
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
                  Register complaints, request dispute investigations, or report technical issues to Logo Administration. Official replies appear directly on this page.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-outline"
                  onClick={loadMerchantComplaints}
                  title="Refresh Complaints"
                  disabled={loadingComplaints}
                >
                  <HiOutlineRefresh /> Refresh
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setComplaintError('');
                    setIsComplaintModalOpen(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  <HiOutlinePlus /> Register / Send Complaint
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="card-body" style={{ padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Total Complaints</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', marginTop: 2 }}>{complaintsList.length}</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Open / Awaiting Admin</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>
                    {complaintsList.filter((c) => c.status === 'open').length}
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>In Progress (Replied)</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#3B82F6', marginTop: 2 }}>
                    {complaintsList.filter((c) => c.status === 'in-progress').length}
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Resolved & Settled</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#10B981', marginTop: 2 }}>
                    {complaintsList.filter((c) => c.status === 'resolved').length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complaints Feed */}
          {loadingComplaints && complaintsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <CircularSpinner size={32} color="#4F46E5" />
              <p style={{ marginTop: 12, color: '#64748B', fontWeight: 600 }}>Loading complaints...</p>
            </div>
          ) : complaintsList.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                background: '#FFFFFF',
                borderRadius: 12,
                border: '2px dashed #CBD5E1',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: 0 }}>No Complaints Registered</h3>
              <p style={{ color: '#64748B', maxWidth: 480, margin: '8px auto 20px', fontSize: 14 }}>
                You have not registered any complaints or support tickets yet. If you face any issues with promotion displays, billing, or store listing verification, click the button below to send a complaint directly to Logo Administrators.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setComplaintError('');
                  setIsComplaintModalOpen(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <HiOutlinePlus /> Register / Send Complaint
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {complaintsList.map((complaint) => {
                const isResolved = complaint.status === 'resolved';
                const hasAdminReply = Boolean(complaint.admin_response && complaint.admin_response.trim());

                return (
                  <div
                    key={complaint.id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 12,
                      border: isResolved ? '1.5px solid #A7F3D0' : hasAdminReply ? '1.5px solid #BFDBFE' : '1px solid #E2E8F0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      padding: '20px 24px',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              background: '#EEF2FF',
                              color: '#4F46E5',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {complaint.complaint_code || `CMP-${complaint.id}`}
                          </span>
                          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                            {complaint.subject}
                          </h4>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: '#64748B', marginTop: 6, flexWrap: 'wrap' }}>
                          <span>📁 <strong>Category:</strong> {complaint.category}</span>
                          <span>📅 <strong>Submitted:</strong> {complaint.date || 'Recent'}</span>
                          <span>👤 <strong>By:</strong> {complaint.user}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StatusBadge status={complaint.priority} />
                        <StatusBadge status={complaint.status} />
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedViewComplaint(complaint)}
                          title="View Full Details"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                          <HiOutlineEye /> Details
                        </button>
                      </div>
                    </div>

                    {/* Complaint Description */}
                    {complaint.description && (
                      <div
                        style={{
                          background: '#F8FAFC',
                          borderRadius: 8,
                          padding: '12px 16px',
                          fontSize: 13.5,
                          color: '#334155',
                          border: '1px solid #E2E8F0',
                          lineHeight: 1.5,
                          marginBottom: 14,
                        }}
                      >
                        <strong style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 2 }}>YOUR COMPLAINT:</strong>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
                      </div>
                    )}

                    {/* Admin Response Box */}
                    {hasAdminReply ? (
                      <div
                        style={{
                          background: isResolved ? '#ECFDF5' : '#EFF6FF',
                          border: `1.5px solid ${isResolved ? '#6EE7B7' : '#93C5FD'}`,
                          borderRadius: 10,
                          padding: '14px 18px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14 }}>🛡️</span>
                            <strong style={{ color: isResolved ? '#065F46' : '#1E40AF', fontSize: 13.5 }}>
                              Logo Admin Official Reply
                            </strong>
                            {isResolved && (
                              <span
                                style={{
                                  background: '#10B981',
                                  color: '#FFFFFF',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                }}
                              >
                                RESOLVED
                              </span>
                            )}
                          </div>
                          {complaint.resolved_at && (
                            <span style={{ fontSize: 11.5, color: '#64748B' }}>
                              Replied on: {new Date(complaint.resolved_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 13.5, color: '#1E293B', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                          {complaint.admin_response}
                        </p>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          borderRadius: 8,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 12.5,
                          color: '#B45309',
                        }}
                      >
                        <span>⏳</span>
                        <span>
                          <strong>Awaiting Admin Review:</strong> Your complaint has been delivered to Logo Administration. Their official reply will appear in this box.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          CREATE PROMOTION MODAL
          ======================================================== */}
      <Modal
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        title="Submit New Promotion / Banner"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowPromoModal(false)} disabled={promoSubmitting}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePromotionSubmit}
              disabled={promoSubmitting || !hasPromoAccess}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {promoSubmitting ? (
                <>
                  <CircularSpinner size={16} color="#FFFFFF" />
                  <span>Submitting Promotion...</span>
                </>
              ) : (
                'Submit for Admin Approval'
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handlePromotionSubmit}>
          {promoError && (
            <div
              style={{
                padding: '10px 14px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                color: '#991B1B',
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ⚠️ {promoError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Promotion Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cartech Mega Monsoon Service Offer — Flat 30% Off"
              value={newPromo.title}
              onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Placement *</label>
              <select
                className="form-select"
                value={newPromo.placement}
                onChange={(e) => setNewPromo({ ...newPromo, placement: e.target.value })}
              >
                <option value="Home Top">Top Banners (Landing Page Slider)</option>
                <option value="Home Middle">Middle Ads (After 3 Rows)</option>
                <option value="Above Footer">Above Footer Showcase</option>
                <option value="Featured Offers">Featured Offers Carousel</option>
                <option value="Special Offer">Floating Special Deals</option>
                <option value="Moving Text">Scrolling Announcement Ticker</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={newPromo.category}
                onChange={(e) => setNewPromo({ ...newPromo, category: e.target.value })}
              >
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={newPromo.startDate}
                onChange={(e) => setNewPromo({ ...newPromo, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={newPromo.endDate}
                onChange={(e) => setNewPromo({ ...newPromo, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Banner Image / Video</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="url"
                className="form-input"
                placeholder="Image URL or upload file"
                value={newPromo.imageUrl || newPromo.videoUrl}
                onChange={(e) => setNewPromo({ ...newPromo, imageUrl: e.target.value })}
              />
              <label className="btn btn-outline" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {promoUploading ? 'Uploading...' : 'Upload Media'}
                <input
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handlePromoFileUpload(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target / Call to Action Link</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://cartech.in or #contact"
              value={newPromo.targetUrl}
              onChange={(e) => setNewPromo({ ...newPromo, targetUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Offer Details</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Full service checkup, oil change, brake inspection discounts..."
              value={newPromo.description}
              onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================
          REQUEST PROMOTION ACCESS MODAL
          ======================================================== */}
      <Modal
        isOpen={isAccessRequestModalOpen}
        onClose={() => setIsAccessRequestModalOpen(false)}
        title="Request Promotion Creation Access"
        size="md"
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setIsAccessRequestModalOpen(false)}
              disabled={isRequestingAccess}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSendAccessRequest}
              disabled={isRequestingAccess}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {isRequestingAccess ? (
                <>
                  <CircularSpinner size={16} color="#FFFFFF" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                'Submit Access Request'
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleSendAccessRequest}>
          <div style={{ marginBottom: 14, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
            You are requesting permission to publish promotions, banner ads, and special discount offers on Logo. Logo Admin will review your request in the <strong>Registration Requests &rarr; Promo Access Requests</strong> section.
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Merchant Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.business_name || formData.merchant_name || 'Cartech'}
              disabled
              style={{ background: '#F8FAFC', color: '#64748B' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Reason / Note for Admin (Optional)</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="e.g. We want to publish special seasonal festival discount banners and monthly service offers on Logo..."
              value={accessRequestReason}
              onChange={(e) => setAccessRequestReason(e.target.value)}
            />
          </div>

          <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, color: '#1E40AF' }}>
            🔔 When you click Submit, an instant notification will be delivered to Logo Administrators, and your request will be listed in the Admin portal for review.
          </div>
        </form>
      </Modal>

      {/* ========================================================
          REGISTER COMPLAINT MODAL
          ======================================================== */}
      <Modal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        title="Register / Send Complaint to Logo Admin"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-outline"
              onClick={() => setIsComplaintModalOpen(false)}
              disabled={complaintSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateComplaint}
              disabled={complaintSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {complaintSubmitting ? (
                <>
                  <CircularSpinner size={16} color="#FFFFFF" />
                  <span>Sending Complaint...</span>
                </>
              ) : (
                'Submit Complaint to Admin'
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateComplaint}>
          {complaintError && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#991B1B', marginBottom: 14, fontSize: 13, fontWeight: 600 }}>
              ⚠️ {complaintError}
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Merchant Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.business_name || 'Cartech'}
                disabled
                style={{ background: '#F8FAFC', color: '#64748B' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Complainant / Contact Person</label>
              <input
                type="text"
                className="form-input"
                value={formData.owner_name || 'Cartech'}
                disabled
                style={{ background: '#F8FAFC', color: '#64748B' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Complaint Subject *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Promotion banner not showing on homepage / Need category change / Dispute"
              value={newComplaint.subject}
              onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Complaint Category *</label>
              <select
                className="form-select"
                value={newComplaint.category}
                onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
              >
                <option value="Promotion & Banner Issue">📢 Promotion & Banner Issue</option>
                <option value="Profile & Verification">🏪 Profile & Listing Verification</option>
                <option value="Technical & App Glitch">⚙️ Technical & App Glitch</option>
                <option value="Payment & Payout">💳 Payment & Billing</option>
                <option value="Customer Dispute">👥 Customer Dispute</option>
                <option value="General Support">❓ General Support</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Priority Level</label>
              <select
                className="form-select"
                value={newComplaint.priority}
                onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
              >
                <option value="low">🟢 Low (General inquiry)</option>
                <option value="medium">🟡 Medium (Important issue)</option>
                <option value="high">🔴 High (Urgent blocker)</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Detailed Description of Issue *</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Describe your issue or dispute in detail so Logo Administration can investigate and reply..."
              value={newComplaint.description}
              onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, color: '#1E40AF' }}>
            🔔 When you click Submit, your complaint is instantly recorded in PostgreSQL and delivered to the Logo Admin Complaints management dashboard. Admin replies will be visible on your Complaints tab.
          </div>
        </form>
      </Modal>

      {/* ========================================================
          VIEW COMPLAINT DETAIL MODAL
          ======================================================== */}
      <Modal
        isOpen={!!selectedViewComplaint}
        onClose={() => setSelectedViewComplaint(null)}
        title={selectedViewComplaint ? `Complaint Details: ${selectedViewComplaint.complaint_code || `CMP-${selectedViewComplaint.id}`}` : 'Complaint Details'}
        size="lg"
        footer={
          <button className="btn btn-outline" onClick={() => setSelectedViewComplaint(null)}>
            Close
          </button>
        }
      >
        {selectedViewComplaint && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
                  {selectedViewComplaint.subject}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                  ID: #{selectedViewComplaint.id} &bull; Category: {selectedViewComplaint.category} &bull; Date: {selectedViewComplaint.date}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatusBadge status={selectedViewComplaint.priority} />
                <StatusBadge status={selectedViewComplaint.status} />
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
              <strong style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 4 }}>COMPLAINT DESCRIPTION:</strong>
              <p style={{ margin: 0, fontSize: 14, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {selectedViewComplaint.description || 'No description provided.'}
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                🛡️ Logo Admin Official Reply & Resolution
              </label>
              {selectedViewComplaint.admin_response ? (
                <div style={{ background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: 8, padding: '14px 16px', fontSize: 14, color: '#065F46', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {selectedViewComplaint.admin_response}
                </div>
              ) : (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#B45309' }}>
                  ⏳ Awaiting response from Logo Administration. When the administrator investigates and replies, their message will appear here.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

