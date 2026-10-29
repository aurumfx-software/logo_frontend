import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineDatabase,
  HiOutlineUser,
  HiOutlineOfficeBuilding,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineTag,
  HiOutlineDocumentText,
  HiOutlineX,
  HiOutlineReply,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { complaintsApi } from '../api/operationsApi';
import { fetchMerchantsList } from '../api/merchantApi';
import { complaints as fallbackComplaints } from '../data/mockData';

const complaintCategories = [
  'Service Quality',
  'Order Issue',
  'Payment',
  'Listing Accuracy',
  'Product Quality',
  'Delivery & Delay',
  'Behavior & Ethics',
  'General',
];

const initialAddFormState = {
  subject: '',
  user: '',
  user_phone: '',
  user_email: '',
  merchant: '',
  category: 'Service Quality',
  priority: 'medium',
  status: 'open',
  date: new Date().toISOString().split('T')[0],
  description: '',
};

export default function Complaints() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editComplaint, setEditComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [data, setData] = useState([]);
  const [counts, setCounts] = useState({ all: 0, open: 0, 'in-progress': 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reply to Complaint State
  const [replyModalComplaint, setReplyModalComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('in-progress');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Add Complaint State (Removed from Admin UI per user request)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ ...initialAddFormState });
  const [addFormErrors, setAddFormErrors] = useState({});
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [serverError, setServerError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Merchants suggestions list for datalist/autocomplete
  const [merchantSuggestions, setMerchantSuggestions] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const [list, countData] = await Promise.all([
        complaintsApi.list(),
        complaintsApi.getCounts(),
      ]);
      if (list && list.length > 0) {
        setData(list);
      } else {
        setData(fallbackComplaints);
      }
      if (countData) {
        setCounts(countData);
      }
    } catch (err) {
      console.error('Error loading complaints, using fallback:', err);
      setData(fallbackComplaints);
    } finally {
      setLoading(false);
    }
  };

  // Load merchants for autocomplete dropdown
  useEffect(() => {
    loadComplaints();

    async function loadMerchants() {
      try {
        const res = await fetchMerchantsList();
        const items = Array.isArray(res) ? res : res?.data || res?.merchants || [];
        const names = items
          .map((m) => m.business_name || m.name || m.shop_name)
          .filter(Boolean);
        if (names.length > 0) {
          setMerchantSuggestions(Array.from(new Set(names)).slice(0, 500));
        }
      } catch (e) {
        console.warn('Could not pre-load merchants list:', e);
      }
    }
    loadMerchants();
  }, []);

  // Filter & sort newest complaints first
  const filteredData =
    activeTab === 'all'
      ? data
      : data.filter((c) => c.status === activeTab);

  const sortedData = [...filteredData].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  // Form validation for Add Complaint
  const validateAddForm = () => {
    const errors = {};
    if (!addFormData.subject.trim()) {
      errors.subject = 'Subject is required';
    }
    if (!addFormData.user.trim()) {
      errors.user = 'Customer/User name is required';
    }
    if (!addFormData.merchant.trim()) {
      errors.merchant = 'Merchant name is required';
    }
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Add Complaint Submission
  const handleAddSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateAddForm()) return;

    setIsSubmittingAdd(true);
    setServerError('');

    try {
      const payload = {
        subject: addFormData.subject.trim(),
        user: addFormData.user.trim(),
        user_phone: addFormData.user_phone ? addFormData.user_phone.trim() : null,
        user_email: addFormData.user_email ? addFormData.user_email.trim() : null,
        merchant: addFormData.merchant.trim(),
        category: addFormData.category || 'Service Quality',
        priority: addFormData.priority || 'medium',
        status: addFormData.status || 'open',
        date: addFormData.date || new Date().toISOString().split('T')[0],
        description: addFormData.description ? addFormData.description.trim() : null,
      };

      const created = await complaintsApi.create(payload);

      // Prepend or update in local list
      if (created) {
        setData((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
        const newCounts = await complaintsApi.getCounts().catch(() => null);
        if (newCounts) {
          setCounts(newCounts);
        } else {
          setCounts((prev) => ({
            ...prev,
            all: prev.all + 1,
            [payload.status]: (prev[payload.status] || 0) + 1,
          }));
        }
      }

      showToast(`✅ Complaint "${created?.complaint_code || payload.subject}" saved to PostgreSQL database!`);
      setIsAddModalOpen(false);
      setAddFormData({ ...initialAddFormState });
      setAddFormErrors({});
      // Refresh complaints in background
      loadComplaints();
    } catch (err) {
      console.error('Failed to create complaint:', err);
      setServerError(err.message || 'Failed to store complaint in database');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      const updated = await complaintsApi.resolve(selectedComplaint.id, responseText);
      setData((prev) =>
        prev.map((c) => (c.id === selectedComplaint.id ? { ...c, ...updated, status: 'resolved' } : c))
      );
      setCounts((prev) => ({
        ...prev,
        open: Math.max(0, prev.open - 1),
        resolved: prev.resolved + 1,
      }));
      setSelectedComplaint(null);
      setResponseText('');
      showToast(`✅ Complaint marked as resolved in database.`);
    } catch (err) {
      alert(`Failed to resolve complaint: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateComplaint = async () => {
    if (!editComplaint || !editComplaint.subject.trim()) return;
    setActionLoading(true);
    try {
      const payload = {
        subject: editComplaint.subject,
        user: editComplaint.user,
        merchant: editComplaint.merchant,
        user_phone: editComplaint.user_phone,
        user_email: editComplaint.user_email,
        category: editComplaint.category,
        priority: editComplaint.priority,
        status: editComplaint.status,
        description: editComplaint.description,
        admin_response: editComplaint.admin_response,
      };
      const updated = await complaintsApi.update(editComplaint.id, payload);
      setData((prev) =>
        prev.map((c) => (c.id === editComplaint.id ? { ...c, ...updated } : c))
      );
      const newCounts = await complaintsApi.getCounts();
      if (newCounts) setCounts(newCounts);
      setEditComplaint(null);
      showToast(`✅ Complaint updated in PostgreSQL database.`);
    } catch (err) {
      alert(`Failed to update complaint: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyModalComplaint) return;
    if (!replyText.trim()) {
      alert('Please enter an official reply message for the merchant / complainant.');
      return;
    }
    setIsSubmittingReply(true);
    try {
      const updated = await complaintsApi.reply(replyModalComplaint.id, replyText.trim(), replyStatus);
      setData((prev) =>
        prev.map((c) =>
          c.id === replyModalComplaint.id
            ? { ...c, ...updated, admin_response: replyText.trim(), status: replyStatus }
            : c
        )
      );
      const newCounts = await complaintsApi.getCounts().catch(() => null);
      if (newCounts) setCounts(newCounts);
      showToast(`✓ Official reply sent to "${replyModalComplaint.merchant}" successfully!`);
      setReplyModalComplaint(null);
      setReplyText('');
    } catch (err) {
      alert(`Failed to send reply: ${err.message}`);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint permanently from the database?')) return;
    try {
      await complaintsApi.delete(id);
      setData((prev) => prev.filter((c) => c.id !== id));
      const newCounts = await complaintsApi.getCounts();
      if (newCounts) setCounts(newCounts);
      showToast(`🗑️ Complaint deleted from database.`);
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.02em' }}>
          {row.complaint_code || `CMP-${val}`}
        </span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (val) => (
        <span style={{ fontWeight: 600, maxWidth: 220, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {val}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{val}</div>
          {row.user_phone && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.user_phone}</div>
          )}
        </div>
      ),
    },
    {
      key: 'merchant',
      label: 'Merchant',
      render: (val) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    { key: 'date', label: 'Date' },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            className="btn btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
            }}
            title="Reply to Merchant / User"
            onClick={() => {
              setReplyModalComplaint(row);
              setReplyText(row.admin_response || '');
              setReplyStatus(row.status === 'resolved' ? 'resolved' : 'in-progress');
            }}
          >
            <HiOutlineReply /> Reply
          </button>
          <button
            className="btn btn-outline btn-sm btn-icon"
            title="View Details"
            onClick={() => {
              setSelectedComplaint(row);
              setResponseText(row.admin_response || '');
            }}
          >
            <HiOutlineEye />
          </button>
          <button
            className="btn btn-outline btn-sm btn-icon"
            title="Edit Complaint"
            onClick={() => setEditComplaint({ ...row })}
          >
            <HiOutlinePencil />
          </button>
          <button
            className="btn btn-outline btn-sm btn-icon"
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.25)' }}
            title="Delete Complaint"
            onClick={() => handleDelete(row.id)}
          >
            <HiOutlineTrash />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: 80,
              right: 28,
              zIndex: 999999,
              background: '#10B981',
              color: 'white',
              padding: '12px 20px',
              borderRadius: 12,
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <HiOutlineCheckCircle size={22} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="Complaints"
        subtitle="Manage complaints, disputes, and send replies directly to merchants & users"
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={loadComplaints} title="Reload from PostgreSQL">
            <HiOutlineRefresh /> Refresh
          </button>
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'all', label: 'All' },
          { key: 'open', label: 'Open' },
          { key: 'in-progress', label: 'In Progress' },
          { key: 'resolved', label: 'Resolved' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} ({counts[tab.key] ?? (activeTab === 'all' ? data.length : data.filter((c) => c.status === tab.key).length)})
          </button>
        ))}
      </div>

      {/* Complaints Table Card */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <DataTable
            columns={columns}
            data={sortedData}
            loading={loading}
            searchPlaceholder="Search complaints by subject, user, merchant, code..."
          />
        </div>
      </div>

      {/* Datalist for Merchant suggestions */}
      <datalist id="merchant-suggestions-list">
        {merchantSuggestions.map((m, idx) => (
          <option key={`${m}-${idx}`} value={m} />
        ))}
      </datalist>

      {/* ========================================================
          1. ADD COMPLAINT MODAL (Stores into PostgreSQL via .env)
          ======================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Complaint"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmittingAdd}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSubmittingAdd}
              onClick={handleAddSubmit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 20px',
                fontWeight: 600,
                borderRadius: 10,
              }}
            >
              {isSubmittingAdd ? (
                <>
                  <HiOutlineRefresh className="spin" size={16} /> Saving to Database...
                </>
              ) : (
                <>
                  <HiOutlineDatabase size={16} /> Save Complaint
                </>
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddSubmit}>
          {/* Database Info Notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#EEF2FF',
              border: '1px solid #C7D2FE',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 18,
              fontSize: 13,
              color: '#3730A3',
            }}
          >
            <HiOutlineDatabase size={20} style={{ color: '#4F46E5', flexShrink: 0 }} />
            <span>
              This complaint will be stored directly into the <strong>PostgreSQL</strong> database configured via <code>.env</code> and can be verified in <strong>pgAdmin</strong>.
            </span>
          </div>

          {/* Server Error Message */}
          {serverError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <HiOutlineExclamationCircle size={18} />
              <span>{serverError}</span>
            </div>
          )}

          {/* Subject Field */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiOutlineDocumentText /> Complaint Subject / Title <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              className={`form-input ${addFormErrors.subject ? 'input-error' : ''}`}
              placeholder="e.g. Overcharged on invoice / Service delay / Misleading item details"
              value={addFormData.subject}
              onChange={(e) => {
                setAddFormData({ ...addFormData, subject: e.target.value });
                if (addFormErrors.subject) setAddFormErrors({ ...addFormErrors, subject: null });
              }}
              style={addFormErrors.subject ? { borderColor: 'var(--danger)' } : {}}
            />
            {addFormErrors.subject && (
              <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
                {addFormErrors.subject}
              </p>
            )}
          </div>

          {/* User & Merchant Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlineUser /> Customer / Complainant Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                className={`form-input ${addFormErrors.user ? 'input-error' : ''}`}
                placeholder="e.g. Rahul Sharma"
                value={addFormData.user}
                onChange={(e) => {
                  setAddFormData({ ...addFormData, user: e.target.value });
                  if (addFormErrors.user) setAddFormErrors({ ...addFormErrors, user: null });
                }}
                style={addFormErrors.user ? { borderColor: 'var(--danger)' } : {}}
              />
              {addFormErrors.user && (
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
                  {addFormErrors.user}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlineOfficeBuilding /> Merchant / Business Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                list="merchant-suggestions-list"
                className={`form-input ${addFormErrors.merchant ? 'input-error' : ''}`}
                placeholder="Type or select merchant name"
                value={addFormData.merchant}
                onChange={(e) => {
                  setAddFormData({ ...addFormData, merchant: e.target.value });
                  if (addFormErrors.merchant) setAddFormErrors({ ...addFormErrors, merchant: null });
                }}
                style={addFormErrors.merchant ? { borderColor: 'var(--danger)' } : {}}
              />
              {addFormErrors.merchant && (
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>
                  {addFormErrors.merchant}
                </p>
              )}
            </div>
          </div>

          {/* User Contact Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlinePhone /> Contact Phone Number (Optional)
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={addFormData.user_phone}
                onChange={(e) => setAddFormData({ ...addFormData, user_phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlineMail /> Contact Email Address (Optional)
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. customer@example.com"
                value={addFormData.user_email}
                onChange={(e) => setAddFormData({ ...addFormData, user_email: e.target.value })}
              />
            </div>
          </div>

          {/* Category, Priority & Status Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiOutlineTag /> Category
              </label>
              <select
                className="form-select"
                value={addFormData.category}
                onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
              >
                {complaintCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Priority</label>
              <select
                className="form-select"
                value={addFormData.priority}
                onChange={(e) => setAddFormData({ ...addFormData, priority: e.target.value })}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Status</label>
              <select
                className="form-select"
                value={addFormData.status}
                onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Date Field */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Date of Incident</label>
            <input
              type="date"
              className="form-input"
              value={addFormData.date}
              onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
            />
          </div>

          {/* Description Textarea */}
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Detailed Description / Notes</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Provide complete details about the complaint or dispute..."
              value={addFormData.description}
              onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================
          2. VIEW COMPLAINT DETAILS MODAL
          ======================================================== */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title="Complaint Details"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                const c = selectedComplaint;
                setSelectedComplaint(null);
                setReplyModalComplaint(c);
                setReplyText(c.admin_response || '');
                setReplyStatus(c.status === 'resolved' ? 'resolved' : 'in-progress');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <HiOutlineReply /> Reply to Merchant
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                const toEdit = { ...selectedComplaint };
                setSelectedComplaint(null);
                setEditComplaint(toEdit);
              }}
            >
              <HiOutlinePencil /> Edit
            </button>
            <button className="btn btn-outline" onClick={() => setSelectedComplaint(null)}>Close</button>
            {selectedComplaint?.status !== 'resolved' && (
              <button
                className="btn btn-outline"
                disabled={actionLoading}
                onClick={handleResolve}
              >
                {actionLoading ? 'Saving...' : 'Mark as Resolved'}
              </button>
            )}
          </div>
        }
      >
        {selectedComplaint && (
          <div>
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius-md)',
                padding: 20,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ fontWeight: 700, margin: 0 }}>{selectedComplaint.subject}</h4>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: '#EEF2FF', padding: '3px 8px', borderRadius: 6 }}>
                  {selectedComplaint.complaint_code || `CMP-${selectedComplaint.id}`}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Category: <strong>{selectedComplaint.category}</strong> · Date: {selectedComplaint.date || 'N/A'}
              </p>
              {selectedComplaint.description && (
                <p style={{ fontSize: 13, marginTop: 10, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                  {selectedComplaint.description}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Complainant / User</label>
                <p style={{ fontWeight: 600 }}>{selectedComplaint.user}</p>
                {selectedComplaint.user_phone && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📞 {selectedComplaint.user_phone}</p>}
                {selectedComplaint.user_email && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>✉️ {selectedComplaint.user_email}</p>}
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Merchant</label>
                <p style={{ fontWeight: 600 }}>{selectedComplaint.merchant}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Priority</label>
                <StatusBadge status={selectedComplaint.priority} />
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Status</label>
                <StatusBadge status={selectedComplaint.status} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 20 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Admin Response / Resolution</label>
              {selectedComplaint.status === 'resolved' ? (
                <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 'var(--radius-sm)', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                  {selectedComplaint.admin_response || 'Resolved by Administrator.'}
                </div>
              ) : (
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Type official admin response or actions taken..."
                  style={{ resize: 'vertical' }}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================
          3. EDIT COMPLAINT MODAL (Stores into PostgreSQL via .env)
          ======================================================== */}
      <Modal
        isOpen={!!editComplaint}
        onClose={() => setEditComplaint(null)}
        title="Edit Complaint"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditComplaint(null)}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={actionLoading}
              onClick={handleUpdateComplaint}
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editComplaint && (
          <div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Subject *</label>
              <input
                className="form-input"
                value={editComplaint.subject || ''}
                onChange={(e) => setEditComplaint({ ...editComplaint, subject: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>User / Complainant</label>
                <input
                  className="form-input"
                  value={editComplaint.user || ''}
                  onChange={(e) => setEditComplaint({ ...editComplaint, user: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Merchant Name</label>
                <input
                  className="form-input"
                  list="merchant-suggestions-list"
                  value={editComplaint.merchant || ''}
                  onChange={(e) => setEditComplaint({ ...editComplaint, merchant: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>User Phone</label>
                <input
                  className="form-input"
                  value={editComplaint.user_phone || ''}
                  onChange={(e) => setEditComplaint({ ...editComplaint, user_phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>User Email</label>
                <input
                  className="form-input"
                  value={editComplaint.user_email || ''}
                  onChange={(e) => setEditComplaint({ ...editComplaint, user_email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Category</label>
                <select
                  className="form-select"
                  value={editComplaint.category || 'General'}
                  onChange={(e) => setEditComplaint({ ...editComplaint, category: e.target.value })}
                >
                  {complaintCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Priority *</label>
                <select
                  className="form-select"
                  value={editComplaint.priority || 'medium'}
                  onChange={(e) => setEditComplaint({ ...editComplaint, priority: e.target.value })}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Status *</label>
                <select
                  className="form-select"
                  value={editComplaint.status || 'open'}
                  onChange={(e) => setEditComplaint({ ...editComplaint, status: e.target.value })}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Complaint Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={editComplaint.description || ''}
                onChange={(e) => setEditComplaint({ ...editComplaint, description: e.target.value })}
                placeholder="Details of the complaint..."
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>Admin Response / Resolution Notes</label>
              <textarea
                className="form-input"
                rows={3}
                value={editComplaint.admin_response || ''}
                onChange={(e) => setEditComplaint({ ...editComplaint, admin_response: e.target.value })}
                placeholder="Official admin response or resolution notes..."
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================
          4. OFFICIAL ADMIN REPLY MODAL
          ======================================================== */}
      <Modal
        isOpen={!!replyModalComplaint}
        onClose={() => setReplyModalComplaint(null)}
        title={replyModalComplaint ? `Reply to Complaint: ${replyModalComplaint.complaint_code || `CMP-${replyModalComplaint.id}`}` : 'Reply to Complaint'}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-outline"
              onClick={() => setReplyModalComplaint(null)}
              disabled={isSubmittingReply}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={isSubmittingReply || !replyText.trim()}
              onClick={handleSendReply}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <HiOutlineReply />
              {isSubmittingReply ? 'Sending Reply...' : 'Send Reply to Merchant'}
            </button>
          </div>
        }
      >
        {replyModalComplaint && (
          <div>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '16px 18px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ fontWeight: 700, margin: 0, fontSize: 16, color: '#1E293B' }}>
                  {replyModalComplaint.subject}
                </h4>
                <StatusBadge status={replyModalComplaint.status} />
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748B', flexWrap: 'wrap', marginBottom: 10 }}>
                <span>🏪 <strong>Merchant:</strong> {replyModalComplaint.merchant}</span>
                <span>👤 <strong>By:</strong> {replyModalComplaint.user}</span>
                <span>📁 <strong>Category:</strong> {replyModalComplaint.category}</span>
                <span>📅 <strong>Date:</strong> {replyModalComplaint.date}</span>
              </div>
              {replyModalComplaint.description && (
                <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, color: '#334155' }}>
                  <strong style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 2 }}>ORIGINAL COMPLAINT:</strong>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{replyModalComplaint.description}</p>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: '#1E293B' }}>
                <HiOutlineReply /> Official Admin Reply to Merchant <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                className="form-input"
                rows={5}
                placeholder="Type your official response, resolution details, or action taken..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{ resize: 'vertical', fontSize: 14 }}
                required
              />
              <span style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'block' }}>
                🔔 This reply will immediately appear in the Merchant Portal under their Complaints section.
              </span>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Update Complaint Status</label>
                <select
                  className="form-select"
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                >
                  <option value="in-progress">🟡 In Progress (Reply Sent, Under Investigation)</option>
                  <option value="resolved">🟢 Resolved (Issue Solved & Closed)</option>
                  <option value="open">🔵 Keep as Open</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE', fontSize: 12, color: '#1E40AF' }}>
                💡 Selecting "Resolved" records the resolution date and marks the dispute closed for the merchant.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
