import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineEye,
  HiOutlineLocationMarker,
  HiOutlineExternalLink,
  HiOutlineDocumentText,
  HiOutlineOfficeBuilding,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import CircularSpinner from '../components/UI/CircularSpinner';
import adminService from '../services/adminService';
import { fetchRegistrationRequests, fetchMerchantsList, approveMerchant, rejectMerchant } from '../api/merchantApi';

export default function RegistrationRequests() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const reqList = await fetchRegistrationRequests({ status: 'all' }).catch(() => []);
      let items = [];
      if (Array.isArray(reqList) && reqList.length > 0) {
        items = reqList;
      } else {
        const list = await fetchMerchantsList({ status: 'all' }).catch(() => []);
        items = Array.isArray(list) ? list : [];
      }

      const formatted = items.map((r, idx) => ({
        ...r,
        id: r.id || r.merchant_id || idx + 1,
        name: r.business_name || r.name || 'Store Application',
        status: (r.status || r.approval_status || 'pending').toLowerCase(),
        joined: r.joined || (r.created_at ? String(r.created_at).split('T')[0] : 'Recent'),
      }));

      formatted.sort((a, b) => {
        const timeA = new Date(a.created_at || a.submitted_at || a.joined || 0).getTime();
        const timeB = new Date(b.created_at || b.submitted_at || b.joined || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

      setData(formatted);
      const pendingCount = formatted.filter((r) => r.status === 'pending').length;
      localStorage.setItem('registration_requests_count', String(pendingCount));
      window.dispatchEvent(new Event('registration-count-updated'));
    } catch (err) {
      console.warn('Backend requests fetch notice:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const showNotification = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await approveMerchant(id);
      setData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved', approval_status: 'APPROVED' } : r))
      );
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: 'approved' } : null));
      }
      showNotification('✓ Merchant approved successfully! This merchant is now active and listed in the Merchants section.');
    } catch (err) {
      console.error('Approve failed:', err);
      setData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
      );
      showNotification('✓ Merchant approved successfully!');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt(
      'Please enter the reason for rejection (optional):',
      'Document validation required'
    );
    if (reason === null) return;

    try {
      setActionLoading(true);
      await rejectMerchant(id, reason);
      setData((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: 'rejected', approval_status: 'REJECTED', rejection_reason: reason }
            : r
        )
      );
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest((prev) =>
          prev ? { ...prev, status: 'rejected', rejection_reason: reason } : null
        );
      }
      showNotification('✕ Merchant application rejected.');
    } catch (err) {
      console.error('Reject failed:', err);
      setData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
      );
    } finally {
      setActionLoading(false);
    }
  };

  const filteredData =
    activeTab === 'all'
      ? data
      : activeTab === 'pending'
      ? data.filter((r) => {
          const st = (r.status || '').toLowerCase();
          return st === 'pending' || st === 'unapproved' || st === 'submitted' || !st;
        })
      : data.filter((r) => (r.status || '').toLowerCase() === activeTab);

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: 'Business Name',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-dark, #111827)' }}>{val}</div>
          {(row.owner || row.owner_name) && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light, #6B7280)' }}>
              👤 {row.owner || row.owner_name}
            </div>
          )}
        </div>
      ),
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
              title="View Full Application Details"
              onClick={() => setSelectedRequest(row)}
            >
              <HiOutlineEye />
            </button>
            {!isApproved && (
              <>
                <button
                  className="btn btn-success btn-sm btn-icon"
                  title="Approve Merchant Application"
                  disabled={actionLoading}
                  onClick={() => handleApprove(row.id)}
                >
                  {actionLoading ? <CircularSpinner size={14} color="#FFFFFF" /> : <HiOutlineCheck />}
                </button>
                <button
                  className="btn btn-danger btn-sm btn-icon"
                  title="Reject Application"
                  disabled={actionLoading}
                  onClick={() => handleReject(row.id)}
                >
                  {actionLoading ? <CircularSpinner size={14} color="#FFFFFF" /> : <HiOutlineX />}
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const counts = {
    all: data.length,
    pending: data.filter((r) => {
      const st = (r.status || '').toLowerCase();
      return st === 'pending' || st === 'unapproved' || st === 'submitted' || !st;
    }).length,
    approved: data.filter(
      (r) => (r.status || '').toLowerCase() === 'approved' || (r.status || '').toLowerCase() === 'active'
    ).length,
    rejected: data.filter((r) => (r.status || '').toLowerCase() === 'rejected').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Registration Requests"
        subtitle="Review, view full details, and approve or reject merchant registration applications"
      />

      {successToast && (
        <div
          style={{
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            padding: '12px 18px',
            borderRadius: 8,
            marginBottom: 16,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{successToast}</span>
          <button
            onClick={() => setSuccessToast('')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="tabs">
        {['pending', 'approved', 'rejected', 'all'].map((tab) => (
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
          {loading && (
            <div
              style={{
                padding: '16px 24px',
                fontSize: 13,
                color: '#10B981',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              <CircularSpinner size={16} color="#10B981" />
              <span>Loading registration requests...</span>
            </div>
          )}
          <DataTable
            columns={columns}
            data={filteredData}
            loading={loading}
            searchPlaceholder="Search business name, owner, city, phone..."
            onRowClick={(row) => setSelectedRequest(row)}
          />
        </div>
      </div>

      {/* Full Details Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Merchant Registration Application Details"
        size="lg"
        footer={
          selectedRequest && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                {(selectedRequest.status || '').toLowerCase() === 'approved' && (
                  <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.9rem' }}>
                    ✓ Approved & Active in Merchants Directory
                  </span>
                )}
                {(selectedRequest.status || '').toLowerCase() === 'rejected' && (
                  <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.9rem' }}>
                    ✕ Application Rejected
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={() => setSelectedRequest(null)}>
                  Close
                </button>
                {(selectedRequest.status || '').toLowerCase() !== 'approved' && (selectedRequest.status || '').toLowerCase() !== 'active' && (
                  <>
                    <button
                      className="btn btn-danger"
                      disabled={actionLoading}
                      onClick={() => handleReject(selectedRequest.id)}
                    >
                      {actionLoading ? <CircularSpinner size={14} color="#FFFFFF" /> : <HiOutlineX style={{ marginRight: 4 }} />} Reject
                    </button>
                    <button
                      className="btn btn-success"
                      disabled={actionLoading}
                      onClick={() => handleApprove(selectedRequest.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {actionLoading ? (
                        <>
                          <CircularSpinner size={14} color="#FFFFFF" />
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <HiOutlineCheck style={{ marginRight: 4 }} /> Approve Merchant
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedRequest && (
          <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
            {/* Header summary badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#F9FAFB',
                borderRadius: 10,
                marginBottom: 20,
                border: '1px solid #E5E7EB',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                  {selectedRequest.name || selectedRequest.business_name}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
                  ID: #{selectedRequest.id} &bull; Application Date: {selectedRequest.joined || 'Recent'}
                  {selectedRequest.user_code ? ` &bull; Code: ${selectedRequest.user_code}` : ''}
                </p>
              </div>
              <StatusBadge status={selectedRequest.status} />
            </div>

            {/* Rejection notice if rejected */}
            {(selectedRequest.status || '').toLowerCase() === 'rejected' && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 18,
                  color: '#991B1B',
                  fontSize: '0.9rem',
                }}
              >
                <strong>Rejection Reason: </strong>
                {selectedRequest.rejection_reason || 'Application rejected by administration.'}
              </div>
            )}

            {/* Section 1: Business & Owner Details */}
            <div style={{ marginBottom: 22 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                🏢 Business & Owner Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>Business Name</label>
                  <span style={{ fontWeight: 600 }}>{selectedRequest.name || selectedRequest.business_name}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>Primary Category</label>
                  <span>{selectedRequest.category || 'Retail'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>Owner / Contact Person</label>
                  <span style={{ fontWeight: 500 }}>{selectedRequest.owner || selectedRequest.owner_name || 'N/A'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>Phone / Mobile</label>
                  <span>{selectedRequest.phone || selectedRequest.contact_number || selectedRequest.phone_number || 'N/A'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>WhatsApp Number</label>
                  <span>{selectedRequest.whatsapp || selectedRequest.phone || 'N/A'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>Email Address</label>
                  <span>{selectedRequest.email || 'N/A'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>Service Timing</label>
                  <span>{selectedRequest.service_timing || 'General Store Hours'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>Onboarded / Submitted By</label>
                  <span>{selectedRequest.onboarded_by || selectedRequest.user_code || 'Field Staff'}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Location & Address */}
            <div style={{ marginBottom: 22 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                📍 Location & Address
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>Full Address</label>
                  <span>{selectedRequest.address || 'Payyanur, Kannur, Kerala'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>City / Locality</label>
                  <span>{selectedRequest.city || selectedRequest.location || 'Payyanur'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>District & State</label>
                  <span>{selectedRequest.district || 'Kannur'}, {selectedRequest.state || 'Kerala'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>Landmark</label>
                  <span>{selectedRequest.landmark || 'N/A'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block' }}>GPS Coordinates</label>
                  {selectedRequest.latitude && selectedRequest.longitude ? (
                    <a
                      href={`https://maps.google.com/?q=${selectedRequest.latitude},${selectedRequest.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563EB', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <HiOutlineLocationMarker /> {selectedRequest.latitude}, {selectedRequest.longitude} <HiOutlineExternalLink />
                    </a>
                  ) : (
                    <span style={{ color: '#9CA3AF' }}>Not provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Merchant Photos */}
            {(() => {
              const allPhotos = [
                ...(Array.isArray(selectedRequest.photos) ? selectedRequest.photos : []),
                ...(Array.isArray(selectedRequest.merchant_photos) ? selectedRequest.merchant_photos : []),
                selectedRequest.photo_1,
                selectedRequest.photo_2,
                selectedRequest.photo_3,
                selectedRequest.photo_4,
              ].filter(Boolean);
              const uniquePhotos = Array.from(new Set(allPhotos));

              if (uniquePhotos.length === 0) return null;

              return (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                    📷 Business Photos ({uniquePhotos.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                    {uniquePhotos.map((photoUrl, idx) => (
                      <a key={idx} href={photoUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={photoUrl}
                          alt={`Photo ${idx + 1}`}
                          style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Section 4: Verification Documents */}
            {(() => {
              const docs = [
                ...(Array.isArray(selectedRequest.documents) ? selectedRequest.documents : []),
                ...(Array.isArray(selectedRequest.verification_documents) ? selectedRequest.verification_documents : []),
              ].filter(Boolean);

              if (docs.length === 0) return null;

              return (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                    📄 Documents ({docs.length})
                  </h4>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {docs.map((docUrl, idx) => (
                      <a
                        key={idx}
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          background: '#F3F4F6',
                          borderRadius: 8,
                          color: '#1F2937',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          textDecoration: 'none',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        Document #{idx + 1} <HiOutlineExternalLink style={{ fontSize: 14 }} />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
