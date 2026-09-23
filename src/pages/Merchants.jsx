import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineEye,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlinePlus,
  HiOutlineLocationMarker,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import GoogleMapsLocationInput from '../components/UI/GoogleMapsLocationInput';
import { fetchMerchantsList } from '../api/merchantApi';

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

export default function Merchants() {
  const [activeTab, setActiveTab] = useState('all');
  const [data, setData] = useState([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  // New Merchant Form State with Google Maps API location
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMerchant, setNewMerchant] = useState({
    name: '',
    category: 'Solar & Electricals',
    address: '',
    city: '',
    district: '',
    phone: '',
    status: 'active',
  });

  const handleAddMerchantSubmit = (e) => {
    e.preventDefault();
    if (!newMerchant.name.trim()) return;

    const createdItem = {
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
    };

    setData((prev) => [createdItem, ...prev]);
    setShowAddModal(false);
    setNewMerchant({
      name: '',
      category: 'Solar & Electricals',
      address: '',
      city: '',
      district: '',
      phone: '',
      status: 'active',
    });
  };

  useEffect(() => {
    async function loadMerchants() {
      try {
        setLoadingMerchants(true);
        const apiMerchants = await fetchMerchantsList();
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
  }, []);

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
            title="View"
            onClick={() => setSelectedMerchant(row)}
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
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 22,
                }}
              >
                {selectedMerchant.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>{selectedMerchant.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
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
                <p style={{ fontWeight: 600 }}>⭐ {selectedMerchant.rating} ({selectedMerchant.reviews} reviews)</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Joined</label>
                <p>{selectedMerchant.joined}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Merchant ID</label>
                <p style={{ fontFamily: 'monospace' }}>{selectedMerchant.id}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create New Merchant Modal with Google Maps Location Search & Category Picker */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Merchant"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddMerchantSubmit}>Save Merchant</button>
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
              <label className="form-label">Phone Contact</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 98470 12345"
                value={newMerchant.phone}
                onChange={(e) => setNewMerchant({ ...newMerchant, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location Search (Google Maps Autocomplete) *</label>
            <GoogleMapsLocationInput
              value={newMerchant.address}
              onChange={(addr) => setNewMerchant({ ...newMerchant, address: addr })}
              onSelectLocation={(place) => {
                setNewMerchant((prev) => ({
                  ...prev,
                  address: place.address,
                  city: place.city || place.name,
                  district: place.district,
                }));
              }}
              placeholder="Type place name or address to search Google Maps (e.g. Payyanur, Kannur, Kochi)..."
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Autofilled City / Town</label>
              <input
                type="text"
                className="form-input"
                placeholder="City"
                value={newMerchant.city}
                onChange={(e) => setNewMerchant({ ...newMerchant, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Autofilled District</label>
              <input
                type="text"
                className="form-input"
                placeholder="District"
                value={newMerchant.district}
                onChange={(e) => setNewMerchant({ ...newMerchant, district: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
