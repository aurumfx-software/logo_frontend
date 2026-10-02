import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineRefresh,
  HiOutlineX,
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineOfficeBuilding,
  HiOutlineStar,
  HiOutlineLocationMarker,
  HiOutlineShare,
  HiCheckCircle,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { categories as mockCategories } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { canModifyCategories } from '../utils/rbac';
import {
  fetchCategoriesList,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryIcon,
} from '../api/categoryApi';
import { fetchMerchantsList } from '../api/merchantApi';

export default function Categories() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canModify = canModifyCategories(user);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Modal & Edit state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Image Upload state
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Delete modal state
  const [deleteConfirmCat, setDeleteConfirmCat] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Merchants per category state
  const [allMerchants, setAllMerchants] = useState([]);
  const [merchantSearch, setMerchantSearch] = useState({});

  // Category form state (no slug, no icon/emoji)
  const [formData, setFormData] = useState({
    name: '',
    category_name: '',
    description: '',
    icon_url: '',
    is_active: true,
    status: 'Active',
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      setIsUsingFallback(false);
      const apiCategories = await fetchCategoriesList();
      if (Array.isArray(apiCategories)) {
        setData(apiCategories);
      } else {
        setData([]);
      }
    } catch (err) {
      console.warn('Backend categories fetch error, loading fallback:', err);
      setIsUsingFallback(true);
      setData(mockCategories);
    } finally {
      setLoading(false);
    }
  };

  // Load all merchants once so we can filter by category client-side
  const loadAllMerchants = async () => {
    try {
      const currentUserId = user?.id || user?.user_id;
      const currentUserCode = user?.user_code || user?.userCode;
      const list = await fetchMerchantsList(currentUserId, currentUserCode);
      if (Array.isArray(list)) setAllMerchants(list);
    } catch {
      setAllMerchants([]);
    }
  };

  useEffect(() => {
    loadCategories();
    loadAllMerchants();
  }, []);

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const resetForm = () => {
    setFormData({ name: '', category_name: '', description: '', icon_url: '', is_active: true, status: 'Active' });
    setImagePreview('');
    setUploadProgress(null);
    setErrorMessage('');
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || cat.category_name || '',
      category_name: cat.category_name || cat.name || '',
      description: cat.description || '',
      icon_url: cat.icon_url || '',
      is_active: cat.is_active !== undefined ? cat.is_active : cat.status === 'Active',
      status: cat.status || (cat.is_active ? 'Active' : 'Inactive'),
    });
    setImagePreview(cat.icon_url || '');
    setUploadProgress(null);
    setErrorMessage('');
    setShowModal(true);
  };

  const handleImageFileSelect = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onprogress = (evt) => {
      if (evt.lengthComputable) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
    };
    reader.onload = () => {
      setImagePreview(reader.result);
      setFormData((prev) => ({ ...prev, icon_url: reader.result }));
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 1200);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      const serverUrl = await uploadCategoryIcon(file);
      if (serverUrl) {
        setFormData((prev) => ({ ...prev, icon_url: serverUrl }));
        setImagePreview(serverUrl);
      }
    } catch {
      // keep base64 preview
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleImageFileSelect(file);
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setFormData((prev) => ({ ...prev, icon_url: '' }));
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!formData.name.trim()) { setErrorMessage('Category name is required.'); return; }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, formData);
        setData((prev) => prev.map((item) => (item.id === editingCategory.id ? updated : item)));
        showToast(`Category "${updated.name}" updated successfully.`);
      } else {
        const created = await createCategory(formData);
        setData((prev) => [created, ...prev]);
        showToast(`Category "${created.name}" created successfully.`);
      }
      setShowModal(false);
    } catch (err) {
      console.warn('Backend category save error:', err);
      if (editingCategory) {
        const fb = { ...editingCategory, ...formData, id: editingCategory.id };
        setData((prev) => prev.map((item) => (item.id === editingCategory.id ? fb : item)));
        showToast(`Category "${fb.name}" updated locally.`);
      } else {
        const fb = { id: `cat-${Date.now()}`, ...formData, logo_count: 0, count: 0, subcategories: [] };
        setData((prev) => [fb, ...prev]);
        showToast(`Category "${fb.name}" added locally.`);
      }
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmCat) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deleteConfirmCat.id);
      setData((prev) => prev.filter((cat) => cat.id !== deleteConfirmCat.id));
      showToast(`Category "${deleteConfirmCat.name}" deleted successfully.`);
    } catch {
      setData((prev) => prev.filter((cat) => cat.id !== deleteConfirmCat.id));
      showToast(`Category "${deleteConfirmCat.name}" removed.`);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmCat(null);
    }
  };

  // Get merchants for a given category name
  const getMerchantsForCategory = (catName) => {
    const search = (merchantSearch[catName] || '').toLowerCase();
    return allMerchants.filter((m) => {
      const matchCat = (m.category || '').toLowerCase() === catName.toLowerCase();
      if (!search) return matchCat;
      return matchCat && (
        (m.name || '').toLowerCase().includes(search) ||
        (m.city || '').toLowerCase().includes(search) ||
        (m.district || '').toLowerCase().includes(search)
      );
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 80, right: 24, zIndex: 9999, background: '#2563EB', color: 'white', padding: '12px 20px', borderRadius: 10, boxShadow: '0 10px 25px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}
          >
            <HiOutlineCheckCircle size={20} /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader title="Categories" subtitle="Manage entity categories & view merchants per category">
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={loadCategories} disabled={loading} title="Reload">
            <HiOutlineRefresh className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {canModify && (
            <button className="btn btn-primary" onClick={handleOpenAddModal}>
              <HiOutlinePlus /> Add Category
            </button>
          )}
        </div>
      </PageHeader>

      {loading && (
        <div style={{ padding: '12px 16px', background: '#F0FDF4', color: '#15803D', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HiOutlineRefresh className="animate-spin" /> Fetching live categories...
        </div>
      )}

      {isUsingFallback && !loading && (
        <div style={{ padding: '10px 14px', background: '#FFFBEB', color: '#B45309', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #FCD34D' }}>
          ⚠️ Backend API unreachable — showing offline data.
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <HiOutlineOfficeBuilding style={{ fontSize: 48, color: '#CBD5E1', display: 'block', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>No Categories Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 20px 0' }}>Click below to add the first category.</p>
          <button className="btn btn-primary" onClick={handleOpenAddModal}><HiOutlinePlus /> Add Category</button>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {data.map((cat, idx) => {
          const catName = cat.name || cat.category_name || '';
          const merchants = getMerchantsForCategory(catName);
          const isExpanded = expanded[cat.id];

          return (
            <motion.div
              key={cat.id}
              className="card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              {/* Category Row */}
              <div
                style={{ display: 'flex', alignItems: 'center', padding: '18px 24px', cursor: 'pointer', gap: 16 }}
                onClick={() => toggle(cat.id)}
              >
                {/* Category Icon / Image */}
                <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: '1.5px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cat.icon_url || (cat.icon && cat.icon.startsWith('http')) ? (
                    <img
                      src={cat.icon_url || cat.icon}
                      alt={catName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{ display: (cat.icon_url || (cat.icon && cat.icon.startsWith('http'))) ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HiOutlineOfficeBuilding style={{ fontSize: 24, color: '#94A3B8' }} />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>{catName}</span>
                    <StatusBadge status={cat.status || (cat.is_active ? 'active' : 'inactive')} />
                    <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 20 }}>
                      {merchants.length} merchant{merchants.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {cat.description && (
                    <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>{cat.description}</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {canModify && (
                    <>
                      <button
                        className="btn btn-outline btn-sm btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(cat); }}
                        title="Edit Category"
                      >
                        <HiOutlinePencil size={16} />
                      </button>
                      <button
                        className="btn btn-outline btn-sm btn-icon"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmCat(cat); }}
                        title="Delete Category"
                        style={{ color: '#EF4444', borderColor: '#FECACA' }}
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </>
                  )}
                  <span style={{ color: '#94A3B8', fontSize: 20, marginLeft: 4 }}>
                    {isExpanded ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
                  </span>
                </div>
              </div>

              {/* Expanded: Merchants in this category */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ borderTop: '1px solid #F1F5F9', padding: '16px 24px 20px' }}
                >
                  {/* Search bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
                      <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 16 }} />
                      <input
                        type="text"
                        placeholder={`Search merchants in "${catName}"...`}
                        value={merchantSearch[catName] || ''}
                        onChange={(e) => setMerchantSearch((prev) => ({ ...prev, [catName]: e.target.value }))}
                        style={{ paddingLeft: 34, paddingRight: 12, height: 38, borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, width: '100%', outline: 'none', background: '#FAFAFA' }}
                        onFocus={(e) => (e.target.style.borderColor = '#6C63FF')}
                        onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                      />
                      {merchantSearch[catName] && (
                        <button
                          type="button"
                          onClick={() => setMerchantSearch((prev) => ({ ...prev, [catName]: '' }))}
                          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                        >
                          <HiOutlineX size={14} />
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {merchants.length} result{merchants.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Merchant cards grid */}
                  {merchants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8' }}>
                      <HiOutlineOfficeBuilding style={{ fontSize: 32, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {merchantSearch[catName] ? `No merchants match "${merchantSearch[catName]}"` : `No merchants in "${catName}" yet`}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                      {merchants.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => navigate(`/merchants/${m.id}`, { state: { merchant: m } })}
                          style={{ background: '#FAFAFA', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'all 0.18s', cursor: 'pointer', position: 'relative' }}
                          onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(108,99,255,0.13)'; e.currentTarget.style.borderColor = '#C7D2FE'; e.currentTarget.style.background = '#F5F3FF'; }}
                          onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFAFA'; }}
                        >
                          {/* Merchant avatar / photo */}
                          <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1.5px solid #E2E8F0', background: '#F1F5F9' }}>
                            {(m.image || (m.photos && m.photos[0])) ? (
                              <img
                                src={m.image || m.photos[0]}
                                alt={m.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#6C63FF', background: '#EDE9FE' }}>
                                {(m.name || 'M').charAt(0)}
                              </div>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <HiOutlineLocationMarker size={12} />
                              {m.city || m.district || '—'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                              <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 2, color: '#F59E0B', fontWeight: 700 }}>
                                <HiOutlineStar size={11} /> {m.rating || '—'}
                              </span>
                              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 700, background: m.status === 'active' ? '#D1FAE5' : '#FEE2E2', color: m.status === 'active' ? '#065F46' : '#B91C1C' }}>
                                {m.status || 'active'}
                              </span>
                            </div>
                          </div>

                          {/* Share button */}
                          <button
                            title="Copy merchant link"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `${window.location.origin}/merchants/${m.id}`;
                              navigator.clipboard.writeText(url);
                              setCopiedId(m.id);
                              setTimeout(() => setCopiedId(null), 2200);
                            }}
                            style={{
                              background: copiedId === m.id ? '#D1FAE5' : '#F1F5F9',
                              border: 'none',
                              borderRadius: 8,
                              padding: '5px 7px',
                              cursor: 'pointer',
                              color: copiedId === m.id ? '#059669' : '#94A3B8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              alignSelf: 'flex-start',
                              transition: 'all 0.15s',
                            }}
                          >
                            {copiedId === m.id ? <HiCheckCircle size={15} /> : <HiOutlineShare size={15} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        size="md"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancel</button>
            <button className="btn btn-primary" onClick={handleFormSubmit} disabled={isSubmitting || isUploading}>
              {isSubmitting ? (editingCategory ? 'Updating...' : 'Creating...') : (editingCategory ? 'Save Changes' : 'Create Category')}
            </button>
          </>
        }
      >
        {errorMessage && (
          <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          {/* Category Name */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#334155' }}>
              Category Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Solar & Electricals"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value, category_name: e.target.value }))}
              required
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#334155' }}>Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value, is_active: e.target.value === 'Active' }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Category Photo Upload */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#334155' }}>Category Photo</label>

            {imagePreview ? (
              /* ── Preview state ── */
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: 12 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: '2px solid #E2E8F0', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 2 }}>
                    {isUploading ? '⏳ Uploading to server...' : '✅ Photo selected'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>
                    {isUploading ? 'Please wait while the image is being saved.' : 'Looks great! You can change or remove it.'}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label
                      htmlFor="cat-photo-change"
                      style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, border: '1.5px solid #6C63FF', color: '#6C63FF', cursor: 'pointer', background: 'white' }}
                    >
                      📁 Change Photo
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, border: '1.5px solid #FCA5A5', color: '#EF4444', cursor: 'pointer', background: 'white' }}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
                <input
                  id="cat-photo-change"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageFileSelect(e.target.files?.[0])}
                />
              </div>
            ) : (
              /* ── Upload dropzone ── */
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.background = '#F5F3FF'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#FAFAFA'; }}
                style={{ border: '2px dashed #CBD5E1', borderRadius: 14, background: '#FAFAFA', padding: '28px 20px', textAlign: 'center', transition: 'all 0.2s' }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <HiOutlinePhotograph size={26} style={{ color: '#6C63FF' }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Upload Category Photo</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>Drag & drop an image here, or click the button below</div>
                <label
                  htmlFor="cat-photo-upload"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #6C63FF 0%, #5A52D5 100%)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(108,99,255,0.35)' }}
                >
                  <HiOutlinePhotograph size={16} />
                  Choose Photo
                </label>
                <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 8 }}>PNG, JPG, WEBP — max 5 MB</div>
                <input
                  id="cat-photo-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageFileSelect(e.target.files?.[0])}
                />
              </div>
            )}

            {/* Upload progress */}
            {uploadProgress !== null && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#6C63FF', marginBottom: 4 }}>
                  <span>Uploading...</span><span>{uploadProgress}%</span>
                </div>
                <div style={{ height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #6C63FF, #A5B4FC)', transition: 'width 0.2s ease', borderRadius: 4 }} />
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600, color: '#334155' }}>Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Enter category description..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmCat)}
        onClose={() => setDeleteConfirmCat(null)}
        title="Delete Category"
        size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteConfirmCat(null)} disabled={isDeleting}>Cancel</button>
            <button className="btn btn-primary" onClick={handleDeleteConfirm} disabled={isDeleting} style={{ background: '#DC2626', borderColor: '#DC2626' }}>
              {isDeleting ? 'Deleting...' : 'Delete Category'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: '#334155', margin: 0 }}>
          Are you sure you want to delete <strong>"{deleteConfirmCat?.name}"</strong>? This will remove the category and unlink any assigned items.
        </p>
      </Modal>
    </motion.div>
  );
}
