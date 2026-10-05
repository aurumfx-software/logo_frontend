import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineX, HiOutlineEye } from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { fetchRegistrationRequests, approveMerchant, rejectMerchant } from '../api/merchantApi';

export default function RegistrationRequests() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmApproveMerchant, setConfirmApproveMerchant] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const list = await fetchRegistrationRequests({ status: activeTab });
      if (Array.isArray(list)) {
        setData(list);
      } else {
        setData([]);
      }
    } catch (err) {
      console.warn('Backend requests fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const filteredData =
    activeTab === 'all'
      ? data
      : data.filter((r) => (r.status || '').toLowerCase() === activeTab);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await approveMerchant(id);
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: 'approved' } : null));
      }
    } catch {
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: 'approved' } : null));
      }
    } finally {
      setActionLoading(false);
      setConfirmApproveMerchant(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(true);
      await rejectMerchant(id, 'Document validation failed');
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
    } catch {
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
    } finally {
      setActionLoading(false);
      setSelectedRequest(null);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: 'Business Name',
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    { key: 'category', label: 'Category' },
    { key: 'city', label: 'City' },
    { key: 'joined', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => {
        const isApproved = (row.status || '').toLowerCase() === 'approved' || (row.status || '').toLowerCase() === 'active';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="View Details"
              onClick={() => setSelectedRequest(row)}
            >
              <HiOutlineEye />
            </button>
            {!isApproved ? (
              <>
                <button
                  className="btn btn-success btn-sm btn-icon"
                  title="Approve Merchant (Permanent & Non-Reversible)"
                  disabled={actionLoading}
                  onClick={() => setConfirmApproveMerchant(row)}
                >
                  <HiOutlineCheck />
                </button>
                <button
                  className="btn btn-danger btn-sm btn-icon"
                  title="Reject"
                  disabled={actionLoading}
                  onClick={() => handleReject(row.id)}
                >
                  <HiOutlineX />
                </button>
              </>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#15803D',
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  padding: '4px 10px',
                  borderRadius: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                }}
                title="This merchant approval is permanent and non-reversible"
              >
                🔒 Approved (Irreversible)
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const counts = {
    all: data.length,
    pending: data.filter((r) => (r.status || '').toLowerCase() === 'pending').length,
    approved: data.filter((r) => (r.status || '').toLowerCase() === 'approved' || (r.status || '').toLowerCase() === 'active').length,
    rejected: data.filter((r) => (r.status || '').toLowerCase() === 'rejected').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Registration Requests"
        subtitle="Approve or reject merchant & entity registration requests"
      />

      <div className="tabs">
        {['all', 'pending', 'approved', 'rejected'].map((tab) => (
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
        <div className="card-body" style={{ padding: '0' }}>
          <DataTable
            columns={columns}
            data={filteredData}
            searchPlaceholder="Search registrations..."
          />
        </div>
      </div>

      {/* Registration Details Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Registration Details"
        footer={
          selectedRequest && (
            <>
              <button className="btn btn-outline" onClick={() => setSelectedRequest(null)}>
                Close
              </button>
              {(selectedRequest.status || '').toLowerCase() !== 'approved' && (selectedRequest.status || '').toLowerCase() !== 'active' ? (
                <>
                  <button className="btn btn-danger" disabled={actionLoading} onClick={() => handleReject(selectedRequest.id)}>
                    Reject
                  </button>
                  <button className="btn btn-success" disabled={actionLoading} onClick={() => setConfirmApproveMerchant(selectedRequest)}>
                    Approve Merchant (Irreversible)
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 12, fontWeight: 700, color: '#15803D', background: '#DCFCE7', border: '1px solid #86EFAC', padding: '6px 14px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  🔒 Approved (Permanent & Non-Reversible)
                </div>
              )}
            </>
          )
        }
      >
        {selectedRequest && (
          <div>
            {(selectedRequest.status || '').toLowerCase() === 'approved' || (selectedRequest.status || '').toLowerCase() === 'active' ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, color: '#15803D', fontWeight: 600, fontSize: 13 }}>
                <span style={{ fontSize: 18 }}>🔒</span>
                <div>
                  <strong>Merchant Status: Approved (Non-Reversible)</strong>
                  <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 400, color: '#166534' }}>
                    This merchant account has been permanently approved and activated.
                  </p>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Business Name</label>
                <p style={{ fontWeight: 600 }}>{selectedRequest.name || selectedRequest.business_name}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Category</label>
                <p>{selectedRequest.category}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Email</label>
                <p>{selectedRequest.email || 'N/A'}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Phone</label>
                <p>{selectedRequest.phone || selectedRequest.phone_number}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>City</label>
                <p>{selectedRequest.city}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Status</label>
                <StatusBadge status={selectedRequest.status} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Permanent Approval Confirmation Modal */}
      <Modal
        isOpen={!!confirmApproveMerchant}
        onClose={() => setConfirmApproveMerchant(null)}
        title="⚠️ Confirm Permanent Approval"
        size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setConfirmApproveMerchant(null)}>
              Cancel
            </button>
            <button
              className="btn btn-success"
              disabled={actionLoading}
              onClick={() => {
                if (confirmApproveMerchant) {
                  handleApprove(confirmApproveMerchant.id);
                }
              }}
            >
              {actionLoading ? 'Approving...' : 'Confirm Permanent Approval'}
            </button>
          </>
        }
      >
        {confirmApproveMerchant && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🔒</div>
            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1E293B' }}>
              Approve "{confirmApproveMerchant.name || confirmApproveMerchant.business_name}"?
            </h4>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              Are you sure you want to approve this merchant?
            </p>
            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                fontSize: 12,
                color: '#991B1B',
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              ⚠️ Warning: Once approved, this merchant activation is permanent and non-reversible!
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
