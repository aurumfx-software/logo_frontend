import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineClipboardCheck,
  HiOutlineOfficeBuilding,
  HiOutlineCollection,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSearch,
  HiOutlineBadgeCheck,
  HiOutlineArrowRight,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registrationRequests as initialRequests } from '../data/mockData';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState(initialRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');

  const handleApprove = (id, name) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    showToast(`Merchant "${name}" has been approved successfully!`);
  };

  const handleReject = (id, name) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
    showToast(`Merchant "${name}" registration was rejected.`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const filteredRequests = pendingRequests.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              background: '#6C63FF',
              color: 'white',
              padding: '14px 22px',
              borderRadius: 12,
              boxShadow: '0 10px 25px rgba(108, 99, 255, 0.35)',
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

      {/* Admin Operations Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
          borderRadius: 20,
          padding: '28px 32px',
          color: 'white',
          marginBottom: 28,
          boxShadow: '0 12px 30px rgba(5, 150, 105, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  background: 'rgba(255,255,255,0.2)',
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
                <HiOutlineShieldCheck size={16} /> Operational Admin Dashboard
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
              Merchant Approvals & Verification 👋
            </h1>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: 14 }}>
              Logged in as <strong>{user?.name || 'Administrator'}</strong> | Pending Registration Approvals: <strong>{pendingRequests.length}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/registration-requests')}
              style={{
                background: 'white',
                color: '#047857',
                border: 'none',
                padding: '12px 20px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
              }}
            >
              <HiOutlineClipboardCheck size={18} />
              Review All Registrations ({pendingRequests.length})
            </button>
            <button
              onClick={() => navigate('/merchants')}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '12px 20px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <HiOutlineOfficeBuilding size={18} />
              Manage Merchants
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          marginBottom: 28,
        }}
      >
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>Pending Approvals</span>
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
              <HiOutlineClipboardCheck size={22} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginTop: 10 }}>
            {pendingRequests.length}
          </div>
          <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 4 }}>Requires verification review</div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>Approved Recently</span>
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
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginTop: 10 }}>
            {approvedRequests.length + 18}
          </div>
          <div style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>Verified & live on platform</div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>Active Merchants</span>
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
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginTop: 10 }}>3,420</div>
          <div style={{ fontSize: 12, color: '#6C63FF', marginTop: 4 }}>Across all active cities</div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ padding: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>Active Categories</span>
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
              <HiOutlineCollection size={22} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginTop: 10 }}>8</div>
          <div style={{ fontSize: 12, color: '#3B82F6', marginTop: 4 }}>Category listings configured</div>
        </motion.div>
      </div>

      {/* Main Registration Queue Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div
          style={{
            padding: 20,
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ position: 'relative', minWidth: 280, flex: 1 }}>
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
              placeholder="Search merchant name, category, city..."
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
              }}
            />
          </div>
          <button
            onClick={() => navigate('/registration-requests')}
            style={{
              background: 'none',
              border: 'none',
              color: '#10B981',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            View Full Queue <HiOutlineArrowRight />
          </button>
        </div>

        <div className="table-responsive">
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>ID</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>MERCHANT NAME</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>CATEGORY</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>CITY</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>PHONE</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>DATE</th>
                <th style={{ padding: '14px 20px', fontSize: 12, fontWeight: 600, color: '#6B7280', textAlign: 'right' }}>ADMIN ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
                    No pending registration requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 13, color: '#6B7280' }}>{r.id}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1F2937', fontSize: 14 }}>{r.name}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ background: '#F3F4F6', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                        {r.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#4B5563' }}>{r.city}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#4B5563' }}>{r.phone}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6B7280' }}>{r.date}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleApprove(r.id, r.name)}
                          style={{
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <HiOutlineCheckCircle /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(r.id, r.name)}
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <HiOutlineXCircle /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
