import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineRefresh,
  HiOutlinePhotograph,
  HiOutlineExternalLink,
  HiOutlineCheck,
  HiCheckCircle,
  HiXCircle,
  HiTag,
  HiEye,
  HiOutlineX,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import Modal from '../components/UI/Modal';
import CircularSpinner from '../components/UI/CircularSpinner';
import PromotionImageCropperModal, { PLACEMENT_SPECS } from '../components/UI/PromotionImageCropperModal';
import {
  fetchPromotionsList,
  createPromotion,
  updatePromotion,
  deletePromotion,
  uploadPromotionMedia,
  approvePromotion,
  rejectPromotion,
} from '../api/promotionApi';
import { fetchCategoriesList } from '../api/categoryApi';
import { uploadMerchantMedia } from '../api/merchantApi';

const fallbackCategories = [
  'Retail & Shopping',
  'Solar & Electricals',
  'Automobile & Spares',
  'Shopping & Fashion',
  'Hotels & Dining',
  'Healthcare & Medicals',
  'Interiors & Furniture',
  'Education & Training',
  'Aluminium Fabrication',
  'Travels & Transport',
];

const AD_SECTIONS = [
  {
    id: 'Pending Requests',
    label: 'Pending Requests',
    badge: 'Pending Approval',
    icon: '⏳',
    headline: 'Merchant Submitted Promotion Requests',
    description:
      'Review, edit, approve, or reject promotions submitted by merchants. Approved promotions become eligible for public landing page display.',
    recommendedRatio: 'Admin Moderation Queue',
  },
  {
    id: 'Home Top',
    label: 'Top Banners',
    badge: 'Home Top',
    icon: '🎯',
    headline: 'Top Landing Page Banner Slider',
    description:
      'Full-width auto-sliding commercial advertisement banners & video showcases displayed prominently at the very top of the landing page.',
    recommendedRatio: 'Panoramic 16:5 (1920×600 px) or Square Poster 1:1 (1080×1080 px) | Video: 1920×1080 px (16:9)',
  },
  {
    id: 'Home Middle',
    label: 'Middle Ads',
    badge: 'Home Middle',
    icon: '📢',
    headline: 'In-Between Sponsored Showcase (After 3 Rows)',
    description:
      'Split-layout sponsored showcase banner (Left: full-view image/video with ambient shadow; Right: headlines, description, tags & CTA button) placed directly after 3 rows of merchant cards.',
    recommendedRatio: 'Widescreen 16:9 (1280×720 px) or 4:3 / 1:1 | Full View (Zero Crop)',
  },
  {
    id: 'Above Footer',
    label: 'Above Footer',
    badge: 'Above Footer',
    icon: '🎬',
    headline: 'Above Footer Showcase Banner & Video',
    description:
      'High-impact split-layout showcase banner placed directly above the footer. Supports background/inline video, tags, headlines, and call-to-actions with real-time live synchronization.',
    recommendedRatio: 'Widescreen 16:9 (1920×1080 px Full HD) | Video: 1920×1080 px',
  },
  {
    id: 'Featured Offers',
    label: 'Featured Offers',
    badge: 'Featured Offers',
    icon: '🔥',
    headline: 'Featured Offers & Discounts Carousel',
    description:
      'Interactive auto-scrolling deals carousel with discount badges, merchant links, and validity dates.',
    recommendedRatio: 'Card format 3:2 (600×400 px) | Square 1:1 (500×500 px)',
  },
  {
    id: 'Special Offer',
    label: 'Special Deals',
    badge: 'Special Offer',
    icon: '⚡',
    headline: 'Floating Special Offer Widget',
    description:
      'High-conversion deals displayed inside the red floating flame button and popup card on the bottom-right.',
    recommendedRatio: 'Compact Widget 4:3 (600×450 px) or Square 1:1 (500×500 px)',
  },
  {
    id: 'Moving Text',
    label: 'Moving Text',
    badge: 'Moving Text',
    icon: '📢',
    headline: 'Scrolling Announcement Ticker Bar',
    description:
      'Continuous marquee moving announcements displayed below the top navbar on the Landing Page. Add, edit, or toggle active status with real-time live synchronization.',
    recommendedRatio: 'Text Announcement Only (No image/video required)',
  },
];

const initialFormState = {
  title: '',
  description: '',
  type: 'Banner',
  placement: 'Home Top',
  category: 'Retail & Shopping',
  location: 'Kerala',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '2027-12-31',
  mediaType: 'image', // 'image' or 'video'
  imageUrl: '',
  videoUrl: '',
  targetUrl: '',
  status: 'active',
};

export default function Promotions() {
  const [promoList, setPromoList] = useState([]);
  const [categoriesList, setCategoriesList] = useState(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home Top');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPromo, setNewPromo] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');
  const [editUploadingImage, setEditUploadingImage] = useState(false);

  // View preview modal state
  const [previewPromo, setPreviewPromo] = useState(null);

  // Image Cropper Modal State
  const [cropperState, setCropperState] = useState({
    isOpen: false,
    imageSrc: '',
    placement: 'Home Top',
    isEdit: false,
    originalFile: null,
  });

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const apiData = await fetchPromotionsList();
      if (Array.isArray(apiData) && apiData.length > 0) {
        const formatted = apiData.map((item, idx) => ({
          id: item.id || item._id || `p-db-${idx}`,
          title: item.title || item.name || 'Featured Promotion',
          description: item.description || '',
          type: item.type || 'Banner',
          category: item.category || 'Retail & Shopping',
          placement: item.placement || 'Home Top',
          location: item.location || 'Kerala',
          startDate: item.start_date || item.startDate || '2026-10-01',
          endDate: item.end_date || item.endDate || '2027-12-31',
          status: (item.status || 'ACTIVE').toLowerCase(),
          impressions: item.impressions || item.views || 0,
          clicks: item.clicks || 0,
          imageUrl: item.image_url || item.banner_url || item.bannerUrl || item.image || '',
          videoUrl: item.video_url || item.videoUrl || '',
          mediaType: item.media_type || (item.video_url || item.videoUrl ? 'video' : 'image'),
          targetUrl: item.target_url || item.targetUrl || '#',
          phone: item.phone || '',
          merchant_id: item.merchant_id || item.merchantId || null,
          merchant_name: item.merchant_name || item.merchantName || '',
          rejection_reason: item.rejection_reason || item.rejectionReason || '',
        }));
        setPromoList(formatted);
      } else {
        setPromoList([]);
      }
    } catch (err) {
      console.warn('Backend fetchPromotionsList error:', err);
    } finally {
      setLoading(false);
    }

    try {
      const apiCategories = await fetchCategoriesList();
      if (Array.isArray(apiCategories) && apiCategories.length > 0) {
        const catNames = apiCategories
          .map((c) => c.name || c.category_name)
          .filter((name) => name && !name.startsWith('http'));
        if (catNames.length > 0) {
          setCategoriesList(Array.from(new Set([...fallbackCategories, ...catNames])));
        }
      }
    } catch (catErr) {
      console.warn('Backend categories fetch notice:', catErr);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Upload image or video to DigitalOcean Spaces CDN
  const handleFileUpload = async (file, isEdit = false) => {
    if (!file) return;

    try {
      if (isEdit) setEditUploadingImage(true);
      else setUploadingImage(true);

      const res = await uploadPromotionMedia(file);
      const uploadedUrl = res.media_url || res.url || res.image_url || res.video_url || '';
      const isVideoFile = file.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
      const detectedMediaType = res.media_type || (isVideoFile ? 'video' : 'image');

      if (uploadedUrl) {
        if (isEdit) {
          setEditFormData((prev) => ({
            ...prev,
            imageUrl: detectedMediaType === 'image' ? uploadedUrl : prev.imageUrl,
            videoUrl: detectedMediaType === 'video' ? uploadedUrl : prev.videoUrl,
            mediaType: detectedMediaType,
          }));
          setEditError('');
        } else {
          setNewPromo((prev) => ({
            ...prev,
            imageUrl: detectedMediaType === 'image' ? uploadedUrl : prev.imageUrl,
            videoUrl: detectedMediaType === 'video' ? uploadedUrl : prev.videoUrl,
            mediaType: detectedMediaType,
          }));
          setAddError('');
        }
      } else {
        throw new Error('Upload server did not return a valid media URL');
      }
    } catch (uploadErr) {
      console.error('Media upload failed:', uploadErr);
      const errMsg = uploadErr.message || 'Media upload failed. Please try a valid PNG, JPG, or MP4 video file.';
      if (isEdit) setEditError(errMsg);
      else setAddError(errMsg);
    } finally {
      if (isEdit) setEditUploadingImage(false);
      else setUploadingImage(false);
    }
  };

  // Intercept file selection to open Interactive Image Cropper Modal for images
  const handleFileInputChange = (file, isEdit = false) => {
    if (!file) return;

    const isVideo = file.type?.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
    if (isVideo) {
      handleFileUpload(file, isEdit);
    } else {
      const objUrl = URL.createObjectURL(file);
      const currentPlacement = isEdit ? editFormData?.placement : newPromo.placement;
      setCropperState({
        isOpen: true,
        imageSrc: objUrl,
        placement: currentPlacement || 'Home Top',
        isEdit,
        originalFile: file,
      });
    }
  };

  // Open cropper for an existing image URL
  const handleOpenCropperForExisting = (imageUrl, isEdit = false) => {
    if (!imageUrl) return;
    const currentPlacement = isEdit ? editFormData?.placement : newPromo.placement;
    setCropperState({
      isOpen: true,
      imageSrc: imageUrl,
      placement: currentPlacement || 'Home Top',
      isEdit,
      originalFile: null,
    });
  };

  // Placement Sizing Guide Card Component
  const renderPlacementSizingGuide = (placement, mediaType = 'image') => {
    const spec = PLACEMENT_SPECS[placement] || PLACEMENT_SPECS['Home Top'];
    if (placement === 'Moving Text') return null;

    return (
      <div
        style={{
          background: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 24, flexShrink: 0, marginTop: 1 }}>📐</div>
        <div style={{ flex: 1, fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.5 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 4,
            }}
          >
            <strong style={{ fontSize: 13, color: '#1e40af' }}>
              {spec.label} — Optimal Fit Dimensions Guide
            </strong>
            <span
              style={{
                background: '#2563eb',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 6,
              }}
            >
              {mediaType === 'video' ? '16:9 Full HD' : spec.ratioLabel}
            </span>
          </div>
          <div style={{ color: '#0f172a', marginBottom: 2 }}>
            <strong>Recommended Size:</strong>{' '}
            <span style={{ color: '#2563eb', fontWeight: 800, fontSize: 13 }}>
              {mediaType === 'video' ? '1920 × 1080 px (16:9 MP4/WebM)' : `${spec.idealWidth} × ${spec.idealHeight} px`}
            </span>
            {mediaType !== 'video' && placement === 'Home Top' && (
              <span style={{ color: '#64748b', fontSize: 11.5, marginLeft: 6 }}>
                (or 1080 × 1080 px for square poster)
              </span>
            )}
          </div>
          <div style={{ color: '#475569', fontSize: 12 }}>
            💡 {spec.tips}
          </div>
          {mediaType === 'video' && (
            <div style={{ color: '#7c3aed', fontSize: 11.5, marginTop: 3 }}>
              🎬 <strong>Video Specification:</strong> {spec.videoSpecs}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Create Promotion Handler
  const handleCreatePromo = async (e) => {
    if (e) e.preventDefault();
    setAddError('');

    if (!newPromo.title.trim()) {
      setAddError('Please enter an advertisement title.');
      return;
    }

    if (uploadingImage) {
      setAddError('Image/media upload is in progress. Please wait until it completes.');
      return;
    }

    const currentPlacement = newPromo.placement || activeTab || 'Home Top';

    if (currentPlacement !== 'Moving Text' && !newPromo.imageUrl?.trim() && !newPromo.videoUrl?.trim()) {
      setAddError(`Please upload a banner image or enter an image URL for "${currentPlacement}". An image is required to display this banner on the landing page.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: newPromo.title.trim(),
        description: newPromo.description ? newPromo.description.trim() : null,
        type: newPromo.type || (currentPlacement === 'Moving Text' ? 'Text Carousel' : 'Banner'),
        category: newPromo.category || 'Retail & Shopping',
        placement: currentPlacement,
        location: newPromo.location || 'Kerala',
        start_date: newPromo.startDate || '2026-10-01',
        end_date: newPromo.endDate || '2027-12-31',
        status: (newPromo.status || 'ACTIVE').toLowerCase(),
        image_url: newPromo.imageUrl ? newPromo.imageUrl.trim() : null,
        video_url: newPromo.videoUrl ? newPromo.videoUrl.trim() : null,
        media_type: newPromo.mediaType || (newPromo.videoUrl ? 'video' : 'image'),
        target_url: newPromo.targetUrl || '#',
      };

      const createdItem = await createPromotion(payload);

      const formattedCreated = {
        id: createdItem.id || `p-${Date.now()}`,
        title: createdItem.title || newPromo.title,
        description: createdItem.description || newPromo.description || '',
        type: createdItem.type || newPromo.type,
        category: createdItem.category || newPromo.category,
        placement: createdItem.placement || currentPlacement,
        location: createdItem.location || newPromo.location,
        startDate: createdItem.start_date || newPromo.startDate,
        endDate: createdItem.end_date || newPromo.endDate,
        status: (createdItem.status || 'active').toLowerCase(),
        impressions: 0,
        clicks: 0,
        imageUrl: createdItem.image_url || newPromo.imageUrl || '',
        videoUrl: createdItem.video_url || newPromo.videoUrl || '',
        mediaType: createdItem.media_type || newPromo.mediaType || (newPromo.videoUrl ? 'video' : 'image'),
        targetUrl: createdItem.target_url || newPromo.targetUrl || '#',
      };

      setPromoList((prev) => [formattedCreated, ...prev]);
      setShowAddModal(false);
      setNewPromo(initialFormState);
    } catch (err) {
      console.error('Failed to create promotion:', err);
      setAddError(err.message || 'Failed to save promotion to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (promo) => {
    setEditFormData({
      ...promo,
      description: promo.description || '',
      imageUrl: promo.imageUrl || '',
      videoUrl: promo.videoUrl || '',
      mediaType: promo.mediaType || (promo.videoUrl ? 'video' : 'image'),
      targetUrl: promo.targetUrl || '',
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  // Submit Edit Promotion Handler
  const handleEditSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!editFormData || !editFormData.title.trim()) return;

    if (editUploadingImage) {
      setEditError('Image/media upload is in progress. Please wait until it completes.');
      return;
    }

    if (editFormData.placement !== 'Moving Text' && !editFormData.imageUrl?.trim() && !editFormData.videoUrl?.trim()) {
      setEditError(`Please upload a banner image or enter an image URL for "${editFormData.placement}".`);
      return;
    }

    setIsUpdating(true);
    setEditError('');
    try {
      const payload = {
        title: editFormData.title.trim(),
        description: editFormData.description ? editFormData.description.trim() : null,
        category: editFormData.category,
        type: editFormData.type,
        placement: editFormData.placement,
        location: editFormData.location,
        start_date: editFormData.startDate,
        end_date: editFormData.endDate,
        status: editFormData.status.toLowerCase(),
        image_url: editFormData.imageUrl ? editFormData.imageUrl.trim() : null,
        video_url: editFormData.videoUrl ? editFormData.videoUrl.trim() : null,
        media_type: editFormData.mediaType || (editFormData.videoUrl ? 'video' : 'image'),
        target_url: editFormData.targetUrl || '#',
      };

      const updated = await updatePromotion(editFormData.id, payload);

      setPromoList((prev) =>
        prev.map((item) =>
          item.id === editFormData.id
            ? {
                ...item,
                title: updated.title || editFormData.title,
                description: updated.description !== undefined ? updated.description : editFormData.description,
                category: updated.category || editFormData.category,
                placement: updated.placement || editFormData.placement,
                location: updated.location || editFormData.location,
                startDate: updated.start_date || editFormData.startDate,
                endDate: updated.end_date || editFormData.endDate,
                status: (updated.status || editFormData.status).toLowerCase(),
                imageUrl: updated.image_url || editFormData.imageUrl,
                videoUrl: updated.video_url || editFormData.videoUrl,
                mediaType: updated.media_type || editFormData.mediaType || (editFormData.videoUrl ? 'video' : 'image'),
                targetUrl: updated.target_url || editFormData.targetUrl,
              }
            : item
        )
      );
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update promotion:', err);
      setEditError(err.message || 'Failed to update promotion');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Promotion Handler
  const handleDeletePromo = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete advertisement "${title}"?`)) {
      return;
    }
    try {
      await deletePromotion(id);
      setPromoList((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.warn('Delete promo notice:', err);
      setPromoList((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (promo) => {
    const nextStatus = promo.status === 'active' ? 'inactive' : 'active';
    try {
      await updatePromotion(promo.id, {
        ...promo,
        status: nextStatus,
        start_date: promo.startDate,
        end_date: promo.endDate,
        image_url: promo.imageUrl,
        target_url: promo.targetUrl,
      });
      setPromoList((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, status: nextStatus } : p))
      );
    } catch (err) {
      console.warn('Status toggle error:', err);
    }
  };

  // Approve submitted promotion
  const handleApprovePromotion = async (id) => {
    try {
      await approvePromotion(id);
      setPromoList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'active' } : p))
      );
    } catch (err) {
      console.error('Failed to approve promotion:', err);
      alert(err.message || 'Failed to approve promotion');
    }
  };

  // Reject submitted promotion with optional reason
  const handleRejectPromotion = async (id) => {
    const reason = window.prompt(
      'Please enter the reason for rejection (optional):',
      'Does not meet advertising guidelines'
    );
    if (reason === null) return;
    try {
      await rejectPromotion(id, reason);
      setPromoList((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: 'rejected', rejection_reason: reason } : p
        )
      );
    } catch (err) {
      console.error('Failed to reject promotion:', err);
      alert(err.message || 'Failed to reject promotion');
    }
  };

  // Filter ads by Active Placement Tab + Search Query + Category
  const currentSection = AD_SECTIONS.find((s) => s.id === activeTab) || AD_SECTIONS[0];

  const displayedPromos = promoList.filter((p) => {
    // Pending Requests tab filter
    if (activeTab === 'Pending Requests') {
      const isPending = (p.status || '').toLowerCase() === 'pending';
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.merchant_name || '').toLowerCase().includes(q);
      const matchesCategory =
        selectedCategoryFilter === 'All' ||
        (p.category && p.category.toLowerCase() === selectedCategoryFilter.toLowerCase());
      return isPending && matchesCategory && matchesSearch;
    }

    // Placement filter
    const isAboveFooterTab = activeTab === 'Above Footer' || activeTab === 'Home Bottom';
    const matchesPlacement =
      activeTab === 'Moving Text'
        ? p.placement &&
          (p.placement.toLowerCase().includes('moving') ||
            p.placement.toLowerCase().includes('ticker'))
        : isAboveFooterTab
        ? p.placement &&
          (p.placement.toLowerCase() === 'above footer' ||
           p.placement.toLowerCase() === 'home bottom' ||
           p.placement.toLowerCase().includes('bottom') ||
           p.placement.toLowerCase().includes('footer'))
        : p.placement &&
          (p.placement.toLowerCase() === activeTab.toLowerCase() ||
           p.placement.toLowerCase().startsWith(activeTab.toLowerCase()));

    // Category filter
    const matchesCategory =
      selectedCategoryFilter === 'All' ||
      (p.category && p.category.toLowerCase() === selectedCategoryFilter.toLowerCase());

    // Search query
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.placement || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q) ||
      (p.merchant_name || '').toLowerCase().includes(q);

    return matchesPlacement && matchesCategory && matchesSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 60 }}>
      <PageHeader
        title="Promotions & Banner Ads"
        subtitle="Manage landing page top slider, middle in-between ads, above footer showcase, moving ticker text & featured offers synced live"
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={loadData} title="Refresh Live Data">
            <HiOutlineRefresh /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setAddError('');
              setNewPromo({
                ...initialFormState,
                placement: activeTab || 'Home Top',
                type: activeTab === 'Moving Text' ? 'Text Carousel' : 'Banner',
              });
              setShowAddModal(true);
            }}
          >
            <HiOutlinePlus /> + Add New Ad
          </button>
        </div>
      </PageHeader>

      {/* ========================================================
          1. DEDICATED POSITION TABS (TOP BANNERS, MIDDLE ADS, OFFERS, SPECIAL, MOVING TEXT)
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {AD_SECTIONS.map((sec) => {
          const isAboveFooterSec = sec.id === 'Above Footer' || sec.id === 'Home Bottom';
          const count =
            sec.id === 'Pending Requests'
              ? promoList.filter((p) => (p.status || '').toLowerCase() === 'pending').length
              : sec.id === 'Moving Text'
              ? promoList.filter(
                  (p) =>
                    p.placement &&
                    (p.placement.toLowerCase().includes('moving') ||
                      p.placement.toLowerCase().includes('ticker'))
                ).length
              : isAboveFooterSec
              ? promoList.filter(
                  (p) =>
                    p.placement &&
                    (p.placement.toLowerCase() === 'above footer' ||
                     p.placement.toLowerCase() === 'home bottom' ||
                     p.placement.toLowerCase().includes('bottom') ||
                     p.placement.toLowerCase().includes('footer'))
                ).length
              : promoList.filter(
                  (p) =>
                    p.placement &&
                    (p.placement.toLowerCase() === sec.id.toLowerCase() ||
                     p.placement.toLowerCase().startsWith(sec.id.toLowerCase()))
                ).length;
          const isActive = activeTab === sec.id;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveTab(sec.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 12,
                border: isActive ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: isActive ? '#eff6ff' : '#ffffff',
                color: isActive ? '#2563eb' : '#334155',
                fontWeight: isActive ? 800 : 600,
                fontSize: 13.5,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
              }}
            >
              <span style={{ fontSize: 16 }}>{sec.icon}</span>
              <span>{sec.label}</span>
              <span
                style={{
                  background: isActive ? '#2563eb' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          2. SECTION BANNER INFO CARD (HEADLINE, DESCRIPTION, SPECS)
          ======================================================== */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          color: '#ffffff',
          padding: '22px 26px',
          borderRadius: 16,
          marginBottom: 24,
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>{currentSection.icon}</span>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '3px 10px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.5,
              }}
            >
              {currentSection.badge}
            </span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#ffffff' }}>
            {currentSection.headline}
          </h2>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#dbeafe', lineHeight: 1.4 }}>
            {currentSection.description}
          </p>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: '#fef08a',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>📐 {currentSection.recommendedRatio}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setAddError('');
            setNewPromo({
              ...initialFormState,
              placement: activeTab || 'Home Top',
              type: activeTab === 'Moving Text' ? 'Text Carousel' : 'Banner',
            });
            setShowAddModal(true);
          }}
          style={{
            background: '#ffffff',
            color: '#1d4ed8',
            border: 'none',
            padding: '12px 22px',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 13.5,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <HiOutlinePlus size={18} /> Add {activeTab === 'Moving Text' ? 'Moving Text' : `Ad to ${currentSection.label}`}
        </button>
      </div>

      {/* ========================================================
          LIVE INTERACTIVE TICKER BAR PREVIEW (FOR MOVING TEXT TAB)
          ======================================================== */}
      {activeTab === 'Moving Text' && (
        <div
          style={{
            marginBottom: 24,
            borderRadius: 14,
            background: 'linear-gradient(90deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
            padding: '14px 20px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#ef4444',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
            }}
          >
            <span>⚡ LIVE TICKER PREVIEW</span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {displayedPromos.filter((p) => p.status === 'active').length > 0 ? (
              <div className="zeas-ticker-track">
                <div className="zeas-ticker-items" style={{ fontSize: 13.5, fontWeight: 600, color: '#f8fafc' }}>
                  {displayedPromos
                    .filter((p) => p.status === 'active')
                    .concat(displayedPromos.filter((p) => p.status === 'active'))
                    .map((p, i) => (
                      <span key={`p1-${p.id || i}-${i}`} className="zeas-ticker-item">
                        <span>{p.title}</span>
                        <span className="zeas-ticker-bullet">&bull;</span>
                      </span>
                    ))}
                </div>
                <div className="zeas-ticker-items" aria-hidden="true" style={{ fontSize: 13.5, fontWeight: 600, color: '#f8fafc' }}>
                  {displayedPromos
                    .filter((p) => p.status === 'active')
                    .concat(displayedPromos.filter((p) => p.status === 'active'))
                    .map((p, i) => (
                      <span key={`p2-${p.id || i}-${i}`} className="zeas-ticker-item">
                        <span>{p.title}</span>
                        <span className="zeas-ticker-bullet">&bull;</span>
                      </span>
                    ))}
                </div>
              </div>
            ) : (
              <span style={{ color: '#94a3b8', fontSize: 13, padding: '0 12px' }}>
                No active moving text announcements found. Click &quot;+ Add Moving Text&quot; to publish one.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          3. SEARCH & CATEGORY FILTER
          ======================================================== */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ position: 'relative', minWidth: 260, flex: 1 }}>
          <HiOutlineSearch
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: 18,
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 42, margin: 0, width: '100%' }}
            placeholder={`Search ${currentSection.label.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Category:</span>
          <select
            className="form-select"
            style={{ margin: 0, width: 'auto', minWidth: 170 }}
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categoriesList.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div
          style={{
            padding: '16px 20px',
            marginBottom: 20,
            background: '#EFF6FF',
            borderRadius: 12,
            border: '1px solid #BFDBFE',
            color: '#1D4ED8',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CircularSpinner size={16} color="#1D4ED8" />
          <span>Syncing advertisements live...</span>
        </div>
      )}

      {/* ========================================================
          4. GRID OF ADS (EDIT, DELETE, PREVIEW, LIVE TOGGLE)
          ======================================================== */}
      {displayedPromos.length === 0 && !loading ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '50px 20px',
            color: '#64748b',
            borderRadius: 14,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📢</div>
          <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
            No advertisements found in {currentSection.label}
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
            Click the button below to add your first live advertisement banner or deal.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setAddError('');
              setNewPromo({
                ...initialFormState,
                placement: activeTab || 'Home Top',
                type: activeTab === 'Moving Text' ? 'Text Carousel' : 'Banner',
              });
              setShowAddModal(true);
            }}
          >
            <HiOutlinePlus /> + Add New Ad
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20,
          }}
        >
          {displayedPromos.map((promo, idx) => (
            <motion.div
              key={promo.id || idx}
              className="card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
              }}
            >
              {/* Banner Image Preview */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 160,
                  backgroundColor: '#f1f5f9',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onClick={() => setPreviewPromo(promo)}
              >
                {promo.mediaType === 'video' || promo.videoUrl ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#0f172a' }}>
                    <video
                      src={promo.videoUrl}
                      poster={promo.imageUrl || ''}
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(147, 51, 234, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      🎬 VIDEO AD
                    </div>
                  </div>
                ) : promo.imageUrl ? (
                  <img
                    src={promo.imageUrl}
                    alt={promo.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: promo.placement === 'Home Middle' ? 'contain' : 'cover',
                      objectPosition: 'center',
                      backgroundColor: promo.placement === 'Home Middle' ? '#0b1329' : 'transparent',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.style.background =
                        'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)';
                    }}
                  />
                ) : promo.placement &&
                  (promo.placement.toLowerCase().includes('moving') ||
                    promo.placement.toLowerCase().includes('ticker')) ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 16,
                      color: '#ffffff',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 4 }}>⚡</div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#38bdf8',
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                      }}
                    >
                      Moving Ticker Text
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#cbd5e1',
                        marginTop: 4,
                        maxWidth: '90%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {promo.title}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 800,
                    }}
                  >
                    No Media Uploaded
                  </div>
                )}

                {/* Placement Tag Badge */}
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    letterSpacing: 0.5,
                  }}
                >
                  {promo.placement}
                </span>

                {/* Status Badge */}
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: promo.status === 'active' ? '#16a34a' : '#64748b',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    textTransform: 'uppercase',
                  }}
                >
                  {promo.status}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {(promo.merchant_name || promo.merchant_id) && (
                  <div
                    style={{
                      background: '#F5F3FF',
                      color: '#6D28D9',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      marginBottom: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <span>🏬 Merchant: {promo.merchant_name || 'Cartech'}</span>
                    {promo.merchant_id && <span>(#{promo.merchant_id})</span>}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <h4
                    style={{
                      margin: '0 0 6px',
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#0f172a',
                      lineHeight: 1.3,
                    }}
                  >
                    {promo.title}
                  </h4>
                </div>

                {promo.description && (
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: 12.5,
                      color: '#64748b',
                      lineHeight: 1.4,
                    }}
                  >
                    {promo.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    margin: '6px 0 12px',
                    fontSize: 11,
                  }}
                >
                  <span
                    style={{
                      background: '#eff6ff',
                      color: '#2563eb',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontWeight: 700,
                    }}
                  >
                    🏷️ {promo.category || 'Retail'}
                  </span>
                  <span
                    style={{
                      background: '#f8fafc',
                      color: '#64748b',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    📍 {promo.location || 'Kerala'}
                  </span>
                </div>

                {promo.targetUrl && promo.targetUrl !== '#' && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginBottom: 10,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <HiOutlineExternalLink size={14} />
                    <a
                      href={promo.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'none' }}
                    >
                      {promo.targetUrl}
                    </a>
                  </div>
                )}

                {/* Footer Actions (Approve/Reject for Pending, or Active Toggle, Edit, Delete) */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: 12,
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  {promo.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleApprovePromotion(promo.id)}
                        className="btn btn-sm"
                        title="Approve Promotion & Make Eligible for Landing Page"
                        style={{
                          background: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <HiOutlineCheck size={14} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectPromotion(promo.id)}
                        className="btn btn-sm"
                        title="Reject Promotion"
                        style={{
                          background: '#EF4444',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <HiOutlineX size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(promo)}
                      style={{
                        background: promo.status === 'active' ? '#f0fdf4' : promo.status === 'rejected' ? '#fef2f2' : '#f8fafc',
                        color: promo.status === 'active' ? '#16a34a' : promo.status === 'rejected' ? '#ef4444' : '#64748b',
                        border: `1px solid ${promo.status === 'active' ? '#bbf7d0' : promo.status === 'rejected' ? '#fecaca' : '#e2e8f0'}`,
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {promo.status === 'active' ? 'Active' : promo.status === 'rejected' ? 'Rejected' : 'Inactive'}
                    </button>
                  )}

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(promo)}
                      className="btn btn-sm btn-outline"
                      title="Edit Advertisement"
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <HiOutlinePencil size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePromo(promo.id, promo.title)}
                      className="btn btn-sm"
                      title="Delete Advertisement"
                      style={{
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 700,
                        background: '#fef2f2',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <HiOutlineTrash size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ========================================================
          5. ADD NEW AD MODAL (WITH DO SPACES CDN UPLOAD)
          ======================================================== */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={
            newPromo.placement === 'Moving Text'
              ? '+ Add Moving Text Announcement'
              : `+ Add Advertisement (${newPromo.placement})`
          }
          maxWidth="640px"
        >
          <form onSubmit={handleCreatePromo}>
            {addError && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {addError}
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label className="form-label">
                {newPromo.placement === 'Moving Text'
                  ? 'Moving Announcement Text'
                  : 'Advertisement Title'}{' '}
                <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  newPromo.placement === 'Moving Text'
                    ? 'e.g. ⚡ Festive Season Offers — Check Out Exclusive Deals Near You'
                    : 'e.g. Kerala Festive Electronics Mega Sale'
                }
                value={newPromo.title}
                onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                required
              />
            </div>

            {/* Description (Optional) */}
            <div className="form-group">
              <label className="form-label">
                {newPromo.placement === 'Moving Text'
                  ? 'Additional Details / Note (Optional)'
                  : 'Description / Tagline (Optional)'}
              </label>
              <textarea
                className="form-input"
                rows={2}
                placeholder={
                  newPromo.placement === 'Moving Text'
                    ? 'Optional details or note for this announcement'
                    : 'Short description of the deal or promotion'
                }
                value={newPromo.description || ''}
                onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
              />
            </div>

            {/* Placement & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Ad Placement / Position</label>
                <select
                  className="form-select"
                  value={newPromo.placement}
                  onChange={(e) =>
                    setNewPromo({
                      ...newPromo,
                      placement: e.target.value,
                      type: e.target.value === 'Moving Text' ? 'Text Carousel' : 'Banner',
                    })
                  }
                >
                  <option value="Home Top">Home Top (Top Banner Slider)</option>
                  <option value="Home Middle">Home Middle (After 3 Rows of Shops)</option>
                  <option value="Above Footer">Above Footer (Showcase Banner & Video)</option>
                  <option value="Featured Offers">Featured Offers (Deals Carousel)</option>
                  <option value="Special Offer">Special Offer (Floating Widget)</option>
                  <option value="Moving Text">Moving Text (Scrolling Ticker Bar)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={newPromo.category}
                  onChange={(e) => setNewPromo({ ...newPromo, category: e.target.value })}
                >
                  {categoriesList.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Media Format Selector or Moving Text Note */}
            {newPromo.placement === 'Moving Text' ? (
              <div
                style={{
                  padding: '14px 18px',
                  background: '#eff6ff',
                  border: '1.5px dashed #93c5fd',
                  borderRadius: 12,
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 24 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 800 }}>Moving Announcement Ticker Mode</div>
                  <div style={{ fontSize: 11.5, color: '#3b82f6', marginTop: 2 }}>
                    This announcement scrolls continuously across the top ticker bar on the website. No image or video upload is required!
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Visual Sizing Guide for the selected placement */}
                {renderPlacementSizingGuide(newPromo.placement, newPromo.mediaType)}

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                    Media Format
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setNewPromo({ ...newPromo, mediaType: 'image' })}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: newPromo.mediaType === 'image' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: newPromo.mediaType === 'image' ? '#eff6ff' : '#ffffff',
                        color: newPromo.mediaType === 'image' ? '#2563eb' : '#475569',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>🖼️</span> Static Image Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPromo({ ...newPromo, mediaType: 'video' })}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: newPromo.mediaType === 'video' ? '2px solid #9333ea' : '1px solid #cbd5e1',
                        background: newPromo.mediaType === 'video' ? '#faf5ff' : '#ffffff',
                        color: newPromo.mediaType === 'video' ? '#9333ea' : '#475569',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>🎬</span> Video Showcase Ad
                    </button>
                  </div>
                </div>

            {/* Media Upload & URL Box */}
            <div
              style={{
                background: newPromo.mediaType === 'video' ? '#faf5ff' : '#f8fafc',
                border: newPromo.mediaType === 'video' ? '1.5px dashed #c084fc' : '1.5px dashed #cbd5e1',
                borderRadius: 12,
                padding: '16px',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                {newPromo.mediaType === 'video' ? '🎬 Ad Video (MP4, WebM, MOV)' : '📸 Ad Banner Image (JPG, PNG, WebP)'}
              </label>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 10px' }}>
                {newPromo.mediaType === 'video'
                  ? 'Upload commercial promotional video clip or paste direct CDN video link'
                  : 'Upload banner image with interactive cropping tool to fit perfectly'}
              </p>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept={newPromo.mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime,video/mkv' : 'image/*'}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileInputChange(e.target.files[0], false);
                  e.target.value = '';
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage
                    ? 'Uploading to CDN...'
                    : newPromo.mediaType === 'video'
                    ? '📁 Upload Video File'
                    : '📁 Upload & Crop Image'}
                </button>
                {newPromo.mediaType !== 'video' && newPromo.imageUrl && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 700 }}
                    onClick={() => handleOpenCropperForExisting(newPromo.imageUrl, false)}
                  >
                    ✂️ Open Cropper Tool
                  </button>
                )}
              </div>

              {/* Direct URL input fallback */}
              <div style={{ marginTop: 12, textAlign: 'left' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
                  Or enter {newPromo.mediaType === 'video' ? 'Video' : 'Image'} URL:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: 4, fontSize: 12, padding: '6px 10px' }}
                  placeholder={
                    newPromo.mediaType === 'video'
                      ? 'https://.../video.mp4'
                      : 'https://.../banner.png'
                  }
                  value={newPromo.mediaType === 'video' ? newPromo.videoUrl : newPromo.imageUrl}
                  onChange={(e) => {
                    if (newPromo.mediaType === 'video') {
                      setNewPromo({ ...newPromo, videoUrl: e.target.value });
                    } else {
                      setNewPromo({ ...newPromo, imageUrl: e.target.value });
                    }
                  }}
                />
              </div>

              {/* Live Preview */}
              {newPromo.mediaType === 'video' && newPromo.videoUrl ? (
                <div style={{ marginTop: 12 }}>
                  <video
                    src={newPromo.videoUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    style={{
                      maxHeight: 140,
                      maxWidth: '100%',
                      borderRadius: 8,
                      border: '1px solid #c084fc',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#9333ea', fontWeight: 700 }}>
                      ✓ Video Active ({newPromo.placement || 'Banner'} Fit View)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const posterInput = document.createElement('input');
                        posterInput.type = 'file';
                        posterInput.accept = 'image/*';
                        posterInput.onchange = (e) => {
                          if (e.target.files?.[0]) {
                            handleFileInputChange(e.target.files[0], false);
                          }
                        };
                        posterInput.click();
                      }}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: '1px solid #9333ea',
                        background: '#faf5ff',
                        color: '#9333ea',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      📸 Set & Crop Video Cover Poster
                    </button>
                  </div>
                  {newPromo.imageUrl && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>
                      Cover Poster active: <span style={{ color: '#2563eb' }}>{newPromo.imageUrl.slice(0, 35)}...</span>
                    </div>
                  )}
                </div>
              ) : newPromo.imageUrl ? (
                <div style={{ marginTop: 12 }}>
                  <img
                    src={newPromo.imageUrl}
                    alt="Preview"
                    style={{
                      maxHeight: 120,
                      maxWidth: '100%',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      objectFit: 'contain',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                      ✓ Image Ready
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenCropperForExisting(newPromo.imageUrl, false)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: '1px solid #2563eb',
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✂️ Recrop / Adjust View
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            </>
            )}

            {/* Target URL & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Target URL / External Link</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://... or #"
                  value={newPromo.targetUrl}
                  onChange={(e) => setNewPromo({ ...newPromo, targetUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Kerala / Kannur / Kochi"
                  value={newPromo.location}
                  onChange={(e) => setNewPromo({ ...newPromo, location: e.target.value })}
                />
              </div>
            </div>

            {/* Dates & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
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

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={newPromo.status}
                  onChange={(e) => setNewPromo({ ...newPromo, status: e.target.value })}
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || uploadingImage}>
                {isSubmitting ? 'Saving to Database...' : 'Create & Publish Ad'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          6. EDIT AD MODAL (WITH DO SPACES CDN UPLOAD)
          ======================================================== */}
      {isEditModalOpen && editFormData && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={
            editFormData.placement === 'Moving Text'
              ? `Edit Moving Text Announcement (#${editFormData.id})`
              : `Edit Advertisement (#${editFormData.id})`
          }
          maxWidth="640px"
        >
          <form onSubmit={handleEditSubmit}>
            {editError && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {editError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                {editFormData.placement === 'Moving Text'
                  ? 'Moving Announcement Text'
                  : 'Advertisement Title'}{' '}
                <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  editFormData.placement === 'Moving Text'
                    ? 'e.g. ⚡ Festive Season Offers — Check Out Exclusive Deals Near You'
                    : 'Advertisement Title'
                }
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                required
              />
            </div>

            {/* Description (Optional) */}
            <div className="form-group">
              <label className="form-label">
                {editFormData.placement === 'Moving Text'
                  ? 'Additional Details / Note (Optional)'
                  : 'Description / Tagline (Optional)'}
              </label>
              <textarea
                className="form-input"
                rows={2}
                placeholder={
                  editFormData.placement === 'Moving Text'
                    ? 'Optional details or note for this announcement'
                    : 'Short description of the deal or promotion'
                }
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Ad Placement / Position</label>
                <select
                  className="form-select"
                  value={editFormData.placement}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      placement: e.target.value,
                      type: e.target.value === 'Moving Text' ? 'Text Carousel' : 'Banner',
                    })
                  }
                >
                  <option value="Home Top">Home Top (Top Banner Slider)</option>
                  <option value="Home Middle">Home Middle (After 3 Rows of Shops)</option>
                  <option value="Above Footer">Above Footer (Showcase Banner & Video)</option>
                  <option value="Featured Offers">Featured Offers (Deals Carousel)</option>
                  <option value="Special Offer">Special Offer (Floating Widget)</option>
                  <option value="Moving Text">Moving Text (Scrolling Ticker Bar)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                >
                  {categoriesList.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Media Format Selector or Moving Text Note */}
            {editFormData.placement === 'Moving Text' ? (
              <div
                style={{
                  padding: '14px 18px',
                  background: '#eff6ff',
                  border: '1.5px dashed #93c5fd',
                  borderRadius: 12,
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 24 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 800 }}>Moving Announcement Ticker Mode</div>
                  <div style={{ fontSize: 11.5, color: '#3b82f6', marginTop: 2 }}>
                    This announcement scrolls continuously across the top ticker bar on the website. No image or video upload is required!
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Visual Sizing Guide for the selected placement */}
                {renderPlacementSizingGuide(editFormData.placement, editFormData.mediaType)}

                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                    Media Format
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, mediaType: 'image' })}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: editFormData.mediaType === 'image' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: editFormData.mediaType === 'image' ? '#eff6ff' : '#ffffff',
                        color: editFormData.mediaType === 'image' ? '#2563eb' : '#475569',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>🖼️</span> Static Image Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, mediaType: 'video' })}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: editFormData.mediaType === 'video' ? '2px solid #9333ea' : '1px solid #cbd5e1',
                        background: editFormData.mediaType === 'video' ? '#faf5ff' : '#ffffff',
                        color: editFormData.mediaType === 'video' ? '#9333ea' : '#475569',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>🎬</span> Video Showcase Ad
                    </button>
                  </div>
                </div>

            {/* Edit Image or Video Upload to CDN */}
            <div
              style={{
                background: editFormData.mediaType === 'video' ? '#faf5ff' : '#f8fafc',
                border: editFormData.mediaType === 'video' ? '1.5px dashed #c084fc' : '1.5px dashed #cbd5e1',
                borderRadius: 12,
                padding: '16px',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                {editFormData.mediaType === 'video' ? '🎬 Update Banner Video (CDN)' : '📸 Update Banner Image (CDN)'}
              </label>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 10px' }}>
                {editFormData.mediaType === 'video'
                  ? 'Upload new video clip or update direct CDN video link'
                  : 'Upload new image or open the cropper tool to re-adjust framing'}
              </p>

              <input
                type="file"
                ref={editFileInputRef}
                style={{ display: 'none' }}
                accept={editFormData.mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime,video/mkv' : 'image/*'}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileInputChange(e.target.files[0], true);
                  e.target.value = '';
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={editUploadingImage}
                >
                  {editUploadingImage
                    ? 'Uploading to CDN...'
                    : editFormData.mediaType === 'video'
                    ? '📁 Choose New Video File'
                    : '📁 Choose & Crop Image'}
                </button>
                {editFormData.mediaType !== 'video' && editFormData.imageUrl && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 700 }}
                    onClick={() => handleOpenCropperForExisting(editFormData.imageUrl, true)}
                  >
                    ✂️ Open Cropper Tool
                  </button>
                )}
              </div>

              {/* Direct URL input fallback */}
              <div style={{ marginTop: 12, textAlign: 'left' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
                  Or update {editFormData.mediaType === 'video' ? 'Video' : 'Image'} URL:
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: 4, fontSize: 12, padding: '6px 10px' }}
                  placeholder={
                    editFormData.mediaType === 'video'
                      ? 'https://.../video.mp4'
                      : 'https://.../banner.png'
                  }
                  value={editFormData.mediaType === 'video' ? (editFormData.videoUrl || '') : (editFormData.imageUrl || '')}
                  onChange={(e) => {
                    if (editFormData.mediaType === 'video') {
                      setEditFormData({ ...editFormData, videoUrl: e.target.value });
                    } else {
                      setEditFormData({ ...editFormData, imageUrl: e.target.value });
                    }
                  }}
                />
              </div>

              {/* Live Preview */}
              {editFormData.mediaType === 'video' && editFormData.videoUrl ? (
                <div style={{ marginTop: 12 }}>
                  <video
                    src={editFormData.videoUrl}
                    controls
                    autoPlay
                    muted
                    loop
                    style={{
                      maxHeight: 140,
                      maxWidth: '100%',
                      borderRadius: 8,
                      border: '1px solid #c084fc',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#9333ea', fontWeight: 700 }}>
                      ✓ Video Active ({editFormData.placement || 'Banner'} Fit View)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const posterInput = document.createElement('input');
                        posterInput.type = 'file';
                        posterInput.accept = 'image/*';
                        posterInput.onchange = (e) => {
                          if (e.target.files?.[0]) {
                            handleFileInputChange(e.target.files[0], true);
                          }
                        };
                        posterInput.click();
                      }}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: '1px solid #9333ea',
                        background: '#faf5ff',
                        color: '#9333ea',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      📸 Set & Crop Video Cover Poster
                    </button>
                  </div>
                  {editFormData.imageUrl && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>
                      Cover Poster active: <span style={{ color: '#2563eb' }}>{editFormData.imageUrl.slice(0, 35)}...</span>
                    </div>
                  )}
                </div>
              ) : editFormData.imageUrl ? (
                <div style={{ marginTop: 12 }}>
                  <img
                    src={editFormData.imageUrl}
                    alt="Current banner"
                    style={{
                      maxHeight: 120,
                      maxWidth: '100%',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      objectFit: 'contain',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                      ✓ Image Active
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenCropperForExisting(editFormData.imageUrl, true)}
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: '1px solid #2563eb',
                        background: '#eff6ff',
                        color: '#2563eb',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ✂️ Recrop / Adjust View
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            </>
            )}

            {/* Target URL & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Target URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.targetUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, targetUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isUpdating || editUploadingImage}>
                {isUpdating ? 'Saving to Database...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          7. PREVIEW MODAL
          ======================================================== */}
      {previewPromo && (
        <Modal
          isOpen={!!previewPromo}
          onClose={() => setPreviewPromo(null)}
          title={`Ad Preview: ${previewPromo.title}`}
          maxWidth="700px"
        >
          <div>
            {previewPromo.placement === 'Home Middle' ? (
              <div
                style={{
                  display: 'flex',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                  marginBottom: 16,
                  background: '#ffffff',
                  minHeight: 220,
                }}
              >
                {/* Left Media: Full View with Ambient Blur & Drop Shadow */}
                <div
                  style={{
                    flex: 1,
                    position: 'relative',
                    background: '#0b1329',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12,
                    overflow: 'hidden',
                  }}
                >
                  {previewPromo.imageUrl && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: -10,
                        backgroundImage: `url(${previewPromo.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(20px) brightness(0.35)',
                        opacity: 0.7,
                        zIndex: 1,
                      }}
                    />
                  )}
                  {previewPromo.mediaType === 'video' || previewPromo.videoUrl ? (
                    <video
                      src={previewPromo.videoUrl}
                      poster={previewPromo.imageUrl || ''}
                      controls
                      autoPlay
                      loop
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        maxWidth: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        borderRadius: 8,
                        filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))',
                      }}
                    />
                  ) : previewPromo.imageUrl ? (
                    <img
                      src={previewPromo.imageUrl}
                      alt={previewPromo.title}
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        maxWidth: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        borderRadius: 8,
                        filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))',
                      }}
                    />
                  ) : null}
                </div>
                {/* Right Content */}
                <div
                  style={{
                    flex: 1.1,
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: '#ffffff',
                  }}
                >
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      background: 'rgba(37, 99, 235, 0.08)',
                      color: '#2563eb',
                      border: '1px solid rgba(37, 99, 235, 0.2)',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 14,
                      marginBottom: 8,
                    }}
                  >
                    📢 {previewPromo.category ? previewPromo.category.toUpperCase() : 'SPONSORED SPOTLIGHT'}
                  </span>
                  <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                    {previewPromo.title}
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                    {previewPromo.description || 'Exclusive discounts, verified quality, and exceptional deals available now.'}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                      ⭐ Top Rated
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                      ⚡ Exclusive Deal
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                      🛍️ Verified Merchant
                    </span>
                  </div>
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      padding: '6px 16px',
                      background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                      color: '#fff',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Explore Deal & Visit →
                  </span>
                </div>
              </div>
            ) : previewPromo.mediaType === 'video' || previewPromo.videoUrl ? (
              <video
                src={previewPromo.videoUrl}
                poster={previewPromo.imageUrl || ''}
                controls
                autoPlay
                loop
                style={{ width: '100%', maxHeight: 350, objectFit: 'contain', borderRadius: 10, marginBottom: 16 }}
              />
            ) : previewPromo.imageUrl ? (
              <img
                src={previewPromo.imageUrl}
                alt={previewPromo.title}
                style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 10, marginBottom: 16 }}
              />
            ) : null}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <span style={{ background: '#2563eb', color: '#fff', padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                {previewPromo.placement}
              </span>
              <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                {previewPromo.category}
              </span>
              <span style={{ background: previewPromo.status === 'active' ? '#dcfce7' : '#f1f5f9', color: previewPromo.status === 'active' ? '#16a34a' : '#64748b', padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                {previewPromo.status.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
              📍 Location: {previewPromo.location || 'Kerala'} | 📅 Valid: {previewPromo.startDate} to {previewPromo.endDate}
            </p>
            {previewPromo.targetUrl && (
              <a
                href={previewPromo.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <HiOutlineExternalLink size={16} /> Open Destination Link
              </a>
            )}
          </div>
        </Modal>
      )}

      {/* 8. PROMOTION IMAGE CROPPER MODAL */}
      <PromotionImageCropperModal
        isOpen={cropperState.isOpen}
        onClose={() => setCropperState((prev) => ({ ...prev, isOpen: false }))}
        imageSrc={cropperState.imageSrc}
        placement={cropperState.placement}
        onCropSave={(croppedFile) => {
          handleFileUpload(croppedFile, cropperState.isEdit);
        }}
      />
    </motion.div>
  );
}
