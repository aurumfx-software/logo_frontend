import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineEye,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlinePlus,
  HiOutlineLocationMarker,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineGlobe,
  HiOutlinePencil,
  HiOutlineTrash,
} from 'react-icons/hi';
import { FaWhatsapp, FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import GoogleMapsLocationInput from '../components/UI/GoogleMapsLocationInput';
import MultiSelectLocationPicker from '../components/UI/MultiSelectLocationPicker';
import {
  fetchMerchantsList,
  createMerchant,
  uploadMerchantMedia,
  updateMerchant,
  deleteMerchant,
  approveMerchant,
  rejectMerchant,
} from '../api/merchantApi';
import { fetchCategoriesList } from '../api/categoryApi';
import { useAuth } from '../context/AuthContext';
import {
  STATE_DISTRICT_REGIONS,
  DEFAULT_STATE,
  DEFAULT_DISTRICT,
  getStateForDistrict,
  getStatesList,
  getDistrictsForState,
  getCitiesForDistrict,
  getDistrictsForStates,
  getCitiesForDistricts,
} from '../utils/locations';

const initialMerchantState = {
  name: '',
  business_name: '',
  owner_name: '',
  owner: '',
  category: '',
  categories: [],
  address: '',
  landmark: '',
  city: 'Payyanur',
  district: 'Kannur',
  state: 'Kerala',
  states: [DEFAULT_STATE],
  districts: [DEFAULT_DISTRICT],
  cities: ['Payyanur'],
  latitude: null,
  longitude: null,
  phone: '',
  phone_number: '',
  whatsapp: '',
  landline: '',
  email: '',
  website: '',
  facebook: '',
  instagram: '',
  twitter: '',
  youtube: '',
  service_timing: '09:00 AM - 09:00 PM',
  status: 'PENDING',
  photos: ['', '', '', ''],
  videoUrl: '',
};

export default function Merchants() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [data, setData] = useState([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);

  // New Merchant Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMerchant, setNewMerchant] = useState(initialMerchantState);
  const [addModalError, setAddModalError] = useState('');
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Edit Merchant Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [editFormData, setEditFormData] = useState(initialMerchantState);
  const [editModalError, setEditModalError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditVideoUploading, setIsEditVideoUploading] = useState(false);
  const [editVideoUploadProgress, setEditVideoUploadProgress] = useState(0);

  // --- Add Merchant Upload Handlers ---
  const handlePhotoUpload = async (index, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedPhotos = [...newMerchant.photos];
      updatedPhotos[index] = reader.result;
      setNewMerchant((prev) => ({ ...prev, photos: updatedPhotos }));
    };
    reader.readAsDataURL(file);

    try {
      const mediaFormData = new FormData();
      mediaFormData.append('photos', file);
      const uploadRes = await uploadMerchantMedia(mediaFormData);
      if (uploadRes && uploadRes.photos && uploadRes.photos[0]) {
        const serverUrl = uploadRes.photos[0];
        const updatedPhotos = [...newMerchant.photos];
        updatedPhotos[index] = serverUrl;
        setNewMerchant((prev) => ({ ...prev, photos: updatedPhotos }));
      }
    } catch (uploadErr) {
      console.warn('Photo media upload API notice:', uploadErr);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!file) return;
    setIsVideoUploading(true);
    setVideoUploadProgress(10);

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setVideoUploadProgress(percent);
      }
    };
    reader.onload = (e) => {
      setNewMerchant((prev) => ({ ...prev, videoUrl: e.target.result }));
    };
    reader.readAsDataURL(file);

    try {
      const mediaFormData = new FormData();
      mediaFormData.append('videos', file);
      const uploadRes = await uploadMerchantMedia(mediaFormData);
      const vid = (uploadRes && uploadRes.videos && uploadRes.videos[0]) || (uploadRes && uploadRes.photos && uploadRes.photos[0]);
      if (vid) {
        setNewMerchant((prev) => ({ ...prev, videoUrl: vid }));
      }
    } catch (err) {
      console.warn('Video upload notice:', err);
    } finally {
      setIsVideoUploading(false);
      setVideoUploadProgress(100);
    }
  };

  const handleAddMerchantSubmit = async (e) => {
    if (e) e.preventDefault();
    setAddModalError('');

    const storeName = (newMerchant.business_name || newMerchant.name || '').trim();
    if (!storeName) {
      setAddModalError('Please enter a business / store name');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUserCode = user?.user_code || user?.userCode || localStorage.getItem('user_code') || 'FLS_1';
      const validPhotos = (newMerchant.photos || []).filter((p) => p && typeof p === 'string' && p.trim() !== '');

      const createdItem = await createMerchant({
        business_name: storeName,
        category: newMerchant.category || 'Retail',
        categories: [newMerchant.category || 'Retail'],
        owner_name: newMerchant.owner_name || newMerchant.owner || 'Owner Name',
        phone_number: newMerchant.phone_number || newMerchant.phone || '+91 98470 12345',
        email: newMerchant.email || null,
        district: newMerchant.district || 'Kannur',
        city: newMerchant.city || 'Payyanur',
        address: newMerchant.address || 'Main Road',
        landmark: newMerchant.landmark || newMerchant.address || 'Near Bus Stand',
        services: [newMerchant.category || 'Retail'],
        service_timing: newMerchant.service_timing || '09:00 AM - 09:00 PM',
        merchant_photos: validPhotos,
        merchant_videos: newMerchant.videoUrl ? [newMerchant.videoUrl] : [],
        user_code: currentUserCode,
        status: 'PENDING',
      });

      setShowAddModal(false);
      setNewMerchant(initialMerchantState);

      const goToRegistrations = window.confirm(
        `Merchant application for "${storeName}" has been submitted successfully!\n\nAs per approval workflow, it has been sent with full details to the "Registrations" section for Admin Review & Approval.\n\nWould you like to open the Registrations page now to review and approve it?`
      );
      if (goToRegistrations) {
        navigate('/registration-requests');
      }
    } catch (err) {
      console.error('Backend merchant onboarding error:', err);
      setAddModalError(err.message || 'Merchant Onboarding Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Edit Merchant Upload Handlers ---
  const handleEditPhotoUpload = async (index, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedPhotos = [...editFormData.photos];
      updatedPhotos[index] = reader.result;
      setEditFormData((prev) => ({ ...prev, photos: updatedPhotos }));
    };
    reader.readAsDataURL(file);

    try {
      const mediaFormData = new FormData();
      mediaFormData.append('photos', file);
      const uploadRes = await uploadMerchantMedia(mediaFormData);
      if (uploadRes && uploadRes.photos && uploadRes.photos[0]) {
        const serverUrl = uploadRes.photos[0];
        const updatedPhotos = [...editFormData.photos];
        updatedPhotos[index] = serverUrl;
        setEditFormData((prev) => ({ ...prev, photos: updatedPhotos }));
      }
    } catch (uploadErr) {
      console.warn('Edit photo media upload API notice:', uploadErr);
    }
  };

  const handleEditVideoUpload = async (file) => {
    if (!file) return;
    setIsEditVideoUploading(true);
    setEditVideoUploadProgress(10);

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setEditVideoUploadProgress(percent);
      }
    };
    reader.onload = (e) => {
      setEditFormData((prev) => ({ ...prev, videoUrl: e.target.result }));
    };
    reader.readAsDataURL(file);

    try {
      const mediaFormData = new FormData();
      mediaFormData.append('videos', file);
      const uploadRes = await uploadMerchantMedia(mediaFormData);
      const vid = (uploadRes && uploadRes.videos && uploadRes.videos[0]) || (uploadRes && uploadRes.photos && uploadRes.photos[0]);
      if (vid) {
        setEditFormData((prev) => ({ ...prev, videoUrl: vid }));
      }
    } catch (err) {
      console.warn('Edit video upload notice:', err);
    } finally {
      setIsEditVideoUploading(false);
      setEditVideoUploadProgress(100);
    }
  };

  const handleOpenEditModal = (merchantRow) => {
    setEditingMerchant(merchantRow);
    const photosArr = Array.isArray(merchantRow.photos) && merchantRow.photos.length > 0
      ? [...merchantRow.photos, '', '', '', ''].slice(0, 4)
      : ['', '', '', ''];

    const resolvedDistricts = Array.isArray(merchantRow.districts) && merchantRow.districts.length > 0
      ? merchantRow.districts
      : merchantRow.district
      ? merchantRow.district.split(',').map((s) => s.trim())
      : [DEFAULT_DISTRICT];

    const resolvedStates = Array.isArray(merchantRow.states) && merchantRow.states.length > 0
      ? merchantRow.states
      : merchantRow.state
      ? merchantRow.state.split(',').map((s) => s.trim())
      : [getStateForDistrict(resolvedDistricts[0], DEFAULT_STATE)];

    const resolvedCities = Array.isArray(merchantRow.cities) && merchantRow.cities.length > 0
      ? merchantRow.cities
      : merchantRow.city
      ? merchantRow.city.split(',').map((s) => s.trim())
      : [getCitiesForDistrict(resolvedStates[0], resolvedDistricts[0])[0] || 'Payyanur'];

    setEditFormData({
      id: merchantRow.id,
      name: merchantRow.name || merchantRow.business_name || '',
      business_name: merchantRow.business_name || merchantRow.name || '',
      owner_name: merchantRow.owner_name || merchantRow.owner || '',
      owner: merchantRow.owner || merchantRow.owner_name || '',
      category: merchantRow.category || 'Retail',
      categories: merchantRow.categories || [merchantRow.category || 'Retail'],
      address: merchantRow.address || '',
      landmark: merchantRow.landmark || '',
      city: resolvedCities.join(', '),
      district: resolvedDistricts.join(', '),
      state: resolvedStates.join(', '),
      states: resolvedStates,
      districts: resolvedDistricts,
      cities: resolvedCities,
      latitude: merchantRow.latitude || null,
      longitude: merchantRow.longitude || null,
      phone: merchantRow.phone || merchantRow.phone_number || '',
      phone_number: merchantRow.phone_number || merchantRow.phone || '',
      whatsapp: merchantRow.whatsapp || '',
      landline: merchantRow.landline || '',
      email: merchantRow.email || '',
      website: merchantRow.website || '',
      facebook: merchantRow.facebook || '',
      instagram: merchantRow.instagram || '',
      twitter: merchantRow.twitter || '',
      youtube: merchantRow.youtube || '',
      service_timing: merchantRow.service_timing || '09:00 AM - 09:00 PM',
      status: merchantRow.status ? merchantRow.status.toUpperCase() : 'APPROVED',
      photos: photosArr,
      videoUrl: merchantRow.videoUrl || '',
    });
    setEditModalError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    if (e) e.preventDefault();
    setEditModalError('');

    const storeName = (editFormData.business_name || editFormData.name || '').trim();
    if (!storeName) {
      setEditModalError('Please enter a business / store name');
      return;
    }

    setIsUpdating(true);
    try {
      const validPhotos = (editFormData.photos || []).filter((p) => p && typeof p === 'string' && p.trim() !== '');
      const statusValue = editFormData.status ? editFormData.status.toLowerCase() : 'active';

      await updateMerchant(editFormData.id, {
        business_name: storeName,
        name: storeName,
        owner_name: editFormData.owner_name || editFormData.owner,
        phone_number: editFormData.phone_number || editFormData.phone,
        email: editFormData.email,
        category: editFormData.category,
        district: editFormData.district,
        city: editFormData.city,
        address: editFormData.address,
        landmark: editFormData.landmark,
        service_timing: editFormData.service_timing,
        status: editFormData.status,
      });

      // Update local table data
      setData((prev) =>
        prev.map((m) =>
          m.id === editFormData.id
            ? {
              ...m,
              name: storeName,
              business_name: storeName,
              owner: editFormData.owner_name || editFormData.owner || m.owner,
              category: editFormData.category || m.category,
              phone: editFormData.phone_number || editFormData.phone || m.phone,
              phone_number: editFormData.phone_number || editFormData.phone || m.phone,
              whatsapp: editFormData.whatsapp || m.whatsapp,
              landline: editFormData.landline || m.landline,
              email: editFormData.email !== undefined ? editFormData.email : m.email,
              website: editFormData.website || m.website,
              facebook: editFormData.facebook || m.facebook,
              instagram: editFormData.instagram || m.instagram,
              twitter: editFormData.twitter || m.twitter,
              youtube: editFormData.youtube || m.youtube,
              city: editFormData.city || m.city,
              district: editFormData.district || m.district,
              address: editFormData.address || m.address,
              latitude: editFormData.latitude !== undefined ? editFormData.latitude : m.latitude,
              longitude: editFormData.longitude !== undefined ? editFormData.longitude : m.longitude,
              status: statusValue,
              photos: validPhotos.length > 0 ? validPhotos : m.photos,
              videoUrl: editFormData.videoUrl || m.videoUrl,
            }
            : m
        )
      );

      // On SUCCESS: Close popup modal!
      setIsEditModalOpen(false);
      setEditingMerchant(null);
    } catch (err) {
      console.error('Update merchant submit error:', err);
      // On FAILURE: Keep popup open and show error inside modal!
      setEditModalError(err.message || 'Failed to update merchant profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Delete Merchant Handler ---
  const handleDeleteMerchant = async (merchantRow) => {
    const merchantName = merchantRow.name || merchantRow.business_name || 'this merchant';
    if (!window.confirm(`Are you sure you want to delete merchant "${merchantName}"?`)) {
      return;
    }
    try {
      await deleteMerchant(merchantRow.id);
      setData((prev) => prev.filter((m) => m.id !== merchantRow.id));
      if (selectedMerchant && selectedMerchant.id === merchantRow.id) {
        setSelectedMerchant(null);
      }
    } catch (err) {
      console.error('Failed to delete merchant:', err);
      // Local fallback removal
      setData((prev) => prev.filter((m) => m.id !== merchantRow.id));
    }
  };

  // --- Status Toggle Handler ---
  const handleStatusChange = async (id, newStatus) => {
    try {
      if (newStatus === 'active' || newStatus === 'approved') {
        await approveMerchant(id);
      } else {
        await rejectMerchant(id, `Merchant status updated to ${newStatus}`);
      }
      setData((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
      if (selectedMerchant && selectedMerchant.id === id) {
        setSelectedMerchant((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.warn('Status API notice, updating local state:', err);
      setData((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingMerchants(true);
        const currentUserId = user?.id || user?.user_id;
        const currentUserCode = user?.user_code || user?.userCode;
        const apiMerchants = await fetchMerchantsList(currentUserId, currentUserCode);
        if (Array.isArray(apiMerchants)) {
          // Only show approved / active merchants in the Merchants directory (pending registrations stay in Registrations section)
          const approvedMerchants = apiMerchants.filter((m) => (m.status || '').toLowerCase() !== 'pending');
          approvedMerchants.sort((a, b) => {
            const timeA = new Date(a.created_at || a.createdAt || a.joined || 0).getTime();
            const timeB = new Date(b.created_at || b.createdAt || b.joined || 0).getTime();
            if (timeB !== timeA) return timeB - timeA;
            return (Number(b.id) || 0) - (Number(a.id) || 0);
          });
          setData(approvedMerchants);
        } else {
          setData([]);
        }
      } catch (err) {
        console.warn('Backend merchants list error:', err);
        setData([]);
      } finally {
        setLoadingMerchants(false);
      }

      try {
        const catItems = await fetchCategoriesList();
        if (Array.isArray(catItems) && catItems.length > 0) {
          const fetchedNames = Array.from(new Set(catItems.map((c) => c.name || c.category_name).filter(Boolean)));
          setCategoriesList(fetchedNames);
        } else {
          setCategoriesList([]);
        }
      } catch (catErr) {
        console.warn('Backend categories list error in Merchants page:', catErr);
        setCategoriesList([]);
      }
    }
    loadData();
  }, [user]);

  const filteredData =
    activeTab === 'all'
      ? data
      : data.filter((m) => m.status === activeTab);

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: 'Merchant Name',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-ultra-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {val?.charAt(0)}
          </div>
          <span style={{ fontWeight: 600 }}>{val}</span>
        </div>
      ),
    },
    { key: 'category', label: 'Category' },
    { key: 'city', label: 'City' },
    {
      key: 'rating',
      label: 'Rating',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <HiOutlineStar style={{ color: '#FFB946', fontSize: 14 }} />
          <span style={{ fontWeight: 600 }}>{val}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-outline btn-sm btn-icon"
            title="View Details"
            onClick={() => navigate(`/merchants/${row.id}`)}
          >
            <HiOutlineEye />
          </button>
          <button
            className="btn btn-outline btn-sm btn-icon"
            title="Edit Merchant"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary-light)' }}
            onClick={() => handleOpenEditModal(row)}
          >
            <HiOutlinePencil />
          </button>
          {row.status === 'active' || row.status === 'approved' ? (
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="Suspend Merchant"
              style={{ color: 'var(--danger)' }}
              onClick={() => handleStatusChange(row.id, 'suspended')}
            >
              <HiOutlineBan />
            </button>
          ) : (
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="Activate Merchant"
              style={{ color: 'var(--success)' }}
              onClick={() => handleStatusChange(row.id, 'active')}
            >
              <HiOutlineCheckCircle />
            </button>
          )}
          <button
            className="btn btn-outline btn-sm btn-icon"
            title="Delete Merchant"
            style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
            onClick={() => handleDeleteMerchant(row)}
          >
            <HiOutlineTrash />
          </button>
        </div>
      ),
    },
  ];

  const counts = {
    all: data.length,
    active: data.filter((m) => m.status === 'active' || m.status === 'approved').length,
    suspended: data.filter((m) => m.status === 'suspended').length,
    inactive: data.filter((m) => m.status === 'inactive' || m.status === 'rejected').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Merchants"
        subtitle="View, search, edit, and manage all registered merchants"
      >
        <button className="btn btn-primary" onClick={() => { setAddModalError(''); setShowAddModal(true); }}>
          <HiOutlinePlus /> Add New Merchant
        </button>
      </PageHeader>

      <div className="tabs">
        {['all', 'active', 'suspended', 'inactive'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab] || 0})
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loadingMerchants && (
            <div style={{ padding: '16px 24px', fontSize: 13, color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F3F4F6' }}>
              <span>🔄 Loading live merchants from API...</span>
            </div>
          )}
          <DataTable
            columns={columns}
            data={filteredData}
            searchPlaceholder="Search merchant name, category, city..."
            onRowClick={(row) => navigate(`/merchants/${row.id}`, { state: { merchant: row } })}
          />
        </div>
      </div>

      {/* View Merchant Modal */}
      <Modal
        isOpen={!!selectedMerchant}
        onClose={() => setSelectedMerchant(null)}
        title="Merchant Details"
        size="lg"
      >
        {selectedMerchant && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <img
                src={selectedMerchant.image || (selectedMerchant.photos && selectedMerchant.photos[0]) || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80'}
                alt={selectedMerchant.name}
                style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', border: '2px solid #2563EB' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80';
                }}
              />
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>{selectedMerchant.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  {selectedMerchant.category} · {selectedMerchant.city}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Status</label>
                <StatusBadge status={selectedMerchant.status} />
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Rating</label>
                <p style={{ fontWeight: 600 }}>⭐ {selectedMerchant.rating} ({selectedMerchant.reviews || 1} reviews)</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Joined</label>
                <p>{selectedMerchant.joined || '2026-09-25'}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Merchant ID</label>
                <p style={{ fontFamily: 'monospace' }}>{selectedMerchant.id}</p>
              </div>
              {selectedMerchant.latitude && selectedMerchant.longitude && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ color: 'var(--text-light)' }}>Exact GPS Pinpoint Location</label>
                  <p style={{ fontFamily: 'monospace', fontWeight: 700, margin: 0, color: '#2563EB', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📍 {Number(selectedMerchant.latitude).toFixed(6)}, {Number(selectedMerchant.longitude).toFixed(6)}
                    <a
                      href={`https://www.google.com/maps?q=${selectedMerchant.latitude},${selectedMerchant.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#1D4ED8', textDecoration: 'underline' }}
                    >
                      Open Map ↗
                    </a>
                  </p>
                </div>
              )}
            </div>

            {/* Merchant Photos Gallery */}
            {selectedMerchant.photos && selectedMerchant.photos.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  📷 Merchant Business Photos ({selectedMerchant.photos.length})
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {selectedMerchant.photos.map((imgUrl, i) => (
                    <div key={i} style={{ height: 85, borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <img
                        src={imgUrl}
                        alt={`Photo ${i + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merchant Business Video */}
            {selectedMerchant.videoUrl && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🎥 Merchant Store Tour / Promo Video
                </label>
                <div style={{ background: '#000000', borderRadius: 12, overflow: 'hidden', border: '1px solid #1E293B' }}>
                  <video
                    controls
                    src={selectedMerchant.videoUrl}
                    style={{ width: '100%', maxHeight: 240, display: 'block' }}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create New Merchant Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Merchant"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddMerchantSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving Merchant...' : 'Save Merchant'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddMerchantSubmit}>
          {addModalError && (
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
              <span>⚠️ {addModalError}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Merchant / Business Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Royal Solar Solutions"
              value={newMerchant.name}
              onChange={(e) => setNewMerchant({ ...newMerchant, name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={newMerchant.category}
                onChange={(e) => setNewMerchant({ ...newMerchant, category: e.target.value })}
              >
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">📞 Mobile / Phone Contact</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+91 98470 12345"
                value={newMerchant.phone}
                onChange={(e) => setNewMerchant({ ...newMerchant, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Contact Details Section */}
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px', marginBottom: 16, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 Contact Details
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaWhatsapp style={{ color: '#25D366' }} /> WhatsApp Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98470 12345"
                  value={newMerchant.whatsapp}
                  onChange={(e) => setNewMerchant({ ...newMerchant, whatsapp: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlinePhone style={{ color: '#475569' }} /> Landline Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="0497-2765432"
                  value={newMerchant.landline}
                  onChange={(e) => setNewMerchant({ ...newMerchant, landline: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlineMail style={{ color: '#6C63FF' }} /> Business Email ID
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="contact@yourbusiness.com"
                  value={newMerchant.email}
                  onChange={(e) => setNewMerchant({ ...newMerchant, email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlineGlobe style={{ color: '#3B82F6' }} /> Website URL
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.yourbusiness.com"
                  value={newMerchant.website}
                  onChange={(e) => setNewMerchant({ ...newMerchant, website: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Social Media Links Section */}
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px', marginBottom: 16, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔗 Social Media Links
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaFacebook style={{ color: '#1877F2' }} /> Facebook Page
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://facebook.com/yourbusiness"
                  value={newMerchant.facebook}
                  onChange={(e) => setNewMerchant({ ...newMerchant, facebook: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaInstagram style={{ color: '#E1306C' }} /> Instagram Profile
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://instagram.com/yourbusiness"
                  value={newMerchant.instagram}
                  onChange={(e) => setNewMerchant({ ...newMerchant, instagram: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaTwitter style={{ color: '#1DA1F2' }} /> Twitter / X Profile
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://twitter.com/yourbusiness"
                  value={newMerchant.twitter}
                  onChange={(e) => setNewMerchant({ ...newMerchant, twitter: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaYoutube style={{ color: '#FF0000' }} /> YouTube Channel
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://youtube.com/@yourchannel"
                  value={newMerchant.youtube}
                  onChange={(e) => setNewMerchant({ ...newMerchant, youtube: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="form-group">
            <label className="form-label">📍 Location Search & GPS Detect (Google Maps) *</label>
            <GoogleMapsLocationInput
              value={newMerchant.address}
              onChange={(addr) => setNewMerchant({ ...newMerchant, address: addr })}
              onSelectLocation={(place) => {
                setNewMerchant((prev) => ({
                  ...prev,
                  address: place.address,
                  city: place.city || place.name,
                  district: place.district,
                  state: place.state || prev.state,
                  latitude: place.latitude || place.lat || null,
                  longitude: place.longitude || place.lon || null,
                }));
              }}
              placeholder="Type place name or click 'GPS' button to get exact coordinates..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            {/* State Select */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>State *</label>
              <select
                className="form-select"
                value={newMerchant.state || DEFAULT_STATE}
                onChange={(e) => {
                  const newSt = e.target.value;
                  const availableDistricts = getDistrictsForState(newSt);
                  const firstDist = availableDistricts[0] || '';
                  const availableCities = getCitiesForDistrict(newSt, firstDist);
                  const firstCity = availableCities[0] || '';
                  setNewMerchant((prev) => ({
                    ...prev,
                    state: newSt,
                    district: firstDist,
                    city: firstCity,
                  }));
                }}
                required
              >
                {getStatesList().map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* District Select */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>District *</label>
              <select
                className="form-select"
                value={newMerchant.district}
                onChange={(e) => {
                  const newDist = e.target.value;
                  const currentSt = newMerchant.state || DEFAULT_STATE;
                  const availableCities = getCitiesForDistrict(currentSt, newDist);
                  const firstCity = availableCities[0] || '';
                  setNewMerchant((prev) => ({
                    ...prev,
                    district: newDist,
                    city: firstCity,
                  }));
                }}
                required
              >
                {getDistrictsForState(newMerchant.state || DEFAULT_STATE).map((d) => (
                  <option key={d} value={d}>{d} District</option>
                ))}
                {newMerchant.district && !getDistrictsForState(newMerchant.state || DEFAULT_STATE).includes(newMerchant.district) && (
                  <option value={newMerchant.district}>{newMerchant.district}</option>
                )}
              </select>
            </div>

            {/* City / Town Select */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>City / Town *</label>
              <select
                className="form-select"
                value={newMerchant.city}
                onChange={(e) => setNewMerchant((prev) => ({ ...prev, city: e.target.value }))}
                required
              >
                {getCitiesForDistrict(newMerchant.state || DEFAULT_STATE, newMerchant.district).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {newMerchant.city && !getCitiesForDistrict(newMerchant.state || DEFAULT_STATE, newMerchant.district).includes(newMerchant.city) && (
                  <option value={newMerchant.city}>{newMerchant.city}</option>
                )}
              </select>
            </div>
          </div>

          {/* Auto-updating Map Preview */}
          {(newMerchant.city || newMerchant.address || (newMerchant.latitude && newMerchant.longitude)) && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#15803D',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <span>📍 Location Auto-Mapped on Google Maps:</span>
                <strong style={{ fontFamily: 'monospace' }}>
                  {newMerchant.latitude && newMerchant.longitude
                    ? `${Number(newMerchant.latitude).toFixed(6)}, ${Number(newMerchant.longitude).toFixed(6)}`
                    : `${newMerchant.city || ''}, ${newMerchant.district || ''}, ${newMerchant.state || ''}`}
                </strong>
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(
                    newMerchant.latitude && newMerchant.longitude
                      ? `${newMerchant.latitude},${newMerchant.longitude}`
                      : `${newMerchant.city || ''}, ${newMerchant.district || ''}, ${newMerchant.state || ''}, India`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#15803D', fontSize: 11, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                >
                  Open Map ↗
                </a>
              </div>
              <iframe
                title="Merchant Location Map Preview"
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: 10, marginTop: 4 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  newMerchant.latitude && newMerchant.longitude
                    ? `${newMerchant.latitude},${newMerchant.longitude}`
                    : `${newMerchant.city || ''}, ${newMerchant.district || ''}, ${newMerchant.state || ''}, India`
                )}&hl=en&z=14&output=embed`}
              />
            </div>
          )}

          {/* 4 Photos Upload Section */}
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              📷 Merchant Business Photos (Upload Up to 4 Photos)
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Upload image files directly from your device for Storefront, Interior, Products, and Services.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[0, 1, 2, 3].map((index) => {
                const photoUrl = newMerchant.photos[index];
                const photoLabels = ['Storefront', 'Interior', 'Products', 'Services'];
                return (
                  <div
                    key={index}
                    style={{
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: 12,
                      padding: 10,
                      background: photoUrl ? '#F8FAFC' : '#FFFFFF',
                      textAlign: 'center',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 140,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Photo {index + 1}: {photoLabels[index]}
                    </span>

                    {photoUrl ? (
                      <div style={{ position: 'relative', width: '100%', height: 75, marginBottom: 8 }}>
                        <img
                          src={photoUrl}
                          alt={`Merchant Photo ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedPhotos = [...newMerchant.photos];
                            updatedPhotos[index] = '';
                            setNewMerchant({ ...newMerchant, photos: updatedPhotos });
                          }}
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            background: '#EF4444',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: 12,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          }}
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 8, color: '#94A3B8' }}>
                        <HiOutlinePhotograph style={{ fontSize: 32 }} />
                      </div>
                    )}

                    <label
                      htmlFor={`merchant-photo-input-${index}`}
                      className="btn btn-outline btn-sm"
                      style={{
                        fontSize: 11,
                        padding: '5px 8px',
                        cursor: 'pointer',
                        width: '100%',
                        justifyContent: 'center',
                        fontWeight: 600,
                      }}
                    >
                      📁 {photoUrl ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    <input
                      id={`merchant-photo-input-${index}`}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handlePhotoUpload(index, e.target.files[0])}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Merchant Video Upload Section */}
          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              🎥 Merchant Store Tour / Promo Video
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Upload video file (.mp4, .webm, .mov) directly from your device.
            </p>

            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label
                  htmlFor="merchant-video-input"
                  className={`btn ${isVideoUploading ? 'btn-outline' : 'btn-primary'}`}
                  style={{
                    fontSize: 13,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: isVideoUploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <HiOutlineVideoCamera style={{ fontSize: 20 }} />
                  {isVideoUploading
                    ? `Uploading (${videoUploadProgress}%)...`
                    : newMerchant.videoUrl
                      ? 'Change Video File'
                      : 'Select & Upload Video File'}
                </label>
                <input
                  id="merchant-video-input"
                  type="file"
                  accept="video/*"
                  disabled={isVideoUploading}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleVideoUpload(e.target.files[0]);
                    }
                  }}
                />

                {!isVideoUploading && newMerchant.videoUrl && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                    onClick={() => setNewMerchant({ ...newMerchant, videoUrl: '' })}
                  >
                    🗑️ Remove Video
                  </button>
                )}
              </div>

              {isVideoUploading && (
                <div style={{ marginTop: 14, padding: 14, background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>⏳</span>
                      <span>Uploading Video File...</span>
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 900, color: '#2563EB' }}>
                      {videoUploadProgress}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 10, background: '#DBEAFE', borderRadius: 5, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${videoUploadProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #2563EB, #3B82F6)',
                        borderRadius: 5,
                        transition: 'width 0.15s ease-out',
                      }}
                    />
                  </div>
                </div>
              )}

              {!isVideoUploading && newMerchant.videoUrl && (
                <div style={{ marginTop: 14, background: '#0F172A', padding: 10, borderRadius: 12, border: '1px solid #1E293B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, color: '#38BDF8', fontSize: 12, fontWeight: 700 }}>
                    <span>🎥 Video Ready for Upload</span>
                    <span style={{ background: '#0369A1', color: '#E0F2FE', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Uploaded</span>
                  </div>
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    key={newMerchant.videoUrl}
                    src={newMerchant.videoUrl}
                    style={{ width: '100%', maxHeight: 220, borderRadius: 8, display: 'block' }}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Merchant Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Merchant: ${editFormData.name || editFormData.business_name || ''}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleEditSubmit} disabled={isUpdating}>
              {isUpdating ? 'Updating Merchant...' : 'Update Merchant'}
            </button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit}>
          {editModalError && (
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
              <span>⚠️ {editModalError}</span>
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Merchant / Business Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Royal Solar Solutions"
                value={editFormData.name || editFormData.business_name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value, business_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Owner Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Owner / Contact Person"
                value={editFormData.owner_name || editFormData.owner}
                onChange={(e) => setEditFormData({ ...editFormData, owner_name: e.target.value, owner: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
              >
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option value="APPROVED">APPROVED (Active)</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="REJECTED">REJECTED (Inactive)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">📞 Mobile / Phone Contact</label>
            <input
              type="tel"
              className="form-input"
              placeholder="+91 98470 12345"
              value={editFormData.phone || editFormData.phone_number}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value, phone_number: e.target.value })}
            />
          </div>

          {/* Contact Details Section */}
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px', marginBottom: 16, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              📋 Contact Details
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaWhatsapp style={{ color: '#25D366' }} /> WhatsApp Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 98470 12345"
                  value={editFormData.whatsapp}
                  onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlinePhone style={{ color: '#475569' }} /> Landline Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="0497-2765432"
                  value={editFormData.landline}
                  onChange={(e) => setEditFormData({ ...editFormData, landline: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlineMail style={{ color: '#6C63FF' }} /> Business Email ID
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="contact@yourbusiness.com"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlineGlobe style={{ color: '#3B82F6' }} /> Website URL
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.yourbusiness.com"
                  value={editFormData.website}
                  onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Social Media Links Section */}
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px', marginBottom: 16, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔗 Social Media Links
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaFacebook style={{ color: '#1877F2' }} /> Facebook Page
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://facebook.com/yourbusiness"
                  value={editFormData.facebook}
                  onChange={(e) => setEditFormData({ ...editFormData, facebook: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaInstagram style={{ color: '#E1306C' }} /> Instagram Profile
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://instagram.com/yourbusiness"
                  value={editFormData.instagram}
                  onChange={(e) => setEditFormData({ ...editFormData, instagram: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaTwitter style={{ color: '#1DA1F2' }} /> Twitter / X Profile
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://twitter.com/yourbusiness"
                  value={editFormData.twitter}
                  onChange={(e) => setEditFormData({ ...editFormData, twitter: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaYoutube style={{ color: '#FF0000' }} /> YouTube Channel
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://youtube.com/@yourchannel"
                  value={editFormData.youtube}
                  onChange={(e) => setEditFormData({ ...editFormData, youtube: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="form-group">
            <label className="form-label">📍 Location Search & GPS Detect (Google Maps) *</label>
            <GoogleMapsLocationInput
              value={editFormData.address}
              onChange={(addr) => setEditFormData({ ...editFormData, address: addr })}
              onSelectLocation={(place) => {
                setEditFormData((prev) => ({
                  ...prev,
                  address: place.address,
                  city: place.city || place.name,
                  district: place.district,
                  state: place.state || prev.state,
                  latitude: place.latitude || place.lat || null,
                  longitude: place.longitude || place.lon || null,
                }));
              }}
              placeholder="Type place name or click 'GPS' button to get exact coordinates..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            {/* State Select */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>State *</label>
              <select
                className="form-select"
                value={editFormData.state || DEFAULT_STATE}
                onChange={(e) => {
                  const newSt = e.target.value;
                  const availableDistricts = getDistrictsForState(newSt);
                  const firstDist = availableDistricts[0] || '';
                  const availableCities = getCitiesForDistrict(newSt, firstDist);
                  const firstCity = availableCities[0] || '';
                  setEditFormData((prev) => ({
                    ...prev,
                    state: newSt,
                    district: firstDist,
                    city: firstCity,
                  }));
                }}
                required
              >
                {getStatesList().map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* District Select */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>District *</label>
              <select
                className="form-select"
                value={editFormData.district}
                onChange={(e) => {
                  const newDist = e.target.value;
                  const currentSt = editFormData.state || DEFAULT_STATE;
                  const availableCities = getCitiesForDistrict(currentSt, newDist);
                  const firstCity = availableCities[0] || '';
                  setEditFormData((prev) => ({
                    ...prev,
                    district: newDist,
                    city: firstCity,
                  }));
                }}
                required
              >
                {getDistrictsForState(editFormData.state || DEFAULT_STATE).map((d) => (
                  <option key={d} value={d}>{d} District</option>
                ))}
                {editFormData.district && !getDistrictsForState(editFormData.state || DEFAULT_STATE).includes(editFormData.district) && (
                  <option value={editFormData.district}>{editFormData.district}</option>
                )}
              </select>
            </div>

            {/* City / Town Select */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>City / Town *</label>
              <select
                className="form-select"
                value={editFormData.city}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, city: e.target.value }))}
                required
              >
                {getCitiesForDistrict(editFormData.state || DEFAULT_STATE, editFormData.district).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {editFormData.city && !getCitiesForDistrict(editFormData.state || DEFAULT_STATE, editFormData.district).includes(editFormData.city) && (
                  <option value={editFormData.city}>{editFormData.city}</option>
                )}
              </select>
            </div>
          </div>

          {/* Auto-updating Map Preview */}
          {(editFormData.city || editFormData.address || (editFormData.latitude && editFormData.longitude)) && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#15803D',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <span>📍 Location Auto-Mapped on Google Maps:</span>
                <strong style={{ fontFamily: 'monospace' }}>
                  {editFormData.latitude && editFormData.longitude
                    ? `${Number(editFormData.latitude).toFixed(6)}, ${Number(editFormData.longitude).toFixed(6)}`
                    : `${editFormData.city || ''}, ${editFormData.district || ''}, ${editFormData.state || ''}`}
                </strong>
                <a
                  href={`https://www.google.com/maps?q=${encodeURIComponent(
                    editFormData.latitude && editFormData.longitude
                      ? `${editFormData.latitude},${editFormData.longitude}`
                      : `${editFormData.city || ''}, ${editFormData.district || ''}, ${editFormData.state || ''}, India`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#15803D', fontSize: 11, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                >
                  Open Map ↗
                </a>
              </div>
              <iframe
                title="Edit Merchant Map Preview"
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: 10, marginTop: 4 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  editFormData.latitude && editFormData.longitude
                    ? `${editFormData.latitude},${editFormData.longitude}`
                    : `${editFormData.city || ''}, ${editFormData.district || ''}, ${editFormData.state || ''}, India`
                )}&hl=en&z=14&output=embed`}
              />
            </div>
          )}

          {/* 4 Photos Upload Section */}
          <div className="form-group" style={{ marginTop: 20 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              📷 Merchant Business Photos (Upload Up to 4 Photos)
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Upload image files directly from your device for Storefront, Interior, Products, and Services.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[0, 1, 2, 3].map((index) => {
                const photoUrl = editFormData.photos[index];
                const photoLabels = ['Storefront', 'Interior', 'Products', 'Services'];
                return (
                  <div
                    key={index}
                    style={{
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: 12,
                      padding: 10,
                      background: photoUrl ? '#F8FAFC' : '#FFFFFF',
                      textAlign: 'center',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 140,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                      Photo {index + 1}: {photoLabels[index]}
                    </span>

                    {photoUrl ? (
                      <div style={{ position: 'relative', width: '100%', height: 75, marginBottom: 8 }}>
                        <img
                          src={photoUrl}
                          alt={`Merchant Photo ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid #E2E8F0',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedPhotos = [...editFormData.photos];
                            updatedPhotos[index] = '';
                            setEditFormData({ ...editFormData, photos: updatedPhotos });
                          }}
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            background: '#EF4444',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: 12,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          }}
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 8, color: '#94A3B8' }}>
                        <HiOutlinePhotograph style={{ fontSize: 32 }} />
                      </div>
                    )}

                    <label
                      htmlFor={`edit-merchant-photo-input-${index}`}
                      className="btn btn-outline btn-sm"
                      style={{
                        fontSize: 11,
                        padding: '5px 8px',
                        cursor: 'pointer',
                        width: '100%',
                        justifyContent: 'center',
                        fontWeight: 600,
                      }}
                    >
                      📁 {photoUrl ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    <input
                      id={`edit-merchant-photo-input-${index}`}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleEditPhotoUpload(index, e.target.files[0])}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Merchant Video Upload Section */}
          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              🎥 Merchant Store Tour / Promo Video
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Upload video file (.mp4, .webm, .mov) directly from your device.
            </p>

            <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label
                  htmlFor="edit-merchant-video-input"
                  className={`btn ${isEditVideoUploading ? 'btn-outline' : 'btn-primary'}`}
                  style={{
                    fontSize: 13,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: isEditVideoUploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <HiOutlineVideoCamera style={{ fontSize: 20 }} />
                  {isEditVideoUploading
                    ? `Uploading (${editVideoUploadProgress}%)...`
                    : editFormData.videoUrl
                      ? 'Change Video File'
                      : 'Select & Upload Video File'}
                </label>
                <input
                  id="edit-merchant-video-input"
                  type="file"
                  accept="video/*"
                  disabled={isEditVideoUploading}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleEditVideoUpload(e.target.files[0]);
                    }
                  }}
                />

                {!isEditVideoUploading && editFormData.videoUrl && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                    onClick={() => setEditFormData({ ...editFormData, videoUrl: '' })}
                  >
                    🗑️ Remove Video
                  </button>
                )}
              </div>

              {isEditVideoUploading && (
                <div style={{ marginTop: 14, padding: 14, background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>⏳</span>
                      <span>Uploading Video File...</span>
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 900, color: '#2563EB' }}>
                      {editVideoUploadProgress}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 10, background: '#DBEAFE', borderRadius: 5, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${editVideoUploadProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #2563EB, #3B82F6)',
                        borderRadius: 5,
                        transition: 'width 0.15s ease-out',
                      }}
                    />
                  </div>
                </div>
              )}

              {!isEditVideoUploading && editFormData.videoUrl && (
                <div style={{ marginTop: 14, background: '#0F172A', padding: 10, borderRadius: 12, border: '1px solid #1E293B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, color: '#38BDF8', fontSize: 12, fontWeight: 700 }}>
                    <span>🎥 Video Ready</span>
                    <span style={{ background: '#0369A1', color: '#E0F2FE', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Uploaded</span>
                  </div>
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    key={editFormData.videoUrl}
                    src={editFormData.videoUrl}
                    style={{ width: '100%', maxHeight: 220, borderRadius: 8, display: 'block' }}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
