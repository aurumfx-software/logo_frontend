import React, { useState, useEffect, useRef } from 'react';
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
  HiOutlineExternalLink,
  HiOutlineCheck,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import CircularSpinner from '../components/UI/CircularSpinner';
import GoogleMapsLocationInput from '../components/UI/GoogleMapsLocationInput';
import { promotions as initialPromotions } from '../data/mockData';
import { promotionsApi } from '../api/operationsApi';
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

const initialFormState = {
  title: '',
  type: 'Banner',
  placement: 'Home Top',
  category: 'Retail & Shopping',
  location: 'Kerala',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '2027-12-31',
  imageUrl: '',
  targetUrl: '',
  status: 'active',
};

export default function Promotions() {
  const [promoList, setPromoList] = useState(initialPromotions);
  const [categoriesList, setCategoriesList] = useState(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlacement, setSelectedPlacement] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPromo, setNewPromo] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // View modal state
  const [selectedPromo, setSelectedPromo] = useState(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');
  const [editUploadingImage, setEditUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const apiData = await promotionsApi.list({ status: selectedCategory, search: searchQuery });
      if (Array.isArray(apiData) && apiData.length > 0) {
        const formatted = apiData.map((item, idx) => ({
          id: item.id || item._id || `p-live-${idx}`,
          title: item.title || item.name || 'Featured Promotion',
          type: item.type || 'Banner',
          category: item.category || 'General',
          placement: item.placement || 'Home Top',
          location: item.location || 'Kerala',
          startDate: item.start_date || item.startDate || '2026-10-01',
          endDate: item.end_date || item.endDate || '2027-12-31',
          status: (item.status || 'ACTIVE').toLowerCase(),
          impressions: item.impressions || item.views || 0,
          clicks: item.clicks || 0,
          imageUrl: item.image_url || item.banner_url || item.bannerUrl || item.image || '',
          targetUrl: item.target_url || item.targetUrl || '#',
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
          setCategoriesList(Array.from(new Set([...fallbackCategories, ...catNames])));
        }
      }
    } catch (catErr) {
      console.warn('Backend categories API notice in Promotions:', catErr);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Upload handler for DigitalOcean Spaces CDN
  const handleFileUpload = async (file, isEdit = false) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('photos', file);

    try {
      if (isEdit) setEditUploadingImage(true);
      else setUploadingImage(true);

      const res = await uploadMerchantMedia(formData);
      const uploadedUrl = (res.photos && res.photos[0]) || (res.all_urls && res.all_urls[0]) || '';
      if (uploadedUrl) {
        if (isEdit) {
          setEditFormData((prev) => ({ ...prev, imageUrl: uploadedUrl }));
        } else {
          setNewPromo((prev) => ({ ...prev, imageUrl: uploadedUrl }));
        }
      } else {
        throw new Error('No image URL returned from upload server');
      }
    } catch (uploadErr) {
      console.error('Promotion image upload failed:', uploadErr);
      const errMsg = uploadErr.message || 'Image upload failed. Please try a valid JPG, PNG, or GIF.';
      if (isEdit) setEditError(errMsg);
      else setAddError(errMsg);
    } finally {
      if (isEdit) setEditUploadingImage(false);
      else setUploadingImage(false);
    }
  };

  // Filtered promotions
  const filteredPromos = promoList.filter((p) => {
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.placement || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesPlacement =
      selectedPlacement === 'All' ||
      (p.placement && p.placement.toLowerCase().includes(selectedPlacement.toLowerCase()));
    const matchesType =
      selectedType === 'All' || (p.type || '').toLowerCase() === selectedType.toLowerCase();
    return matchesSearch && matchesCategory && matchesPlacement && matchesType;
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
        placement: newPromo.placement,
        location: newPromo.location || 'Kerala',
        start_date: newPromo.startDate || '2026-10-01',
        end_date: newPromo.endDate || '2027-12-31',
        status: (newPromo.status || 'ACTIVE').toLowerCase(),
        image_url: newPromo.imageUrl || null,
        target_url: newPromo.targetUrl || '#',
      };
      const createdItem = await promotionsApi.create(payload);

      const formattedCreated = {
        id: createdItem.id || `p-${Date.now()}`,
        title: createdItem.title || newPromo.title,
        type: createdItem.type || newPromo.type,
        category: createdItem.category || newPromo.category,
        placement: createdItem.placement || newPromo.placement,
        location: createdItem.location || newPromo.location,
        startDate: createdItem.start_date || newPromo.startDate,
        endDate: createdItem.end_date || newPromo.endDate,
        status: (createdItem.status || 'active').toLowerCase(),
        impressions: createdItem.impressions || 0,
        clicks: createdItem.clicks || 0,
        imageUrl: createdItem.image_url || newPromo.imageUrl || '',
        targetUrl: createdItem.target_url || newPromo.targetUrl || '#',
      };

      setPromoList([formattedCreated, ...promoList]);
      setShowAddModal(false);
      setNewPromo(initialFormState);
    } catch (err) {
      console.warn('Backend create promotion error:', err);
      setAddError(err.message || 'Failed to create promotion');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (promo) => {
    setEditFormData({
      ...promo,
      imageUrl: promo.imageUrl || '',
      targetUrl: promo.targetUrl || '',
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
        status: (editFormData.status || 'active').toLowerCase(),
        image_url: editFormData.imageUrl !== undefined ? editFormData.imageUrl : null,
        target_url: editFormData.targetUrl || '#',
      };
      await promotionsApi.update(editFormData.id, payload);
      setPromoList((prev) =>
        prev.map((p) => (p.id === editFormData.id ? { ...p, ...editFormData } : p))
      );
      setIsEditModalOpen(false);
    } catch (err) {
      console.warn('Update promo API error:', err);
      setEditError(err.message || 'Failed to update promotion');
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
        title="Promotions & Banner Ads"
        subtitle="Manage landing page banner sliders, featured promotions & clickable ads (saved directly to PostgreSQL)"
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
            <HiOutlinePlus /> New Banner / Ad
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
            placeholder="Search banner title, placement, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Placement:</span>
          <select
            className="form-select"
            style={{ margin: 0, width: 'auto', minWidth: 150 }}
            value={selectedPlacement}
            onChange={(e) => setSelectedPlacement(e.target.value)}
          >
            <option value="All">All Placements</option>
            <option value="Home Top">Home Top (Slider)</option>
            <option value="Featured">Featured Offers</option>
            <option value="Category">Category Header</option>
          </select>

          <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Type:</span>
          <select
            className="form-select"
            style={{ margin: 0, width: 'auto', minWidth: 140 }}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Banner">Banner</option>
            <option value="Featured">Featured Ad</option>
            <option value="Sponsored">Sponsored Listing</option>
            <option value="Text Carousel">Text Carousel</option>
            <option value="Footer Ads">Footer Ads</option>
          </select>

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
          <span>Loading live promotions from PostgreSQL database...</span>
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
            transition={{ delay: idx * 0.03 }}
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {/* Banner Preview Thumbnail */}
            {promo.imageUrl ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 150,
                  backgroundColor: '#0f172a',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={promo.imageUrl}
                  alt={promo.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transition: 'transform 0.3s ease',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.style.background = 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)';
                  }}
                />
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <StatusBadge status={promo.status} />
                </div>
                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#ffffff',
                      background: 'rgba(37, 99, 235, 0.9)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {promo.placement}
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 100,
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  padding: 16,
                }}
              >
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <StatusBadge status={promo.status} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <HiOutlinePhotograph style={{ fontSize: 28, opacity: 0.8 }} />
                  <div style={{ fontSize: 11, opacity: 0.9, marginTop: 4 }}>No Banner Image Uploaded</div>
                </div>
              </div>
            )}

            <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#2563eb',
                    background: '#eff6ff',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}
                >
                  {promo.type}
                </span>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
                  {promo.category}
                </span>
              </div>

              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: '#111827', lineHeight: 1.3 }}>
                {promo.title}
              </h3>

              {promo.targetUrl && promo.targetUrl !== '#' && (
                <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HiOutlineExternalLink />
                  <a
                    href={promo.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'none', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {promo.targetUrl}
                  </a>
                </div>
              )}

              <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlineCalendar style={{ color: '#2563eb' }} />
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
                  display: 'flex',
                  gap: 8,
                  paddingTop: 12,
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
        title="Create New Banner Ad / Promotion"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreatePromo}
              disabled={isSubmitting || uploadingImage}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {isSubmitting ? (
                <>
                  <CircularSpinner size={16} color="#FFFFFF" />
                  <span>Saving to PostgreSQL...</span>
                </>
              ) : (
                'Save to Database'
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
          <label className="form-label">Banner / Ad Title *</label>
          <input
            className="form-input"
            placeholder="e.g., BAG BAZAAR Special Festival Mega Offer"
            value={newPromo.title}
            onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
            required
          />
        </div>

        {/* Banner Image Upload & CDN Section */}
        <div className="form-group" style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <HiOutlinePhotograph size={18} color="#2563eb" /> Banner Image (Upload to CDN or Paste URL)
          </label>

          {/* Upload Button */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {uploadingImage ? (
                <>
                  <CircularSpinner size={14} color="#2563eb" /> Uploading to CDN...
                </>
              ) : (
                <>
                  <HiOutlinePhotograph /> Choose Image File to Upload
                </>
              )}
            </button>
            <span style={{ fontSize: 12, color: '#64748b' }}>Uploads directly to DigitalOcean Spaces CDN</span>
          </div>

          {/* URL Input */}
          <input
            className="form-input"
            placeholder="Or enter image URL: https://aurumfx-images.sgp1.digitaloceanspaces.com/..."
            value={newPromo.imageUrl}
            onChange={(e) => setNewPromo({ ...newPromo, imageUrl: e.target.value })}
          />

          {/* Live Preview */}
          {newPromo.imageUrl && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                ✓ Image Live Preview:
              </div>
              <div style={{ width: '100%', height: 140, borderRadius: 8, overflow: 'hidden', background: '#0f172a', border: '1px solid #cbd5e1' }}>
                <img
                  src={newPromo.imageUrl}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Target URL */}
        <div className="form-group">
          <label className="form-label">Destination / Target URL (When user clicks banner)</label>
          <input
            className="form-input"
            placeholder="e.g., /merchants/13 or https://bagbazaar.com or https://wa.me/919400400285"
            value={newPromo.targetUrl}
            onChange={(e) => setNewPromo({ ...newPromo, targetUrl: e.target.value })}
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
              <option value="Home Top">Home Top (Full-Width Banner Slider)</option>
              <option value="Featured Offers">Featured Offers Carousel</option>
              <option value="Category Header">Category Header Banner</option>
              <option value="Home Middle">Home Middle Strip</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Promotion Type *</label>
            <select
              className="form-select"
              value={newPromo.type}
              onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}
            >
              <option value="Banner">Banner</option>
              <option value="Featured">Featured Ad</option>
              <option value="Sponsored">Sponsored Listing</option>
              <option value="Promotion">Special Promotion</option>
              <option value="Text Carousel">Text Carousel</option>
              <option value="Footer Ads">Footer Ads</option>
            </select>
          </div>
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
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={newPromo.status}
              onChange={(e) => setNewPromo({ ...newPromo, status: e.target.value })}
            >
              <option value="active">Active (Visible on Landing Page)</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Target Location / City</label>
          <GoogleMapsLocationInput
            value={newPromo.location}
            onChange={(loc) => setNewPromo({ ...newPromo, location: loc })}
            placeholder="e.g. Kerala, Payyanur, Kannur..."
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
      </Modal>

      {/* Edit Promotion Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Banner Ad / Promotion"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEditSubmit}
              disabled={isUpdating || editUploadingImage}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {isUpdating ? (
                <>
                  <CircularSpinner size={16} color="#FFFFFF" />
                  <span>Updating PostgreSQL...</span>
                </>
              ) : (
                'Save Changes'
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

            {/* Banner Image Upload & CDN Section */}
            <div className="form-group" style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlinePhotograph size={18} color="#2563eb" /> Edit Banner Image
              </label>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <input
                  type="file"
                  ref={editFileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={editUploadingImage}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {editUploadingImage ? (
                    <>
                      <CircularSpinner size={14} color="#2563eb" /> Uploading to CDN...
                    </>
                  ) : (
                    <>
                      <HiOutlinePhotograph /> Upload New Image File
                    </>
                  )}
                </button>
                <span style={{ fontSize: 12, color: '#64748b' }}>Replaces image on DigitalOcean Spaces CDN</span>
              </div>

              <input
                className="form-input"
                placeholder="Image URL..."
                value={editFormData.imageUrl || ''}
                onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
              />

              {editFormData.imageUrl && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    ✓ Current Banner Preview:
                  </div>
                  <div style={{ width: '100%', height: 140, borderRadius: 8, overflow: 'hidden', background: '#0f172a', border: '1px solid #cbd5e1' }}>
                    <img
                      src={editFormData.imageUrl}
                      alt="Current Banner"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Target URL */}
            <div className="form-group">
              <label className="form-label">Destination / Target URL</label>
              <input
                className="form-input"
                placeholder="Click link e.g. /merchants/13 or external website"
                value={editFormData.targetUrl || ''}
                onChange={(e) => setEditFormData({ ...editFormData, targetUrl: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Placement *</label>
                <select
                  className="form-select"
                  value={editFormData.placement || 'Home Top'}
                  onChange={(e) => setEditFormData({ ...editFormData, placement: e.target.value })}
                >
                  <option value="Home Top">Home Top (Full-Width Banner Slider)</option>
                  <option value="Featured Offers">Featured Offers Carousel</option>
                  <option value="Category Header">Category Header Banner</option>
                  <option value="Home Middle">Home Middle Strip</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Promotion Type</label>
                <select
                  className="form-select"
                  value={editFormData.type || 'Banner'}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                >
                  <option value="Banner">Banner</option>
                  <option value="Featured">Featured Ad</option>
                  <option value="Sponsored">Sponsored Listing</option>
                  <option value="Promotion">Special Promotion</option>
                  <option value="Text Carousel">Text Carousel</option>
                  <option value="Footer Ads">Footer Ads</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Ad Category *</label>
                <select
                  className="form-select"
                  value={editFormData.category || ''}
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
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editFormData.status || 'active'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="active">Active (Visible)</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Location</label>
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
          </form>
        )}
      </Modal>

      {/* View Promotion Details Modal */}
      <Modal
        isOpen={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        title="Banner Ad / Promotion Details"
        size="md"
      >
        {selectedPromo && (
          <div>
            {selectedPromo.imageUrl && (
              <div style={{ width: '100%', height: 180, borderRadius: 10, overflow: 'hidden', marginBottom: 16, background: '#0f172a' }}>
                <img
                  src={selectedPromo.imageUrl}
                  alt={selectedPromo.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <StatusBadge status={selectedPromo.status} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '4px 12px', borderRadius: 20 }}>
                {selectedPromo.type} &bull; {selectedPromo.placement}
              </span>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#1F2937' }}>
              {selectedPromo.title}
            </h3>

            {selectedPromo.targetUrl && (
              <div style={{ marginBottom: 16 }}>
                <a
                  href={selectedPromo.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb' }}
                >
                  <HiOutlineExternalLink /> Open Target Link ({selectedPromo.targetUrl})
                </a>
              </div>
            )}

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
                <p style={{ fontWeight: 700, margin: 0, color: '#2563eb' }}>{(selectedPromo.clicks || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
