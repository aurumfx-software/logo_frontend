import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiPlus,
  HiCheckCircle,
  HiOutlineFilter,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { complaintsApi } from '../api/complaintsApi';

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

export default function Complaints() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const [data, setData] = useState([]);
  const [counts, setCounts] = useState({ all: 0, open: 0, 'in-progress': 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editComplaint, setEditComplaint] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Resolution response note
  const [responseText, setResponseText] = useState('');

  // New Complaint Form State
  const [newComplaint, setNewComplaint] = useState({
    subject: '',
    user: '',
    user_email: '',
    user_phone: '',
    merchant: '',
    category: 'Service Quality',
    priority: 'high',
    status: 'open',
    description: '',
  });

  // Fetch Complaints & Counts from API
  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const [list, countData] = await Promise.all([
        complaintsApi.list({
          status: activeTab,
          category: selectedCategory,
          priority: selectedPriority,
          search: searchQuery,
        }),
        complaintsApi.getCounts(),
      ]);

      setData(Array.isArray(list) ? list : []);
      if (countData) {
        setCounts(countData);
      }
    } catch (err) {
      console.error('Error fetching complaints API:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, selectedPriority, searchQuery]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // 1. View Complaint Details (GET /api/v1/complaints/{id})
  const handleViewDetails = async (row) => {
    setSelectedComplaint(row);
    setResponseText(row.admin_response || '');
    setDetailLoading(true);
    try {
      const freshDetail = await complaintsApi.getById(row.id);
      if (freshDetail) {
        setSelectedComplaint(freshDetail);
        setResponseText(freshDetail.admin_response || '');
      }
    } catch (err) {
      console.warn('Backend single complaint fetch notice:', err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // 2. Create Complaint (POST /api/v1/complaints)
  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!newComplaint.subject.trim() || !newComplaint.user.trim()) {
      alert('Please fill in required fields: Subject and Customer User Name');
      return;
    }
    setActionLoading(true);
    try {
      const created = await complaintsApi.create({
        merchant: newComplaint.merchant.trim() || 'General Support',
        subject: newComplaint.subject.trim(),
        user: newComplaint.user.trim(),
        user_email: newComplaint.user_email.trim(),
        user_phone: newComplaint.user_phone.trim(),
        category: newComplaint.category,
        priority: newComplaint.priority,
        status: newComplaint.status,
        description: newComplaint.description.trim(),
      });

      alert('Complaint created successfully!');
      setIsCreateOpen(false);
      setNewComplaint({
        subject: '',
        user: '',
        user_email: '',
        user_phone: '',
        merchant: '',
        category: 'Service Quality',
        priority: 'high',
        status: 'open',
        description: '',
      });
      loadComplaints();
    } catch (err) {
      alert(`Failed to create complaint: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Resolve Complaint (PATCH /api/v1/complaints/{id}/resolve)
  const handleResolve = async () => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      const updated = await complaintsApi.resolve(selectedComplaint.id, responseText);
      setData((prev) =>
        prev.map((c) => (c.id === selectedComplaint.id ? { ...c, ...updated, status: 'resolved' } : c))
      );
      setSelectedComplaint(null);
      setResponseText('');
      loadComplaints();
    } catch (err) {
      alert(`Failed to resolve complaint: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Update Status Directly (PATCH /api/v1/complaints/{id}/status)
  const handleStatusChange = async (id, newStatus, note = '') => {
    setActionLoading(true);
    try {
      const updated = await complaintsApi.updateStatus(id, newStatus, note);
      setData((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated, status: newStatus } : c))
      );
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint((prev) => ({ ...prev, ...updated, status: newStatus }));
      }
      loadComplaints();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Full Edit Complaint (PUT /api/v1/complaints/{id})
  const handleUpdateComplaint = async () => {
    if (!editComplaint || !editComplaint.subject.trim()) return;
    setActionLoading(true);
    try {
      const payload = {
        subject: editComplaint.subject,
        user: editComplaint.user,
        user_email: editComplaint.user_email || '',
        user_phone: editComplaint.user_phone || '',
        merchant: editComplaint.merchant,
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
      setEditComplaint(null);
      loadComplaints();
    } catch (err) {
      alert(`Failed to update complaint: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Delete Complaint (DELETE /api/v1/complaints/{id})
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this complaint?')) return;
    try {
      await complaintsApi.delete(id);
      setData((prev) => prev.filter((c) => c.id !== id));
      loadComplaints();
    } catch (err) {
      alert(`Failed to delete complaint: ${err.message}`);
    }
  };

  const columns = [
    {
      key: 'complaint_code',
      label: 'ID / Code',
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
          {val || row.code || `CMP-${String(row.id).padStart(3, '0')}`}
        </span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (val) => <span style={{ fontWeight: 600, maxWidth: 220, display: 'block' }}>{val}</span>,
    },
    {
      key: 'user',
      label: 'Customer User',
      render: (val, row) => (
        <div>
          <span style={{ fontWeight: 600, display: 'block' }}>{val || 'Anonymous Customer'}</span>
          {row.user_email && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.user_email}</span>}
        </div>
      ),
    },
    {
      key: 'merchant',
      label: 'Merchant / Target',
      render: (val) => <span style={{ fontWeight: 500 }}>{val || 'Platform General'}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => (
        <span
          style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 12,
            background: 'rgba(56, 189, 248, 0.1)',
            color: '#0284c7',
            fontWeight: 600,
          }}
        >
          {val || 'General'}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (val) => <StatusBadge status={val || 'medium'} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val || 'open'} />,
    },
    {
      key: 'date',
      label: 'Date',
      render: (val, row) => (
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {val || (row.created_at ? row.created_at.split('T')[0] : 'Today')}
        </span>
      ),
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
            onClick={() => handleViewDetails(row)}
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
            style={{ color: 'var(--danger)' }}
            title="Delete Permanently"
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
      <PageHeader
        title="Customer & Merchant Complaints"
        subtitle="Live complaints management module connected to http://168.144.18.149:8000/api/v1/complaints"
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            <HiPlus /> Log New Complaint
          </button>
          <button className="btn btn-outline" onClick={loadComplaints}>
            <HiOutlineRefresh /> Refresh API
          </button>
        </div>
      </PageHeader>

      {/* Filter Toolbar & Status Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[
            { key: 'all', label: 'All Complaints', count: counts.all },
            { key: 'open', label: 'Open', count: counts.open },
            { key: 'in-progress', label: 'In Progress', count: counts['in-progress'] },
            { key: 'resolved', label: 'Resolved', count: counts.resolved },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} ({tab.count ?? (tab.key === 'all' ? data.length : data.filter((c) => c.status === tab.key).length)})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HiOutlineFilter style={{ color: 'var(--text-secondary)' }} />
            <select
              className="form-select"
              style={{ padding: '6px 12px', fontSize: 13 }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {complaintCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <select
            className="form-select"
            style={{ padding: '6px 12px', fontSize: 13 }}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Main Complaints Data Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            searchPlaceholder="Search complaints by subject, user, merchant or CMP code..."
            onSearchChange={(query) => setSearchQuery(query)}
          />
        </div>
      </div>

      {/* 1. VIEW COMPLAINT DETAILS MODAL */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={selectedComplaint ? `Complaint Details: ${selectedComplaint.complaint_code || `CMP-${selectedComplaint.id}`}` : 'Complaint Details'}
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {selectedComplaint && selectedComplaint.status !== 'in-progress' && (
                <button
                  className="btn btn-outline"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(selectedComplaint.id, 'in-progress', responseText)}
                >
                  Set In-Progress
                </button>
              )}
              {selectedComplaint && selectedComplaint.status !== 'open' && (
                <button
                  className="btn btn-outline"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(selectedComplaint.id, 'open', responseText)}
                >
                  Re-open Ticket
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
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
              <button className="btn btn-outline" onClick={() => setSelectedComplaint(null)}>
                Close
              </button>
              {selectedComplaint?.status !== 'resolved' && (
                <button className="btn btn-primary" disabled={actionLoading} onClick={handleResolve}>
                  <HiCheckCircle /> {actionLoading ? 'Saving...' : 'Mark as Resolved'}
                </button>
              )}
            </div>
          </div>
        }
      >
        {selectedComplaint && (
          <div>
            {detailLoading && (
              <div style={{ fontSize: 12, color: 'var(--primary)', marginBottom: 8 }}>
                Refreshing details from API...
              </div>
            )}
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius-md)',
                padding: 20,
                marginBottom: 20,
                borderLeft: '4px solid var(--primary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{selectedComplaint.subject}</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Category: <strong>{selectedComplaint.category || 'General'}</strong> · Date:{' '}
                    {selectedComplaint.date || (selectedComplaint.created_at ? selectedComplaint.created_at.split('T')[0] : 'Today')}
                  </p>
                </div>
                <StatusBadge status={selectedComplaint.status || 'open'} />
              </div>

              {selectedComplaint.description && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <label className="form-label" style={{ color: 'var(--text-light)', fontSize: 11, textTransform: 'uppercase' }}>
                    Complaint Description
                  </label>
                  <p style={{ fontSize: 14, color: 'var(--text)', whiteSpace: 'pre-line' }}>{selectedComplaint.description}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8 }}>
                <label className="form-label" style={{ color: '#64748B', fontSize: 11 }}>Customer User</label>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{selectedComplaint.user}</p>
                {selectedComplaint.user_email && <p style={{ fontSize: 12, color: '#475569' }}>📧 {selectedComplaint.user_email}</p>}
                {selectedComplaint.user_phone && <p style={{ fontSize: 12, color: '#475569' }}>📞 {selectedComplaint.user_phone}</p>}
              </div>

              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8 }}>
                <label className="form-label" style={{ color: '#64748B', fontSize: 11 }}>Merchant / Target</label>
                <p style={{ fontWeight: 700, fontSize: 14 }}>{selectedComplaint.merchant}</p>
              </div>

              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8 }}>
                <label className="form-label" style={{ color: '#64748B', fontSize: 11 }}>Ticket Priority</label>
                <div style={{ marginTop: 4 }}>
                  <StatusBadge status={selectedComplaint.priority || 'medium'} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Admin Official Response / Resolution Note
              </label>
              {selectedComplaint.status === 'resolved' ? (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 14, borderRadius: 8, fontSize: 13, color: '#166534' }}>
                  <strong>Resolution:</strong> {selectedComplaint.admin_response || 'Resolved by Administrator.'}
                </div>
              ) : (
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Type official admin response or resolution notes here..."
                  style={{ resize: 'vertical' }}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 2. CREATE NEW COMPLAINT MODAL (POST /api/v1/complaints) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log New Complaint (POST /api/v1/complaints)"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={actionLoading} onClick={handleCreateComplaint}>
              {actionLoading ? 'Submitting to API...' : 'Create Complaint'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateComplaint}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>
              Complaint Subject *
            </label>
            <input
              className="form-input"
              required
              placeholder="e.g. Delayed installation service"
              value={newComplaint.subject}
              onChange={(e) => setNewComplaint({ ...newComplaint, subject: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Customer / User Name *
              </label>
              <input
                className="form-input"
                required
                placeholder="e.g. Anil Kumar"
                value={newComplaint.user}
                onChange={(e) => setNewComplaint({ ...newComplaint, user: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Merchant Name
              </label>
              <input
                className="form-input"
                placeholder="e.g. Global Solar Power Solution"
                value={newComplaint.merchant}
                onChange={(e) => setNewComplaint({ ...newComplaint, merchant: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Customer Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="anil@gmail.com"
                value={newComplaint.user_email}
                onChange={(e) => setNewComplaint({ ...newComplaint, user_email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Customer Phone</label>
              <input
                className="form-input"
                placeholder="9847123456"
                value={newComplaint.user_phone}
                onChange={(e) => setNewComplaint({ ...newComplaint, user_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={newComplaint.category}
                onChange={(e) => setNewComplaint({ ...newComplaint, category: e.target.value })}
              >
                {complaintCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={newComplaint.priority}
                onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value })}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
                className="form-select"
                value={newComplaint.status}
                onChange={(e) => setNewComplaint({ ...newComplaint, status: e.target.value })}
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Complaint Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Describe the complaint issue..."
              value={newComplaint.description}
              onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* 3. EDIT COMPLAINT MODAL (PUT /api/v1/complaints/{id}) */}
      <Modal
        isOpen={!!editComplaint}
        onClose={() => setEditComplaint(null)}
        title={`Edit Complaint: ${editComplaint?.complaint_code || `CMP-${editComplaint?.id}`}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditComplaint(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={actionLoading} onClick={handleUpdateComplaint}>
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editComplaint && (
          <div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Subject *
              </label>
              <input
                className="form-input"
                value={editComplaint.subject}
                onChange={(e) => setEditComplaint({ ...editComplaint, subject: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  User Name
                </label>
                <input
                  className="form-input"
                  value={editComplaint.user}
                  onChange={(e) => setEditComplaint({ ...editComplaint, user: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Merchant Name
                </label>
                <input
                  className="form-input"
                  value={editComplaint.merchant}
                  onChange={(e) => setEditComplaint({ ...editComplaint, merchant: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Category
                </label>
                <select
                  className="form-select"
                  value={editComplaint.category || 'General'}
                  onChange={(e) => setEditComplaint({ ...editComplaint, category: e.target.value })}
                >
                  {complaintCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Priority *
                </label>
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
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Status *
                </label>
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
              <label className="form-label" style={{ fontWeight: 600 }}>
                Complaint Description
              </label>
              <textarea
                className="form-input"
                rows={3}
                value={editComplaint.description || ''}
                onChange={(e) => setEditComplaint({ ...editComplaint, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Admin Response / Resolution Notes
              </label>
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
    </motion.div>
  );
}
