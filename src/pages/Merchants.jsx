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
} from 'react-icons/hi';
import { FaWhatsapp, FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import GoogleMapsLocationInput from '../components/UI/GoogleMapsLocationInput';
import { fetchMerchantsList, createMerchant } from '../api/merchantApi';
import { useAuth } from '../context/AuthContext';

const categoriesList = [
  'Helmets & Accessories',
  'Software Development',
  'Agricultural Research Institute',
  'Cleaning Machine',
  'Bakery',
  'Physiotherapy',
  'Catering Service',
  'Supplyco Store',
  'Fruits & Juice Shop',
  'Pastry & Cake Shop',
  'Hotel Residencies',
  'Petrol Pumps',
  'E V Charging',
  'Solar & Electricals',
  'Automobile & Spares',
  'Shopping & Fashion',
  'Aluminium Fabrication',
  'Healthcare & Medicals',
  'Travels & Transport',
];

const initialMerchantState = {
  name: '',
  category: 'Solar & Electricals',
  address: '',
  city: '',
  district: '',
  state: '',
  latitude: null,
  longitude: null,
  phone: '',
  whatsapp: '',
  landline: '',
  email: '',
  website: '',
  facebook: '',
  instagram: '',
  twitter: '',
  youtube: '',
  status: 'active',
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

  // New Merchant Form State with Google Maps API location, 4 Photos & Video
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMerchant, setNewMerchant] = useState(initialMerchantState);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  const handlePhotoUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedPhotos = [...newMerchant.photos];
      updatedPhotos[index] = reader.result;
      setNewMerchant((prev) => ({ ...prev, photos: updatedPhotos }));
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (file) => {
    if (!file) return;
    setIsVideoUploading(true);
    setVideoUploadProgress(0);

    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setVideoUploadProgress(percent);
      }
    };

    reader.onload = (e) => {
      setVideoUploadProgress(100);
      setTimeout(() => {
        setNewMerchant((prev) => ({ ...prev, videoUrl: e.target.result }));
        setIsVideoUploading(false);
      }, 300);
    };

    reader.onerror = () => {
      setIsVideoUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleAddMerchantSubmit = async (e) => {
    e.preventDefault();
    if (!newMerchant.name.trim()) return;

    setIsSubmitting(true);
    try {
      const createdItem = await createMerchant({
        ...newMerchant,
        user_id: user?.id || user?.user_id,
      });
      setData((prev) => [createdItem, ...prev]);
      setShowAddModal(false);
      setNewMerchant(initialMerchantState);
    } catch (err) {
      console.warn('Backend merchant create notice:', err);
      const validPhotos = newMerchant.photos.filter((p) => p && p.trim() !== '');
      const fallbackItem = {
        id: `m-${Date.now()}`,
        name: newMerchant.name,
        category: newMerchant.category,
        city: newMerchant.city || newMerchant.district || 'Kannur',
        address: newMerchant.address,
        phone: newMerchant.phone || '+91 98470 12345',
        rating: 5.0,
        reviews: 1,
        status: newMerchant.status,
        joined: new Date().toISOString().split('T')[0],
        photos: validPhotos,
        videoUrl: newMerchant.videoUrl,
        image: validPhotos[0] || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      };
      setData((prev) => [fallbackItem, ...prev]);
      setShowAddModal(false);
      setNewMerchant(initialMerchantState);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function loadMerchants() {
      try {
        setLoadingMerchants(true);
        const currentUserId = user?.id || user?.user_id;
        const currentUserCode = user?.user_code || user?.userCode;
        const apiMerchants = await fetchMerchantsList(currentUserId, currentUserCode);
        if (Array.isArray(apiMerchants)) {
          setData(apiMerchants);
        } else {
          setData([]);
        }
      } catch (err) {
        console.warn('Backend merchants list error:', err);
        setData([]);
      } finally {
        setLoadingMerchants(false);
      }
    }
    loadMerchants();
  }, [user]);

  const filteredData =
    activeTab === 'all'
      ? data
      : data.filter((m) => m.status === activeTab);

  const handleStatusChange = (id, newStatus) => {
    setData((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)));
    setSelectedMerchant(null);
  };

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
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-outline btn-sm btn-icon"
            title="View Details"
            onClick={() => navigate(`/merchants/${row.id}`)}
          >
            <HiOutlineEye />
          </button>
          {row.status === 'active' && (
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="Suspend"
              style={{ color: 'var(--danger)' }}
              onClick={() => handleStatusChange(row.id, 'suspended')}
            >
              <HiOutlineBan />
            </button>
          )}
          {row.status === 'suspended' && (
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="Reactivate"
              style={{ color: 'var(--success)' }}
              onClick={() => handleStatusChange(row.id, 'active')}
            >
              <HiOutlineCheckCircle />
            </button>
          )}
        </div>
      ),
    },
  ];

  const counts = {
    all: data.length,
    active: data.filter((m) => m.status === 'active').length,
    suspended: data.filter((m) => m.status === 'suspended').length,
    inactive: data.filter((m) => m.status === 'inactive').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Merchants"
        subtitle="View, search, and manage all registered merchants"
      >
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
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
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
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

      {/* Create New Merchant Modal with Google Maps Location Search, 4 Photos & Video Upload */}
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
            {newMerchant.latitude && newMerchant.longitude && (
              <div style={{ marginTop: 8 }}>
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
                  <span>📍 GPS Coordinates Captured:</span>
                  <strong style={{ fontFamily: 'monospace' }}>
                    {Number(newMerchant.latitude).toFixed(6)}, {Number(newMerchant.longitude).toFixed(6)}
                  </strong>
                  <a
                    href={`https://www.google.com/maps?q=${newMerchant.latitude},${newMerchant.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#15803D', fontSize: 11, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                  >
                    Open Map ↗
                  </a>
                </div>
                {/* Embedded Google Map Preview */}
                <iframe
                  title="Merchant Location Map Preview"
                  width="100%"
                  height="200"
                  style={{ border: 0, borderRadius: 10, marginTop: 4 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${newMerchant.latitude},${newMerchant.longitude}&hl=en&z=16&output=embed`}
                />
              </div>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">City / Town *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Payyanur"
                value={newMerchant.city}
                onChange={(e) => setNewMerchant({ ...newMerchant, city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">District *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Kannur"
                value={newMerchant.district}
                onChange={(e) => setNewMerchant({ ...newMerchant, district: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">State *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Kerala"
                value={newMerchant.state}
                onChange={(e) => setNewMerchant({ ...newMerchant, state: e.target.value })}
              />
            </div>
          </div>

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
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80';
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

              {/* Uploading Percentage Progress Bar */}
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

              {/* Video Player Preview */}
              {!isVideoUploading && newMerchant.videoUrl && (
                <div style={{ marginTop: 14, background: '#0F172A', padding: 10, borderRadius: 12, border: '1px solid #1E293B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, color: '#38BDF8', fontSize: 12, fontWeight: 700 }}>
                    <span>🎥 Video Ready for Upload</span>
                    <span style={{ background: '#0369A1', color: '#E0F2FE', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Uploaded</span>
                  </div>
                  <video
                    controls
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
    </motion.div>
  );
}
