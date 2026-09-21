import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineOfficeBuilding,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineExclamationCircle,
  HiOutlinePhotograph,
  HiOutlineBadgeCheck,
  HiOutlineX,
  HiOutlineTrendingUp,
  HiOutlineCalendar,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { fieldStaffStats, initialFieldMerchants, fieldStaffTimeline } from '../data/mockData';

export default function FieldStaffDashboard() {
  const { user } = useAuth();
  const [merchants, setMerchants] = useState(initialFieldMerchants);
  const [activeTab, setActiveTab] = useState('merchants'); // 'merchants' | 'activity' | 'earnings'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form state for adding merchant
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food & Dining',
    contactPerson: '',
    phone: '',
    email: '',
    city: 'Bangalore',
    address: '',
    commission: '500',
    notes: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMerchantSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.contactPerson.trim()) {
      alert('Please fill in Merchant Name, Contact Person, and Phone Number.');
      return;
    }

    const newMerchant = {
      id: `FSM-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      category: formData.category,
      contactPerson: formData.contactPerson,
      phone: formData.phone,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '')}@merchant.com`,
      city: formData.city,
      address: formData.address || 'Field Location Verified',
      dateAdded: new Date().toISOString().split('T')[0],
      status: 'pending',
      commission: parseInt(formData.commission) || 500,
      storePhoto: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500',
    };

    setMerchants([newMerchant, ...merchants]);
    setIsAddModalOpen(false);

    // Reset form
    setFormData({
      name: '',
      category: 'Food & Dining',
      contactPerson: '',
      phone: '',
      email: '',
      city: 'Bangalore',
      address: '',
      commission: '500',
      notes: '',
    });

    // Show toast
    setToastMessage(`Merchant "${newMerchant.name}" successfully submitted for verification!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filter merchants
  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalAdded = merchants.length;
  const approvedCount = merchants.filter((m) => m.status === 'approved').length;
  const pendingCount = merchants.filter((m) => m.status === 'pending').length;
  const actionCount = merchants.filter((m) => m.status === 'action_required').length;
  const totalEarned = merchants
    .filter((m) => m.status === 'approved')
    .reduce((acc, curr) => acc + curr.commission, 0);

  const targetProgress = Math.min(Math.round((totalAdded / fieldStaffStats.monthlyTarget) * 100), 100);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 80,
              right: 24,
              zIndex: 9999,
              background: '#10B981',
              color: 'white',
              padding: '14px 20px',
              borderRadius: 12,
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <HiOutlineBadgeCheck size={22} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Field Staff Welcome Header */}
      <div
        className="field-staff-banner"
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
          borderRadius: 20,
          color: 'white',
          marginBottom: 28,
          boxShadow: '0 12px 30px rgba(49, 46, 129, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            background: 'rgba(108, 99, 255, 0.15)',
            borderRadius: '50%',
            blur: 40,
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 8px #10B981',
                  }}
                />
                Field Officer Active
              </span>
              <span style={{ fontSize: 13, opacity: 0.8 }}>ID: {fieldStaffStats.staffId}</span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              Welcome back, {user?.name || 'Field Agent'} 👋
            </h1>
            <p style={{ margin: '6px 0 0 0', opacity: 0.85, fontSize: 14 }}>
              Assigned Region: <strong>{fieldStaffStats.zone}</strong> | Tier: <strong>{fieldStaffStats.tier}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #5A52D5 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 22px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(108, 99, 255, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <HiOutlinePlus size={20} />
              Add New Merchant
            </button>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div
          className="field-staff-target-row"
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span>Monthly Onboarding Target ({totalAdded}/{fieldStaffStats.monthlyTarget} Merchants)</span>
              <span style={{ fontWeight: 700, color: '#A5B4FC' }}>{targetProgress}% Completed</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 10, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${targetProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #10B981, #34D399)',
                  borderRadius: 10,
                }}
              />
            </div>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 12,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <HiOutlineSparkles style={{ color: '#FBBF24' }} />
            <span>Bonus Unlocks at 30 Merchants!</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="field-staff-kpi-grid">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>Total Onboarded</span>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(108, 99, 255, 0.1)',
                color: '#6C63FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HiOutlineOfficeBuilding size={22} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginTop: 10 }}>{totalAdded}</div>
          <div style={{ fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <HiOutlineTrendingUp />
            <span>+4 onboarded this week</span>
          </div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>Approved & Live</span>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HiOutlineCheckCircle size={22} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginTop: 10 }}>{approvedCount}</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>Verified by Super Admin</div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>Pending Verification</span>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HiOutlineClock size={22} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginTop: 10 }}>{pendingCount}</div>
          <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 4 }}>Under admin review</div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>Total Earnings</span>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HiOutlineCurrencyRupee size={22} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginTop: 10 }}>
            ₹{totalEarned.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#3B82F6', marginTop: 4 }}>Incentive payout ready</div>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <div className="card" style={{ marginBottom: 24, padding: 12 }}>
        <div className="field-staff-tabs-wrapper">
          <button
            onClick={() => setActiveTab('merchants')}
            className={`field-staff-tab-btn ${activeTab === 'merchants' ? 'active' : ''}`}
          >
            <HiOutlineOfficeBuilding size={18} style={{ flexShrink: 0 }} />
            <span>My Onboarded Merchants ({merchants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`field-staff-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          >
            <HiOutlineCalendar size={18} style={{ flexShrink: 0 }} />
            <span>Daily Visit Log</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Onboarded Merchants List */}
      {activeTab === 'merchants' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          {/* Controls Bar */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: 220, flex: 1, width: '100%' }}>
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
                placeholder="Search merchant name, owner, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  borderRadius: 10,
                  border: '1px solid #E5E7EB',
                  fontSize: 14,
                  outline: 'none',
                  background: '#F9FAFB',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  background: statusFilter === 'all' ? '#1E1B4B' : 'white',
                  color: statusFilter === 'all' ? 'white' : '#4B5563',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                All ({totalAdded})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  background: statusFilter === 'approved' ? '#10B981' : 'white',
                  color: statusFilter === 'approved' ? 'white' : '#4B5563',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Approved ({approvedCount})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  background: statusFilter === 'pending' ? '#F59E0B' : 'white',
                  color: statusFilter === 'pending' ? 'white' : '#4B5563',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Pending ({pendingCount})
              </button>
              {actionCount > 0 && (
                <button
                  onClick={() => setStatusFilter('action_required')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    background: statusFilter === 'action_required' ? '#EF4444' : 'white',
                    color: statusFilter === 'action_required' ? 'white' : '#4B5563',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Action Needed ({actionCount})
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table" style={{ width: '100%', minWidth: 920, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap', minWidth: 240 }}>MERCHANT / BUSINESS</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap', minWidth: 140 }}>CATEGORY</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap', minWidth: 160 }}>OWNER CONTACT</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap', minWidth: 120 }}>DATE ADDED</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap', minWidth: 140 }}>STATUS</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap', minWidth: 100 }}>INCENTIVE</th>
                  <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280', textAlign: 'right', whiteSpace: 'nowrap', minWidth: 110 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredMerchants.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
                      No merchants found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredMerchants.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px 20px', minWidth: 240 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={m.storePhoto}
                            alt={m.name}
                            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: '#1F2937', fontSize: 14, whiteSpace: 'nowrap' }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                              <HiOutlineLocationMarker size={14} style={{ flexShrink: 0 }} />
                              {m.address}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            background: '#F3F4F6',
                            color: '#374151',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.category}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: '#1F2937' }}>{m.contactPerson}</div>
                        <div style={{ fontSize: 12, color: '#6C63FF', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <HiOutlinePhone size={14} style={{ flexShrink: 0 }} />
                          {m.phone}
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#4B5563', whiteSpace: 'nowrap' }}>{m.dateAdded}</td>

                      <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                        {m.status === 'approved' && (
                          <span
                            style={{
                              background: '#D1FAE5',
                              color: '#065F46',
                              padding: '4px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <HiOutlineCheckCircle /> Approved
                          </span>
                        )}
                        {m.status === 'pending' && (
                          <span
                            style={{
                              background: '#FEF3C7',
                              color: '#92400E',
                              padding: '4px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <HiOutlineClock /> Pending Review
                          </span>
                        )}
                        {m.status === 'action_required' && (
                          <span
                            style={{
                              background: '#FEE2E2',
                              color: '#991B1B',
                              padding: '4px 10px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <HiOutlineExclamationCircle /> Action Needed
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#10B981', fontSize: 14, whiteSpace: 'nowrap' }}>
                        ₹{m.commission}
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => alert(`Contacting ${m.contactPerson} at ${m.phone}`)}
                          style={{
                            background: '#F3F4F6',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#4B5563',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Call Owner
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Activity Timeline */}
      {activeTab === 'activity' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Field Activity Log & Check-ins</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {fieldStaffTimeline.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1, background: '#F9FAFB', padding: 16, borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{item.title}</h4>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{item.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#4B5563' }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modal: Add New Merchant */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 12px',
              overflowY: 'auto',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'white',
                borderRadius: 20,
                width: '100%',
                maxWidth: 640,
                maxHeight: 'calc(100vh - 32px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Modal Header (Pinned at top) */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#1E1B4B',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HiOutlineOfficeBuilding size={24} style={{ color: '#A5B4FC', flexShrink: 0 }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Register New Merchant</h3>
                    <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>Field Staff Onboarding Form</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: 22,
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HiOutlineX />
                </button>
              </div>

              {/* Form Content (Scrolls cleanly) */}
              <form onSubmit={handleAddMerchantSubmit} style={{ padding: '20px 20px 16px', overflowY: 'auto', flex: 1 }}>
                <div className="form-grid-responsive" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Business / Shop Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Royal Grand Bakery"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option>Food & Dining</option>
                      <option>Shopping</option>
                      <option>Health & Wellness</option>
                      <option>Services</option>
                      <option>Education</option>
                      <option>Banking & Finance</option>
                      <option>Travel & Transport</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-responsive" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Owner / Contact Person *
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-grid-responsive" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Email Address (Optional)</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="owner@business.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">City / Region</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option>Bangalore</option>
                      <option>Mumbai</option>
                      <option>Delhi</option>
                      <option>Chennai</option>
                      <option>Hyderabad</option>
                      <option>Pune</option>
                      <option>Kochi</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Shop Address & Landmark</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Shop #12, 100ft Road, Near Metro Station"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                {/* Photo Simulation */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Shop Front Photo & Verification Document</label>
                  <div
                    style={{
                      border: '2px dashed #E5E7EB',
                      borderRadius: 12,
                      padding: '16px',
                      textAlign: 'center',
                      background: '#F9FAFB',
                      cursor: 'pointer',
                    }}
                  >
                    <HiOutlinePhotograph size={30} style={{ color: '#9CA3AF', marginBottom: 4 }} />
                    <p style={{ margin: 0, fontSize: 13, color: '#4B5563', fontWeight: 500 }}>
                      Click to capture shop photo or attach document
                    </p>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>Supports JPG, PNG (Auto geotagged)</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="modal-footer-buttons" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '1px solid #E5E7EB',
                      background: 'white',
                      fontWeight: 600,
                      color: '#4B5563',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 22px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #6C63FF 0%, #5A52D5 100%)',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 14px rgba(108, 99, 255, 0.4)',
                    }}
                  >
                    Submit Merchant
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
