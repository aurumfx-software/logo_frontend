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
import adminService from '../services/adminService';
import { fetchMerchantsList, approveMerchant, rejectMerchant } from '../api/merchantApi';

export default function RegistrationRequests() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const reqList = await adminService.getRegistrationRequests({ status: 'all' });
      let items = [];
      if (Array.isArray(reqList) && reqList.length > 0) {
        items = reqList;
      } else {
        const list = await fetchMerchantsList({ status: 'all' });
        items = Array.isArray(list) ? list : [];
      }

      // Format & ensure sorted newest first (avasanam create cheyytha merchant listinte athyam varanam)
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
    } catch (err) {
      console.warn('Backend requests fetch notice:', err);
      const list = await fetchMerchantsList({ status: 'all' }).catch(() => []);
      const formatted = (Array.isArray(list) ? list : []).map((r, idx) => ({
        ...r,
        id: r.id || r.merchant_id || idx + 1,
        name: r.business_name || r.name || 'Store Application',
        status: (r.status || r.approval_status || 'pending').toLowerCase(),
        joined: r.joined || 'Recent',
      }));
      setData(formatted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const showNotification = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await adminService.approveRegistration(id).catch(() => approveMerchant(id));
      setData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved', approval_status: 'APPROVED' } : r))
      );
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest((prev) => (prev ? { ...prev, status: 'approved' } : null));
      }
      showNotification('✓ Merchant approved successfully! This merchant is now active and listed in the Merchants section.');
    } catch (err) {
      console.error('Approve failed:', err);
      alert(err.message || 'Failed to approve merchant');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt(
      'Please enter the reason for rejection (optional):',
      'Document validation required'
    );
    if (reason === null) return; // user cancelled

    try {
      setActionLoading(true);
      await adminService.rejectRegistration(id, reason).catch(() => rejectMerchant(id, reason));
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
      alert(err.message || 'Failed to reject merchant');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredData =
    activeTab === 'all'
      ? data
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
    {
      key: 'city',
      label: 'City & District',
      render: (val, row) => (
        <span>
          {val || row.location || 'Payyanur'} {row.district ? `(${row.district})` : ''}
        </span>
      ),
    },
    { key: 'joined', label: 'Application Date' },
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
        const isPending = (row.status || '').toLowerCase() === 'pending';
        return (
          <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="View Full Details"
              onClick={() => setSelectedRequest(row)}
            >
              <HiOutlineEye />
            </button>
            {isPending && (
              <>
                <button
                  className="btn btn-success btn-sm btn-icon"
                  title="Approve Merchant"
                  disabled={actionLoading}
                  onClick={() => handleApprove(row.id)}
                >
                  <HiOutlineCheck />
                </button>
                <button
                  className="btn btn-danger btn-sm btn-icon"
                  title="Reject Merchant"
                  disabled={actionLoading}
                  onClick={() => handleReject(row.id)}
                >
                  <HiOutlineX />
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
    pending: data.filter((r) => (r.status || '').toLowerCase() === 'pending').length,
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
              <span>🔄 Loading registration requests...</span>
            </div>
          )}
          <DataTable
            columns={columns}
            data={filteredData}
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
                {(selectedRequest.status || '').toLowerCase() === 'pending' && (
                  <>
                    <button
                      className="btn btn-danger"
                      disabled={actionLoading}
                      onClick={() => handleReject(selectedRequest.id)}
                    >
                      <HiOutlineX style={{ marginRight: 4 }} /> Reject
                    </button>
                    <button
                      className="btn btn-success"
                      disabled={actionLoading}
                      onClick={() => handleApprove(selectedRequest.id)}
                    >
                      <HiOutlineCheck style={{ marginRight: 4 }} /> Approve Merchant
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
                      style={{ color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'underline' }}
                    >
                      <HiOutlineLocationMarker /> {selectedRequest.latitude}, {selectedRequest.longitude} <HiOutlineExternalLink />
                    </a>
                  ) : (
                    <span style={{ color: '#9CA3AF' }}>Not mapped</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Services & Description */}
            {(selectedRequest.about || (selectedRequest.services && selectedRequest.services.length > 0)) && (
              <div style={{ marginBottom: 22 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                  📝 Services & About
                </h4>
                {selectedRequest.about && (
                  <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 10px' }}>
                    {selectedRequest.about}
                  </p>
                )}
                {Array.isArray(selectedRequest.services) && selectedRequest.services.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {selectedRequest.services.map((svc, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '3px 10px',
                          borderRadius: 16,
                          fontSize: '0.8rem',
                          fontWeight: 500,
                        }}
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section 4: Uploaded Photos */}
            {(() => {
              const allPhotos = [
                ...(selectedRequest.photos || []),
                ...(selectedRequest.merchant_photos || []),
                selectedRequest.photo_1,
                selectedRequest.photo_2,
                selectedRequest.photo_3,
                selectedRequest.photo_4,
              ].filter(Boolean);
              const uniquePhotos = Array.from(new Set(allPhotos));

              if (uniquePhotos.length === 0) return null;

              return (
                <div style={{ marginBottom: 22 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                    📷 Shop Front & Gallery Photos ({uniquePhotos.length})
                  </h4>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {uniquePhotos.map((photoUrl, idx) => (
                      <a key={idx} href={photoUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={photoUrl}
                          alt={`Photo ${idx + 1}`}
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid #E5E7EB',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Section 5: Verification Documents */}
            {(() => {
              const docs = [
                ...(selectedRequest.documents || []),
                ...(selectedRequest.verification_documents || []),
              ].filter(Boolean);

              if (docs.length === 0) return null;

              return (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                    📄 Verification Documents ({docs.length})
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
                          padding: '8px 14px',
                          background: '#F3F4F6',
                          borderRadius: 8,
                          color: '#1F2937',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          textDecoration: 'none',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        <HiOutlineDocumentText style={{ fontSize: 18, color: '#4B5563' }} />
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
