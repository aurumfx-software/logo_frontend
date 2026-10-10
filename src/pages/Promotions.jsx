import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineRefresh,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiOutlineUpload,
  HiOutlineX,
  HiOutlinePlay,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import CircularSpinner from '../components/UI/CircularSpinner';
import GoogleMapsLocationInput from '../components/UI/GoogleMapsLocationInput';
import { promotions as initialPromotions } from '../data/mockData';
import { promotionsApi } from '../api/operationsApi';
import { fetchCategoriesList } from '../api/categoryApi';
import { uploadPromotionMedia } from '../api/promotionApi';

const fallbackCategories = [
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

const initialFormState = {
  title: '',
  type: 'Featured',
  placement: 'Home Top',
  category: 'Solar & Electricals',
  location: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '2026-12-31',
  bannerUrl: '',
  videoUrl: '',
  mediaType: 'image', // 'image' | 'video'
};

const handleMediaFileUpload = async (e, type, formState, setFormState, setUploading = () => {}, openEditor = null, targetForm = 'create') => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  try {
    setUploading(true);
    const uploadedData = await uploadPromotionMedia(file);
    const mediaUrl = uploadedData.url || uploadedData.video_url || uploadedData.image_url;
    const mediaType = uploadedData.media_type || (file.type.startsWith('video/') ? 'video' : 'image');

    if (mediaType === 'video' || type === 'video') {
      setFormState({
        ...formState,
        videoUrl: mediaUrl,
        video_url: mediaUrl,
        mediaType: 'video',
        media_type: 'video',
        bannerUrl: formState.bannerUrl || uploadedData.image_url || uploadedData.thumbnail_url || '',
      });
    } else {
      setFormState({
        ...formState,
        bannerUrl: mediaUrl,
        image_url: mediaUrl,
        thumbnail_url: mediaUrl,
        mediaType: 'image',
        media_type: 'image',
      });
      if (openEditor) {
        openEditor(mediaUrl, targetForm);
      }
    }
  } catch (err) {
    console.warn('CDN upload failed, using local preview fallback:', err);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'image') {
        setFormState({ ...formState, bannerUrl: reader.result, image_url: reader.result, mediaType: 'image' });
        if (openEditor) {
          openEditor(reader.result, targetForm);
        }
      } else {
        setFormState({ ...formState, videoUrl: reader.result, video_url: reader.result, mediaType: 'video' });
      }
    };
    reader.readAsDataURL(file);
  } finally {
    setUploading(false);
  }
};

export default function Promotions() {
  const [promoList, setPromoList] = useState(initialPromotions);
  const [categoriesList, setCategoriesList] = useState(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPromo, setNewPromo] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // View modal state
  const [selectedPromo, setSelectedPromo] = useState(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Image Crop & Fit Editor state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [cropTargetForm, setCropTargetForm] = useState('create'); // 'create' | 'edit'
  const [cropScale, setCropScale] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropBrightness, setCropBrightness] = useState(100);
  const [cropContrast, setCropContrast] = useState(100);
  const [cropFitMode, setCropFitMode] = useState('cover'); // 'cover' | 'contain'
  const [cropAspectRatio, setCropAspectRatio] = useState('16:9'); // '16:9' | '3:1' | '1:1' | '4:3'

  const openImageEditor = (src, target = 'create') => {
    setCropImageSrc(src);
    setCropTargetForm(target);
    setCropScale(1);
    setCropRotation(0);
    setCropBrightness(100);
    setCropContrast(100);
    setCropFitMode('cover');
    setCropAspectRatio('16:9');
    setCropModalOpen(true);
  };

  const handleApplyCroppedImage = () => {
    if (!cropImageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = cropImageSrc;
    img.onload = () => {
      let targetWidth = 1200;
      let targetHeight = 675; // 16:9
      if (cropAspectRatio === '3:1') {
        targetHeight = 400;
      } else if (cropAspectRatio === '1:1') {
        targetHeight = 1200;
      } else if (cropAspectRatio === '4:3') {
        targetHeight = 900;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.save();
      ctx.filter = `brightness(${cropBrightness}%) contrast(${cropContrast}%)`;
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((cropRotation * Math.PI) / 180);
      ctx.scale(cropScale, cropScale);

      let drawW = img.width;
      let drawH = img.height;

      if (cropFitMode === 'cover') {
        const scaleW = targetWidth / img.width;
        const scaleH = targetHeight / img.height;
        const scale = Math.max(scaleW, scaleH);
        drawW = img.width * scale;
        drawH = img.height * scale;
      } else {
        const scaleW = targetWidth / img.width;
        const scaleH = targetHeight / img.height;
        const scale = Math.min(scaleW, scaleH);
        drawW = img.width * scale;
        drawH = img.height * scale;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

      if (cropTargetForm === 'create') {
        setNewPromo((prev) => ({
          ...prev,
          bannerUrl: croppedDataUrl,
          image_url: croppedDataUrl,
          mediaType: 'image',
        }));
      } else {
        setEditFormData((prev) => ({
          ...prev,
          bannerUrl: croppedDataUrl,
          image_url: croppedDataUrl,
          mediaType: 'image',
        }));
      }
      setCropModalOpen(false);
    };
  };

  const renderCardMedia = (promo) => {
    const cardMediaSrc =
      promo.bannerUrl ||
      promo.banner_url ||
      promo.image_url ||
      promo.image ||
      promo.media_url ||
      promo.mediaUrl ||
      promo.banner_image ||
      promo.url;
    const cardVideoSrc = promo.videoUrl || promo.video_url || promo.video;
    const isCardVideo =
      promo.mediaType === 'video' ||
      promo.media_type === 'video' ||
      (cardVideoSrc && cardVideoSrc.length > 0);

    if (isCardVideo && cardVideoSrc) {
      return (
        <div style={{ position: 'relative', height: 140, width: '100%', overflow: 'hidden', background: '#0F172A' }}>
          <video
            src={cardVideoSrc}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            muted
            loop
            onMouseOver={(e) => e.target.play().catch(() => {})}
            onMouseOut={(e) => e.target.pause()}
          />
          <span
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(0,0,0,0.75)',
              color: '#FFF',
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <HiOutlinePlay size={10} /> VIDEO
          </span>
        </div>
      );
    }

    if (cardMediaSrc) {
      return (
        <div style={{ position: 'relative', height: 140, width: '100%', overflow: 'hidden', background: '#0F172A' }}>
          <img
            src={cardMediaSrc}
            alt={promo.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      );
    }

    return (
      <div
        style={{
          height: 4,
          background:
            promo.status === 'active' || promo.status === 'approved'
              ? 'linear-gradient(90deg, #10B981, #059669)'
              : promo.status === 'pending'
              ? 'linear-gradient(90deg, #F59E0B, #D97706)'
              : '#E5E7EB',
        }}
      />
    );
  };

  const renderModalMedia = (promo) => {
    if (!promo) return null;
    const mediaSrc =
      promo.bannerUrl ||
      promo.banner_url ||
      promo.image_url ||
      promo.image ||
      promo.media_url ||
      promo.mediaUrl ||
      promo.banner_image ||
      promo.url;

    const videoSrc =
      promo.videoUrl ||
      promo.video_url ||
      promo.video;

    const isVideo =
      promo.mediaType === 'video' ||
      promo.media_type === 'video' ||
      (typeof videoSrc === 'string' && videoSrc.length > 0) ||
      (typeof mediaSrc === 'string' && (mediaSrc.endsWith('.mp4') || mediaSrc.endsWith('.webm') || mediaSrc.endsWith('.mov')));

    if (isVideo && videoSrc) {
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 16, maxHeight: 280, display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <video src={videoSrc} controls autoPlay style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }} />
        </div>
      );
    }

    if (mediaSrc) {
      return (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, maxHeight: 280, background: '#0F172A', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <img src={mediaSrc} alt={promo.title || 'Promotion Media'} style={{ width: '100%', maxHeight: 280, objectFit: promo.bannerFit || 'cover', display: 'block' }} />
        </div>
      );
    }

    return (
      <div style={{ borderRadius: 12, background: 'linear-gradient(135deg, #1E293B, #0F172A)', padding: '24px 16px', color: '#FFF', textAlign: 'center', marginBottom: 16 }}>
        <HiOutlinePhotograph style={{ fontSize: 36, color: '#94A3B8', marginBottom: 6 }} />
        <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>No image or video attached to this promotion</p>
      </div>
    );
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const apiData = await promotionsApi.list({ status: selectedCategory, search: searchQuery });
      if (Array.isArray(apiData) && apiData.length > 0) {
        const formatted = apiData.map((item, idx) => ({
          id: item.id || item._id || `p-live-${idx}`,
          title: item.title || item.name || 'Featured Promotion',
          type: item.type || 'Featured',
          category: item.category || 'General',
          placement: item.placement || `${item.type || 'Featured'} (${item.category || 'General'})`,
          location: item.location || 'Payyanur, Kerala',
          startDate: item.start_date || item.startDate || '2026-10-01',
          endDate: item.end_date || item.endDate || '2026-12-31',
          status: (item.status || 'ACTIVE').toLowerCase(),
          impressions: item.impressions || item.views || 0,
          clicks: item.clicks || 0,
          bannerUrl: item.banner_url || item.image_url || item.image || item.bannerUrl || item.media_url || item.mediaUrl || item.banner_image || item.url || '',
          videoUrl: item.video_url || item.videoUrl || item.video || (typeof item.media_url === 'string' && item.media_url.endsWith('.mp4') ? item.media_url : '') || '',
          mediaType: item.media_type || item.mediaType || (item.video_url || item.video ? 'video' : 'image'),
        }));
        setPromoList(formatted);
      } else {
        setPromoList(initialPromotions);
      }
    } catch (err) {
      console.warn('Backend promotions API notice, using local promotions:', err);
      setPromoList(initialPromotions);
    } finally {
      setLoading(false);
    }

    try {
      const apiCategories = await fetchCategoriesList();
      if (Array.isArray(apiCategories) && apiCategories.length > 0) {
        const catNames = apiCategories.map((c) => c.name || c.category_name).filter(Boolean);
        if (catNames.length > 0) {
          setCategoriesList(catNames);
        }
      }
    } catch (catErr) {
      console.warn('Backend categories API notice in Promotions:', catErr);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered promotions
  const filteredPromos = promoList.filter((p) => {
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesType =
      selectedType === 'All' || (p.type || '').toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesCategory && matchesType;
  });

  // Create Promotion Handler
  const handleCreatePromo = async (e) => {
    if (e) e.preventDefault();
    setAddError('');

    if (!newPromo.title.trim()) {
      setAddError('Please enter a promotion title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: newPromo.title.trim(),
        type: newPromo.type,
        category: newPromo.category,
        placement: `${newPromo.placement} (${newPromo.category})`,
        location: newPromo.location || 'Payyanur, Kerala',
        start_date: newPromo.startDate || '2026-10-01',
        end_date: newPromo.endDate || '2026-12-31',
        status: 'ACTIVE',
        banner_url: newPromo.bannerUrl || '',
        video_url: newPromo.videoUrl || '',
        media_type: newPromo.mediaType || 'image',
      };
      const createdItem = await promotionsApi.create(payload);

      const formattedCreated = {
        id: createdItem.id || `p-${Date.now()}`,
        title: createdItem.title || newPromo.title,
        type: createdItem.type || newPromo.type,
        category: createdItem.category || newPromo.category,
        placement: `${newPromo.placement} (${newPromo.category})`,
        location: newPromo.location || 'Payyanur, Kerala',
        startDate: newPromo.startDate || '2026-10-01',
        endDate: newPromo.endDate || '2026-12-31',
        status: 'active',
        impressions: 0,
        clicks: 0,
        bannerUrl: newPromo.bannerUrl || '',
        videoUrl: newPromo.videoUrl || '',
        mediaType: newPromo.mediaType || 'image',
      };

      setPromoList([formattedCreated, ...promoList]);
      setShowAddModal(false);
      setNewPromo(initialFormState);
    } catch (err) {
      console.warn('Backend create promotion error:', err);
      // Fallback local addition
      const fallbackCreated = {
        id: `p-${Date.now()}`,
        title: newPromo.title,
        type: newPromo.type,
        category: newPromo.category,
        placement: `${newPromo.placement} (${newPromo.category})`,
        location: newPromo.location || 'Payyanur, Kerala',
        startDate: newPromo.startDate || '2026-10-01',
        endDate: newPromo.endDate || '2026-12-31',
        status: 'active',
        impressions: 0,
        clicks: 0,
        bannerUrl: newPromo.bannerUrl || '',
        videoUrl: newPromo.videoUrl || '',
        mediaType: newPromo.mediaType || 'image',
      };
      setPromoList([fallbackCreated, ...promoList]);
      setShowAddModal(false);
      setNewPromo(initialFormState);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (promo) => {
    setEditFormData({
      ...promo,
      bannerUrl: promo.bannerUrl || promo.banner_url || '',
      videoUrl: promo.videoUrl || promo.video_url || '',
      mediaType: promo.mediaType || promo.media_type || (promo.videoUrl || promo.video_url ? 'video' : 'image'),
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  // Submit Edit Promotion Handler
  const handleEditSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!editFormData || !editFormData.title.trim()) return;

    setIsUpdating(true);
    setEditError('');
    try {
      const payload = {
        title: editFormData.title.trim(),
        category: editFormData.category,
        type: editFormData.type,
        placement: editFormData.placement,
        location: editFormData.location,
        start_date: editFormData.startDate || editFormData.start_date,
        end_date: editFormData.endDate || editFormData.end_date,
        status: editFormData.status ? editFormData.status.toUpperCase() : 'ACTIVE',
        banner_url: editFormData.bannerUrl || '',
        video_url: editFormData.videoUrl || '',
        media_type: editFormData.mediaType || 'image',
      };
      await promotionsApi.update(editFormData.id, payload);
      setPromoList((prev) =>
        prev.map((p) => (p.id === editFormData.id ? { ...p, ...editFormData } : p))
      );
      setIsEditModalOpen(false);
    } catch (err) {
      console.warn('Update promo API notice, updating state:', err);
      setPromoList((prev) =>
        prev.map((p) => (p.id === editFormData.id ? { ...p, ...editFormData } : p))
      );
      setIsEditModalOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Promotion Handler
  const handleDeletePromo = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete promotion "${title}"?`)) {
      return;
    }
    try {
      await promotionsApi.delete(id);
      setPromoList((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setPromoList((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Promotions"
        subtitle="Manage banners, advertisements & featured business listings"
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={loadData} title="Refresh live data">
            <HiOutlineRefresh /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setAddError('');
              setNewPromo(initialFormState);
              setShowAddModal(true);
            }}
          >
            <HiOutlinePlus /> New Promotion
          </button>
        </div>
      </PageHeader>

      {/* Filter & Search Bar */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ position: 'relative', minWidth: 260, flex: 1 }}>
          <HiOutlineSearch
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
              fontSize: 18,
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 42, margin: 0, width: '100%' }}
            placeholder="Search promotion title, category, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Category:</span>
          <select
            className="form-select"
            style={{ margin: 0, width: 'auto', minWidth: 160 }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categoriesList.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', marginLeft: 4 }}>Type:</span>
          <select
            className="form-select"
            style={{ margin: 0, width: 'auto', minWidth: 160 }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Featured">Featured Ad</option>
            <option value="Sponsored">Sponsored Listing</option>
            <option value="Banner">Banner Carousel</option>
            <option value="Text Carousel">Text Carousel</option>
            <option value="Footer Ads">Footer Ads</option>
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
          <span>Loading live promotions from API...</span>
        </div>
      )}

      {/* Grid of Promotions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {filteredPromos.map((promo, idx) => (
          <motion.div
            key={promo.id}
            className="card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Media Header (Image or Video preview) */}
            {renderCardMedia(promo)}
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <StatusBadge status={promo.status} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#6C63FF',
                    background: '#F0EFFF',
                    padding: '4px 10px',
                    borderRadius: 20,
                  }}
                >
                  {promo.type}
                </span>
              </div>

              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#1F2937' }}>
                {promo.title}
              </h3>
              <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
                {promo.placement}
              </p>

              <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlineCalendar style={{ color: '#6C63FF' }} />
                  <span>
                    {promo.startDate} → {promo.endDate}
                  </span>
                </div>
                {promo.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HiOutlineLocationMarker style={{ color: '#EF4444' }} />
                    <span>{promo.location}</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  padding: '12px 0',
                  borderTop: '1px solid #F3F4F6',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Impressions</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#1F2937' }}>
                    {(promo.impressions || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Clicks</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#6C63FF' }}>
                    {(promo.clicks || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  paddingTop: 14,
                  borderTop: '1px solid #F3F4F6',
                }}
              >
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedPromo(promo)}
                >
                  <HiOutlineEye /> View
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleOpenEdit(promo)}
                >
                  <HiOutlinePencil /> Edit
                </button>
                <button
                  className="btn btn-outline btn-sm btn-icon"
                  style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                  onClick={() => handleDeletePromo(promo.id, promo.title)}
                  title="Delete Promotion"
                >
                  <HiOutlineTrash />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Promotion Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Promotion"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreatePromo}
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {isSubmitting ? (
                <>
                  <CircularSpinner size={16} color="#FFFFFF" />
                  <span>Saving Promotion...</span>
                </>
              ) : (
                'Create Promotion'
              )}
            </button>
          </>
        }
      >
        {addError && (
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
            }}
          >
            ⚠️ {addError}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Promotion Title *</label>
          <input
            className="form-input"
            placeholder="e.g., Festival Offer - Up to 65% OFF"
            value={newPromo.title}
            onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
            required
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Ad Category *</label>
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
          <div className="form-group">
            <label className="form-label">Promotion Type</label>
            <select
              className="form-select"
              value={newPromo.type}
              onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}
            >
              <option value="Featured">Featured Ad</option>
              <option value="Sponsored">Sponsored Listing</option>
              <option value="Banner">Banner Carousel</option>
              <option value="Text Carousel">Text Carousel</option>
              <option value="Footer Ads">Footer Ads</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Location Search (Google Maps Autocomplete) *</label>
          <GoogleMapsLocationInput
            value={newPromo.location}
            onChange={(loc) => setNewPromo({ ...newPromo, location: loc })}
            placeholder="Search Google Maps for target location (e.g. Payyanur, Kannur, Kochi)..."
          />
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

        {/* Media Attachment (Photo or Video) */}
        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label" style={{ fontWeight: 600 }}>Media Attachment (Photo or Video)</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button
              type="button"
              className={`btn ${newPromo.mediaType === 'image' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
              onClick={() => setNewPromo({ ...newPromo, mediaType: 'image' })}
            >
              <HiOutlinePhotograph style={{ fontSize: 18 }} />
              <span>Photo / Image</span>
            </button>
            <button
              type="button"
              className={`btn ${newPromo.mediaType === 'video' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
              onClick={() => setNewPromo({ ...newPromo, mediaType: 'video' })}
            >
              <HiOutlineVideoCamera style={{ fontSize: 18 }} />
              <span>Video</span>
            </button>
          </div>

          {newPromo.mediaType === 'image' ? (
            <div>
              {newPromo.bannerUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #CBD5E1', background: '#0F172A', maxHeight: 220, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img
                      src={newPromo.bannerUrl}
                      alt="Promotion Banner"
                      style={{ width: '100%', height: 200, objectFit: newPromo.bannerFit || 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 10 }}>
                      <button
                        type="button"
                        onClick={() => openImageEditor(newPromo.bannerUrl, 'create')}
                        style={{ background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                        title="Edit & Crop Image"
                      >
                        ✏️ Edit & Crop (Screen Fit)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPromo({ ...newPromo, bannerUrl: '' })}
                        style={{ background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                        title="Remove Photo"
                      >
                        <HiOutlineX size={16} />
                      </button>
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 6, fontSize: 11, color: '#38BDF8', fontWeight: 700 }}>
                      ✓ Screen Size Fit (16:9 Aspect Ratio)
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Display Fit Style:</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setNewPromo({ ...newPromo, bannerFit: 'cover' })}
                        style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid', borderColor: (!newPromo.bannerFit || newPromo.bannerFit === 'cover') ? '#3B82F6' : '#CBD5E1', background: (!newPromo.bannerFit || newPromo.bannerFit === 'cover') ? '#EFF6FF' : '#FFF', color: (!newPromo.bannerFit || newPromo.bannerFit === 'cover') ? '#1D4ED8' : '#64748B', cursor: 'pointer' }}
                      >
                        Cover (Full Screen Stretch)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPromo({ ...newPromo, bannerFit: 'contain' })}
                        style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid', borderColor: newPromo.bannerFit === 'contain' ? '#3B82F6' : '#CBD5E1', background: newPromo.bannerFit === 'contain' ? '#EFF6FF' : '#FFF', color: newPromo.bannerFit === 'contain' ? '#1D4ED8' : '#64748B', cursor: 'pointer' }}
                      >
                        Contain (Original Ratio)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <HiOutlineUpload style={{ fontSize: 28, color: '#6C63FF' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Click to Upload Photo</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>PNG, JPG, WEBP, GIF up to 10MB</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleMediaFileUpload(e, 'image', newPromo, setNewPromo, () => {}, openImageEditor, 'create')} />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div>
              {newPromo.videoUrl ? (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB', background: '#000', maxHeight: 220, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <video src={newPromo.videoUrl} controls style={{ width: '100%', maxHeight: 220, objectFit: 'contain' }} />
                  <button
                    type="button"
                    onClick={() => setNewPromo({ ...newPromo, videoUrl: '' })}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', zIndex: 10 }}
                    title="Remove Video"
                  >
                    <HiOutlineX size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <HiOutlineVideoCamera style={{ fontSize: 28, color: '#6C63FF' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Click to Upload Video</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>MP4, WEBM, MOV up to 50MB</span>
                    <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => handleMediaFileUpload(e, 'video', newPromo, setNewPromo)} />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* View Promotion Details Modal */}
      <Modal
        isOpen={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        title="Promotion Details"
        size="md"
      >
        {selectedPromo && (
          <div>
            {renderModalMedia(selectedPromo)}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <StatusBadge status={selectedPromo.status} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6C63FF', background: '#F0EFFF', padding: '4px 12px', borderRadius: 20 }}>
                {selectedPromo.type}
              </span>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#1F2937' }}>
              {selectedPromo.title}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '16px 0', background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div>
                <label className="form-label" style={{ color: '#6B7280' }}>Category</label>
                <p style={{ fontWeight: 600, margin: 0 }}>{selectedPromo.category}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: '#6B7280' }}>Placement</label>
                <p style={{ fontWeight: 600, margin: 0 }}>{selectedPromo.placement}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: '#6B7280' }}>Start Date</label>
                <p style={{ margin: 0 }}>{selectedPromo.startDate}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: '#6B7280' }}>End Date</label>
                <p style={{ margin: 0 }}>{selectedPromo.endDate}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: '#6B7280' }}>Total Impressions</label>
                <p style={{ fontWeight: 700, margin: 0, color: '#1F2937' }}>{(selectedPromo.impressions || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: '#6B7280' }}>Total Clicks</label>
                <p style={{ fontWeight: 700, margin: 0, color: '#6C63FF' }}>{(selectedPromo.clicks || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Promotion Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Promotion"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEditSubmit}
              disabled={isUpdating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {isUpdating ? (
                <>
                  <CircularSpinner size={16} color="#FFFFFF" />
                  <span>Updating...</span>
                </>
              ) : (
                'Update Promotion'
              )}
            </button>
          </>
        }
      >
        {editFormData && (
          <form onSubmit={handleEditSubmit}>
            {editError && (
              <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#991B1B', marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
                ⚠️ {editError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Promotion Title *</label>
              <input
                className="form-input"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Ad Category *</label>
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
              <div className="form-group">
                <label className="form-label">Promotion Type</label>
                <select
                  className="form-select"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                >
                  <option value="Featured">Featured Ad</option>
                  <option value="Sponsored">Sponsored Listing</option>
                  <option value="Banner">Banner Carousel</option>
                  <option value="Text Carousel">Text Carousel</option>
                  <option value="Footer Ads">Footer Ads</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location Search (Google Maps Autocomplete)</label>
              <GoogleMapsLocationInput
                value={editFormData.location || ''}
                onChange={(loc) => setEditFormData({ ...editFormData, location: loc })}
                placeholder="Target location..."
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editFormData.startDate || editFormData.start_date || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value, start_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editFormData.endDate || editFormData.end_date || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value, end_date: e.target.value })}
                />
              </div>
            </div>

            {/* Media Attachment (Photo or Video) */}
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Media Attachment (Photo or Video)</label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <button
                  type="button"
                  className={`btn ${editFormData.mediaType === 'image' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
                  onClick={() => setEditFormData({ ...editFormData, mediaType: 'image' })}
                >
                  <HiOutlinePhotograph style={{ fontSize: 18 }} />
                  <span>Photo / Image</span>
                </button>
                <button
                  type="button"
                  className={`btn ${editFormData.mediaType === 'video' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
                  onClick={() => setEditFormData({ ...editFormData, mediaType: 'video' })}
                >
                  <HiOutlineVideoCamera style={{ fontSize: 18 }} />
                  <span>Video</span>
                </button>
              </div>

              {editFormData.mediaType === 'image' ? (
                <div>
                  {editFormData.bannerUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #CBD5E1', background: '#0F172A', maxHeight: 220, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img
                          src={editFormData.bannerUrl}
                          alt="Promotion Banner"
                          style={{ width: '100%', height: 200, objectFit: editFormData.bannerFit || 'cover' }}
                        />
                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 10 }}>
                          <button
                            type="button"
                            onClick={() => openImageEditor(editFormData.bannerUrl, 'edit')}
                            style={{ background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                            title="Edit & Crop Image"
                          >
                            ✏️ Edit & Crop (Screen Fit)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditFormData({ ...editFormData, bannerUrl: '' })}
                            style={{ background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
                            title="Remove Photo"
                          >
                            <HiOutlineX size={16} />
                          </button>
                        </div>
                        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 6, fontSize: 11, color: '#38BDF8', fontWeight: 700 }}>
                          ✓ Screen Size Fit (16:9 Aspect Ratio)
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Display Fit Style:</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setEditFormData({ ...editFormData, bannerFit: 'cover' })}
                            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid', borderColor: (!editFormData.bannerFit || editFormData.bannerFit === 'cover') ? '#3B82F6' : '#CBD5E1', background: (!editFormData.bannerFit || editFormData.bannerFit === 'cover') ? '#EFF6FF' : '#FFF', color: (!editFormData.bannerFit || editFormData.bannerFit === 'cover') ? '#1D4ED8' : '#64748B', cursor: 'pointer' }}
                          >
                            Cover (Full Screen Stretch)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditFormData({ ...editFormData, bannerFit: 'contain' })}
                            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid', borderColor: editFormData.bannerFit === 'contain' ? '#3B82F6' : '#CBD5E1', background: editFormData.bannerFit === 'contain' ? '#EFF6FF' : '#FFF', color: editFormData.bannerFit === 'contain' ? '#1D4ED8' : '#64748B', cursor: 'pointer' }}
                          >
                            Contain (Original Ratio)
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <HiOutlineUpload style={{ fontSize: 28, color: '#6C63FF' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Click to Upload Photo</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>PNG, JPG, WEBP, GIF up to 10MB</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleMediaFileUpload(e, 'image', editFormData, setEditFormData, () => {}, openImageEditor, 'edit')} />
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {editFormData.videoUrl ? (
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB', background: '#000', maxHeight: 220, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <video src={editFormData.videoUrl} controls style={{ width: '100%', maxHeight: 220, objectFit: 'contain' }} />
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, videoUrl: '' })}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', zIndex: 10 }}
                        title="Remove Video"
                      >
                        <HiOutlineX size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <HiOutlineVideoCamera style={{ fontSize: 28, color: '#6C63FF' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Click to Upload Video</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>MP4, WEBM, MOV up to 50MB</span>
                        <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => handleMediaFileUpload(e, 'video', editFormData, setEditFormData)} />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* Interactive Image Crop & Fit Modal */}
      <Modal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        title="Crop & Fit Image for Screen Banner"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, color: '#475569' }}>
            ℹ️ Adjust zoom, rotation, aspect ratio, and positioning so the image fits full width on all screen sizes.
          </div>

          {/* Interactive Preview Viewport */}
          <div style={{ position: 'relative', width: '100%', height: 240, background: '#0F172A', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3B82F6' }}>
            {cropImageSrc && (
              <img
                src={cropImageSrc}
                alt="Cropper Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: `scale(${cropScale}) rotate(${cropRotation}deg)`,
                  filter: `brightness(${cropBrightness}%) contrast(${cropContrast}%)`,
                  transition: 'transform 0.2s ease, filter 0.2s ease',
                  objectFit: cropFitMode,
                  width: cropFitMode === 'cover' ? '100%' : 'auto',
                  height: cropFitMode === 'cover' ? '100%' : 'auto',
                }}
              />
            )}
            <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.75)', color: '#38BDF8', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
              Target Fit: {cropAspectRatio} Banner
            </div>
          </div>

          {/* Aspect Ratio Presets */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', background: '#F1F5F9', padding: 10, borderRadius: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Aspect Ratio:</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: '16:9 Screen Fit', value: '16:9' },
                { label: '3:1 Header', value: '3:1' },
                { label: '4:3 Card', value: '4:3' },
                { label: '1:1 Square', value: '1:1' },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setCropAspectRatio(preset.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    border: cropAspectRatio === preset.value ? '2px solid #3B82F6' : '1px solid #CBD5E1',
                    background: cropAspectRatio === preset.value ? '#3B82F6' : '#FFF',
                    color: cropAspectRatio === preset.value ? '#FFF' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Zoom & Fit Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                <span>Zoom Scale</span>
                <span>{cropScale.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="1"
                max="3.5"
                step="0.1"
                value={cropScale}
                onChange={(e) => setCropScale(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#3B82F6' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Fit Mode
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setCropFitMode('cover')}
                  style={{ flex: 1, padding: '6px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: cropFitMode === 'cover' ? '2px solid #3B82F6' : '1px solid #CBD5E1', background: cropFitMode === 'cover' ? '#EFF6FF' : '#FFF', color: cropFitMode === 'cover' ? '#1D4ED8' : '#64748B', cursor: 'pointer' }}
                >
                  Cover (Screen Stretch)
                </button>
                <button
                  type="button"
                  onClick={() => setCropFitMode('contain')}
                  style={{ flex: 1, padding: '6px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: cropFitMode === 'contain' ? '2px solid #3B82F6' : '1px solid #CBD5E1', background: cropFitMode === 'contain' ? '#EFF6FF' : '#FFF', color: cropFitMode === 'contain' ? '#1D4ED8' : '#64748B', cursor: 'pointer' }}
                >
                  Contain (Whole Image)
                </button>
              </div>
            </div>
          </div>

          {/* Tone Adjustments: Brightness & Contrast */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: '#F8FAFC', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                <span>☀️ Brightness</span>
                <span>{cropBrightness}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={cropBrightness}
                onChange={(e) => setCropBrightness(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                <span>🌓 Contrast</span>
                <span>{cropContrast}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={cropContrast}
                onChange={(e) => setCropContrast(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#8B5CF6' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => setCropRotation((prev) => (prev + 90) % 360)}
              style={{ padding: '8px 14px', background: '#E2E8F0', color: '#1E293B', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              🔄 Rotate 90° ({cropRotation}°)
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCropModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApplyCroppedImage}
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', fontWeight: 700 }}
              >
                ✓ Apply & Save Fitted Image
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
