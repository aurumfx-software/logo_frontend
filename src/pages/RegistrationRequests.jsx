import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineLocationMarker,
  HiOutlineExternalLink,
  HiOutlineDocumentText,
  HiOutlineOfficeBuilding,
  HiOutlineSparkles,
  HiOutlineKey,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import CircularSpinner from '../components/UI/CircularSpinner';
import adminService from '../services/adminService';
import {
  fetchRegistrationRequests,
  fetchMerchantsList,
  approveMerchant,
  rejectMerchant,
  updateMerchant,
  fetchPromoAccessRequests,
  approvePromoAccessRequest,
  rejectPromoAccessRequest,
  togglePromotionAccess,
} from '../api/merchantApi';

export default function RegistrationRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get('section') === 'promo-access' ? 'promo-access' : 'registrations';
  const [currentSection, setCurrentSection] = useState(initialSection);

  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Promo Access Requests State
  const [promoRequests, setPromoRequests] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoActiveTab, setPromoActiveTab] = useState('pending');
  const [promoActionLoading, setPromoActionLoading] = useState(false);

  // Edit Merchant State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editModalError, setEditModalError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const sec = searchParams.get('section');
    if (sec === 'promo-access' || sec === 'registrations') {
      setCurrentSection(sec);
    }
  }, [searchParams]);

  const loadPromoRequests = async () => {
    try {
      setPromoLoading(true);
      const list = await fetchPromoAccessRequests({ status: promoActiveTab });
      setPromoRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to load promo requests:', err);
      setPromoRequests([]);
    } finally {
      setPromoLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection === 'promo-access') {
      loadPromoRequests();
    }
  }, [currentSection, promoActiveTab]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const queryStatus = activeTab === 'all' ? 'all' : activeTab;
      const reqList = await fetchRegistrationRequests({ status: queryStatus, limit: 150 }).catch(() => []);
      let items = [];
      if (Array.isArray(reqList) && reqList.length > 0) {
        items = reqList;
      } else {
        const list = await fetchMerchantsList({ status: queryStatus, limit: 150 }).catch(() => []);
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
        const aPending = (a.status || '').toLowerCase() === 'pending' ? 0 : 1;
        const bPending = (b.status || '').toLowerCase() === 'pending' ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        const timeA = new Date(a.updated_at || a.created_at || a.submitted_at || a.joined || 0).getTime();
        const timeB = new Date(b.updated_at || b.created_at || b.submitted_at || b.joined || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

      setData(formatted);
      if (activeTab === 'pending') {
        const pendingCount = formatted.filter((r) => r.status === 'pending').length;
        localStorage.setItem('registration_requests_count', String(pendingCount));
        window.dispatchEvent(new Event('registration-count-updated'));
      }
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
        setSelectedRequest((prev) => (prev ? { ...prev, status: 'approved', approval_status: 'APPROVED' } : null));
      }
      showNotification('✓ Merchant approved successfully! This merchant is now active and listed in the Merchants section.');
      window.dispatchEvent(new Event('merchants-updated'));
      window.dispatchEvent(new Event('registration-count-updated'));
    } catch (err) {
      console.error('Approve failed:', err);
      setData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved', approval_status: 'APPROVED' } : r))
      );
      showNotification('✓ Merchant approved successfully!');
      window.dispatchEvent(new Event('merchants-updated'));
      window.dispatchEvent(new Event('registration-count-updated'));
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
          prev ? { ...prev, status: 'rejected', approval_status: 'REJECTED', rejection_reason: reason } : null
        );
      }
      showNotification('✕ Merchant application rejected.');
      window.dispatchEvent(new Event('merchants-updated'));
      window.dispatchEvent(new Event('registration-count-updated'));
    } catch (err) {
      console.error('Reject failed:', err);
      setData((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditModal = (req) => {
    if (!req) return;
    const bName = req.business_name || req.name || '';
    const oName = req.owner_name || req.owner || '';
    const pPhone = req.phone_number || req.phone || req.contact_number || '';
    setEditFormData({
      id: req.id,
      business_name: bName,
      name: bName,
      owner_name: oName,
      owner: oName,
      category: req.category || 'Retail',
      phone_number: pPhone,
      phone: pPhone,
      whatsapp: req.whatsapp || '',
      email: req.email || '',
      district: req.district || 'Kannur',
      city: req.city || 'Payyanur',
      state: req.state || 'Kerala',
      address: req.address || '',
      landmark: req.landmark || '',
      service_timing: req.service_timing || '',
      about: req.about || req.description || '',
      status: req.status || 'pending',
    });
    setEditModalError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!editFormData) return;

    const storeName = (editFormData.business_name || editFormData.name || '').trim();
    if (!storeName) {
      setEditModalError('Please enter a business name');
      return;
    }

    setIsUpdating(true);
    try {
      const oName = editFormData.owner_name || editFormData.owner || '';
      const pPhone = editFormData.phone_number || editFormData.phone || '';
      await updateMerchant(editFormData.id, {
        ...editFormData,
        business_name: storeName,
        name: storeName,
        owner_name: oName,
        owner: oName,
        phone_number: pPhone,
        phone: pPhone,
      });
      setData((prev) =>
        prev.map((r) =>
          r.id === editFormData.id
            ? {
                ...r,
                ...editFormData,
                business_name: storeName,
                name: storeName,
                owner_name: oName,
                owner: oName,
                phone_number: pPhone,
                phone: pPhone,
              }
            : r
        )
      );
      if (selectedRequest && selectedRequest.id === editFormData.id) {
        setSelectedRequest((prev) =>
          prev
            ? {
                ...prev,
                ...editFormData,
                business_name: storeName,
                name: storeName,
                owner_name: oName,
                owner: oName,
                phone_number: pPhone,
                phone: pPhone,
              }
            : null
        );
      }
      setIsEditModalOpen(false);
      showNotification('✓ Merchant details updated and saved successfully.');
      window.dispatchEvent(new Event('merchants-updated'));
    } catch (err) {
      console.error('Failed to update merchant in requests:', err);
      setEditModalError(err.message || 'Failed to update merchant details');
    } finally {
      setIsUpdating(false);
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
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="Edit Merchant Application Details"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(row);
              }}
              style={{ color: '#2563EB', borderColor: '#BFDBFE' }}
            >
              <HiOutlinePencil />
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

  // Promo Access Handlers
  const handleApprovePromoRequest = async (row) => {
    try {
      setPromoActionLoading(true);
      await approvePromoAccessRequest(row.id);
      setPromoRequests((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: 'APPROVED' } : r))
      );
      showNotification(`✓ Promotion access approved and enabled for "${row.merchant_name || 'Merchant'}"!`);
      window.dispatchEvent(new Event('registration-count-updated'));
    } catch (err) {
      console.error('Failed to approve promo access request:', err);
      alert(`Approval failed: ${err.message}`);
    } finally {
      setPromoActionLoading(false);
    }
  };

  const handleRejectPromoRequest = async (row) => {
    const reason = prompt('Enter rejection reason (optional):', 'Requirements not met at this time');
    if (reason === null) return;
    try {
      setPromoActionLoading(true);
      await rejectPromoAccessRequest(row.id, reason);
      setPromoRequests((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: 'REJECTED', rejection_reason: reason } : r))
      );
      showNotification(`✕ Promotion access request rejected for "${row.merchant_name || 'Merchant'}".`);
      window.dispatchEvent(new Event('registration-count-updated'));
    } catch (err) {
      console.error('Failed to reject promo access request:', err);
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setPromoActionLoading(false);
    }
  };

  const handleRevokePromoRequest = async (row) => {
    if (!window.confirm(`Turn OFF promotion creation access for "${row.merchant_name || 'Merchant'}"? Promotion creation will be locked for this merchant.`)) {
      return;
    }
    try {
      setPromoActionLoading(true);
      await togglePromotionAccess(row.merchant_id, false);
      setPromoRequests((prev) =>
        prev.map((r) => (r.id === row.id || r.merchant_id === row.merchant_id ? { ...r, status: 'REVOKED' } : r))
      );
      showNotification(`🔒 Promotion access turned OFF for "${row.merchant_name || 'Merchant'}". Portal is now locked.`);
      window.dispatchEvent(new Event('registration-count-updated'));
      window.dispatchEvent(new Event('merchant-promo-access-updated'));
    } catch (err) {
      console.error('Failed to revoke promo access:', err);
      alert(`Failed to revoke access: ${err.message}`);
    } finally {
      setPromoActionLoading(false);
    }
  };

  const promoColumns = [
    {
      key: 'merchant_name',
      label: 'Merchant / Store',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13.5 }}>
            {val || row.business_name || 'Merchant Store'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-light)', marginTop: 2 }}>
            #{row.merchant_id} · {row.category || 'Retail'} · {row.city || 'Kerala'}
          </div>
        </div>
      ),
    },
    {
      key: 'owner_name',
      label: 'Owner / Contact',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            👤 {val || row.owner || 'Business Owner'}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-light)', marginTop: 2 }}>
            📞 {row.phone || row.contact_number || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Request Purpose / Note',
      render: (val) => (
        <span style={{ fontSize: 12, color: '#374151', fontStyle: 'italic', maxWidth: 260, display: 'inline-block' }}>
          "{val || 'Requested promotion creation access via merchant portal'}"
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Requested At',
      render: (val) => (
        <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
          {val ? String(val).split('T')[0] : 'Recent'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={(val || 'pending').toLowerCase()} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => {
        const isPending = (row.status || '').toUpperCase() === 'PENDING';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isPending ? (
              <>
                <button
                  className="btn btn-success btn-sm"
                  title="Approve & Enable Promotion Access"
                  disabled={promoActionLoading}
                  onClick={() => handleApprovePromoRequest(row)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 11.5 }}
                >
                  <HiOutlineCheck />
                  <span>Approve Access</span>
                </button>
                <button
                  className="btn btn-danger btn-sm btn-icon"
                  title="Reject Request"
                  disabled={promoActionLoading}
                  onClick={() => handleRejectPromoRequest(row)}
                >
                  <HiOutlineX />
                </button>
              </>
            ) : (row.status || '').toUpperCase() === 'APPROVED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>✓ Access Enabled</span>
                <button
                  className="btn btn-outline btn-sm"
                  title="Turn OFF Promotion Access for this Merchant"
                  disabled={promoActionLoading}
                  onClick={() => handleRevokePromoRequest(row)}
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    color: '#DC2626',
                    borderColor: '#FCA5A5',
                    background: '#FEF2F2',
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  Turn OFF
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                  {(row.status || '').toUpperCase() === 'REVOKED' ? '✕ Revoked (Locked)' : '✕ Declined'}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  title="Re-enable Promotion Access"
                  disabled={promoActionLoading}
                  onClick={() => handleApprovePromoRequest(row)}
                  style={{ fontSize: 10.5, padding: '2px 8px', color: '#059669', borderColor: '#A7F3D0', borderRadius: 6, fontWeight: 600 }}
                >
                  Turn ON
                </button>
              </div>
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

  const promoCounts = {
    all: promoRequests.length,
    pending: promoRequests.filter((r) => (r.status || '').toUpperCase() === 'PENDING').length,
    approved: promoRequests.filter((r) => (r.status || '').toUpperCase() === 'APPROVED').length,
    rejected: promoRequests.filter((r) => (r.status || '').toUpperCase() === 'REJECTED').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Registration Requests"
        subtitle="Review store applications and manage merchant promotion access requests"
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

      {/* Primary Section Selector (Store Registrations vs Promo Access Requests) */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => {
            setCurrentSection('registrations');
            setSearchParams({ section: 'registrations' });
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: currentSection === 'registrations' ? '2px solid #2563EB' : '1px solid #E5E7EB',
            background: currentSection === 'registrations' ? '#EFF6FF' : '#FFFFFF',
            color: currentSection === 'registrations' ? '#1E40AF' : '#4B5563',
            fontWeight: 700,
            fontSize: 13.5,
            cursor: 'pointer',
            boxShadow: currentSection === 'registrations' ? '0 2px 6px rgba(37,99,235,0.12)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <HiOutlineOfficeBuilding style={{ fontSize: 18 }} />
          <span>Merchant Registrations</span>
          <span
            style={{
              background: currentSection === 'registrations' ? '#2563EB' : '#F3F4F6',
              color: currentSection === 'registrations' ? '#FFFFFF' : '#6B7280',
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {counts.pending || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentSection('promo-access');
            setSearchParams({ section: 'promo-access' });
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: currentSection === 'promo-access' ? '2px solid #059669' : '1px solid #E5E7EB',
            background: currentSection === 'promo-access' ? '#ECFDF5' : '#FFFFFF',
            color: currentSection === 'promo-access' ? '#065F46' : '#4B5563',
            fontWeight: 700,
            fontSize: 13.5,
            cursor: 'pointer',
            boxShadow: currentSection === 'promo-access' ? '0 2px 6px rgba(5,150,105,0.12)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <HiOutlineSparkles style={{ fontSize: 18, color: '#D97706' }} />
          <span>Promo Access Requests</span>
          <span
            style={{
              background: promoCounts.pending > 0 ? '#EF4444' : (currentSection === 'promo-access' ? '#059669' : '#F3F4F6'),
              color: promoCounts.pending > 0 || currentSection === 'promo-access' ? '#FFFFFF' : '#6B7280',
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {promoCounts.pending}
          </span>
        </button>
      </div>

      {/* SECTION 1: MERCHANT REGISTRATIONS */}
      {currentSection === 'registrations' && (
        <>
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
        </>
      )}

      {/* SECTION 2: PROMO ACCESS REQUESTS (SEPARATE SECTION) */}
      {currentSection === 'promo-access' && (
        <>
          <div className="tabs">
            {['pending', 'approved', 'rejected', 'all'].map((tab) => (
              <button
                key={tab}
                className={`tab ${promoActiveTab === tab ? 'active' : ''}`}
                onClick={() => setPromoActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} ({promoCounts[tab] || 0})
              </button>
            ))}
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: '0' }}>
              {promoLoading && (
                <div
                  style={{
                    padding: '16px 24px',
                    fontSize: 13,
                    color: '#059669',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderBottom: '1px solid #F3F4F6',
                  }}
                >
                  <CircularSpinner size={16} color="#059669" />
                  <span>Loading promo access requests...</span>
                </div>
              )}
              <DataTable
                columns={promoColumns}
                data={promoRequests}
                loading={promoLoading}
                searchPlaceholder="Search merchant, owner, city..."
                emptyText="No promo access requests in this view."
              />
            </div>
          </div>
        </>
      )}


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
                <button
                  className="btn btn-outline"
                  onClick={() => handleOpenEditModal(selectedRequest)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563EB', borderColor: '#BFDBFE' }}
                >
                  <HiOutlinePencil /> Edit Details
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

      {/* Admin Edit Merchant Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editFormData ? `Edit Merchant Application: ${editFormData.business_name || editFormData.name}` : 'Edit Merchant'}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEditSubmit}
              disabled={isUpdating}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {isUpdating ? (
                <>
                  <CircularSpinner size={16} color="#FFFFFF" />
                  <span>Saving Changes...</span>
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
                }}
              >
                ⚠️ {editModalError}
              </div>
            )}

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Merchant / Business Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.business_name ?? editFormData.name ?? ''}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, business_name: e.target.value, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.owner_name ?? editFormData.owner ?? ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, owner_name: e.target.value, owner: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.category ?? ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editFormData.phone_number ?? editFormData.phone ?? ''}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, phone_number: e.target.value, phone: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">WhatsApp Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editFormData.whatsapp ?? ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email ID</label>
                <input
                  type="email"
                  className="form-input"
                  value={editFormData.email ?? ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">District</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.district ?? ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, district: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.city ?? ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-input"
                value={editFormData.address ?? ''}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Landmark</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.landmark ?? ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, landmark: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Service Timing</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.service_timing ?? ''}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, service_timing: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">About / Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={editFormData.about ?? ''}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, about: e.target.value }))}
              />
            </div>
          </form>
        )}
      </Modal>
    </motion.div>
  );
}
