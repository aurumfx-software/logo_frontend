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

const handleMediaFileUpload = (e, type, formState, setFormState) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    if (type === 'image') {
      setFormState({ ...formState, bannerUrl: reader.result, mediaType: 'image' });
    } else {
      setFormState({ ...formState, videoUrl: reader.result, mediaType: 'video' });
    }
  };
  reader.readAsDataURL(file);
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
          bannerUrl: item.banner_url || item.image || item.bannerUrl || '',
          videoUrl: item.video_url || item.video || item.videoUrl || '',
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
            {(promo.bannerUrl || promo.videoUrl) ? (
              <div style={{ position: 'relative', height: 140, width: '100%', overflow: 'hidden', background: '#0F172A' }}>
                {promo.mediaType === 'video' || promo.videoUrl ? (
                  <video
                    src={promo.videoUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    muted
                    loop
                    onMouseOver={(e) => e.target.play().catch(() => {})}
                    onMouseOut={(e) => e.target.pause()}
                  />
                ) : (
                  <img
                    src={promo.bannerUrl}
                    alt={promo.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                {(promo.mediaType === 'video' || promo.videoUrl) && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      background: 'rgba(0,0,0,0.75)',
                      color: '#FFF',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <HiOutlinePlay size={12} /> VIDEO
                  </span>
                )}
              </div>
            ) : (
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
            )}
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
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB', background: '#F9FAFB', maxHeight: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img src={newPromo.bannerUrl} alt="Promotion Banner" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => setNewPromo({ ...newPromo, bannerUrl: '' })}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                    title="Remove Photo"
                  >
                    <HiOutlineX size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <HiOutlineUpload style={{ fontSize: 28, color: '#6C63FF' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Click to Upload Photo</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>PNG, JPG, WEBP, GIF up to 10MB</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleMediaFileUpload(e, 'image', newPromo, setNewPromo)} />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>OR Image URL:</span>
                    <input type="url" className="form-input" style={{ margin: 0, fontSize: 12 }} placeholder="https://example.com/banner-image.jpg" value={newPromo.bannerUrl || ''} onChange={(e) => setNewPromo({ ...newPromo, bannerUrl: e.target.value })} />
                  </div>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>OR Video URL:</span>
                    <input type="url" className="form-input" style={{ margin: 0, fontSize: 12 }} placeholder="https://example.com/promo-video.mp4" value={newPromo.videoUrl || ''} onChange={(e) => setNewPromo({ ...newPromo, videoUrl: e.target.value })} />
                  </div>
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
            {(selectedPromo.videoUrl || selectedPromo.mediaType === 'video') ? (
              <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', marginBottom: 16, maxHeight: 260, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <video src={selectedPromo.videoUrl} controls autoPlay style={{ width: '100%', maxHeight: 260, objectFit: 'contain' }} />
              </div>
            ) : selectedPromo.bannerUrl ? (
              <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 16, maxHeight: 240 }}>
                <img src={selectedPromo.bannerUrl} alt={selectedPromo.title} style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }} />
              </div>
            ) : null}

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
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB', background: '#F9FAFB', maxHeight: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <img src={editFormData.bannerUrl} alt="Promotion Banner" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, bannerUrl: '' })}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                        title="Remove Photo"
                      >
                        <HiOutlineX size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ border: '2px dashed #CBD5E1', borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <HiOutlineUpload style={{ fontSize: 28, color: '#6C63FF' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Click to Upload Photo</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>PNG, JPG, WEBP, GIF up to 10MB</span>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleMediaFileUpload(e, 'image', editFormData, setEditFormData)} />
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>OR Image URL:</span>
                        <input type="url" className="form-input" style={{ margin: 0, fontSize: 12 }} placeholder="https://example.com/banner-image.jpg" value={editFormData.bannerUrl || ''} onChange={(e) => setEditFormData({ ...editFormData, bannerUrl: e.target.value })} />
                      </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>OR Video URL:</span>
                        <input type="url" className="form-input" style={{ margin: 0, fontSize: 12 }} placeholder="https://example.com/promo-video.mp4" value={editFormData.videoUrl || ''} onChange={(e) => setEditFormData({ ...editFormData, videoUrl: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        )}
      </Modal>
    </motion.div>
  );
}
