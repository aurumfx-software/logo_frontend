import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineEye, HiOutlinePencil, HiOutlineChatAlt, HiOutlineTrash, HiOutlineRefresh } from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { complaintsApi } from '../api/operationsApi';
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

export default function Complaints() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editComplaint, setEditComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [data, setData] = useState([]);
  const [counts, setCounts] = useState({ all: 0, open: 0, 'in-progress': 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    loadComplaints();
  }, []);

  const filteredData =
    activeTab === 'all'
      ? data
      : data.filter((c) => c.status === activeTab);

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
      // Reload counts
      const newCounts = await complaintsApi.getCounts();
      if (newCounts) setCounts(newCounts);
      setEditComplaint(null);
    } catch (err) {
      alert(`Failed to update complaint: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint record?')) return;
    try {
      await complaintsApi.delete(id);
      setData((prev) => prev.filter((c) => c.id !== id));
      const newCounts = await complaintsApi.getCounts();
      if (newCounts) setCounts(newCounts);
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (val, row) => <span style={{ fontWeight: 600 }}>{row.complaint_code || `CMP-${val}`}</span>,
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (val) => <span style={{ fontWeight: 600, maxWidth: 200, display: 'block' }}>{val}</span>,
    },
    { key: 'user', label: 'User' },
    { key: 'merchant', label: 'Merchant' },
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
        <div style={{ display: 'flex', gap: 6 }}>
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
            style={{ color: 'var(--danger)' }}
            title="Delete"
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
        title="Complaints"
        subtitle="Manage complaints & disputes between users and merchants in PostgreSQL"
      >
        <button className="btn btn-outline" onClick={loadComplaints}>
          <HiOutlineRefresh /> Refresh
        </button>
      </PageHeader>

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

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <DataTable
            columns={columns}
            data={filteredData}
            searchPlaceholder="Search complaints..."
          />
        </div>
      </div>

      {/* View Complaint Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title="Complaint Details"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                const toEdit = { ...selectedComplaint };
                setSelectedComplaint(null);
                setEditComplaint(toEdit);
              }}
            >
              <HiOutlinePencil /> Edit Complaint
            </button>
            <button className="btn btn-outline" onClick={() => setSelectedComplaint(null)}>Close</button>
            {selectedComplaint?.status !== 'resolved' && (
              <button
                className="btn btn-primary"
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
              <h4 style={{ fontWeight: 700, marginBottom: 8 }}>{selectedComplaint.subject}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Category: <strong>{selectedComplaint.category}</strong> · Date: {selectedComplaint.date}
              </p>
              {selectedComplaint.description && (
                <p style={{ fontSize: 13, marginTop: 8, color: 'var(--text)' }}>
                  {selectedComplaint.description}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>User</label>
                <p style={{ fontWeight: 600 }}>{selectedComplaint.user}</p>
                {selectedComplaint.user_phone && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedComplaint.user_phone}</p>}
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
              <label className="form-label">Admin Response</label>
              {selectedComplaint.status === 'resolved' ? (
                <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                  {selectedComplaint.admin_response || 'Resolved by Administrator.'}
                </div>
              ) : (
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Type your response to the complaint..."
                  style={{ resize: 'vertical' }}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Complaint Modal */}
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
              <label className="form-label">Subject *</label>
              <input
                className="form-input"
                value={editComplaint.subject}
                onChange={(e) => setEditComplaint({ ...editComplaint, subject: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">User Name *</label>
                <input
                  className="form-input"
                  value={editComplaint.user}
                  onChange={(e) => setEditComplaint({ ...editComplaint, user: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Merchant Name *</label>
                <input
                  className="form-input"
                  value={editComplaint.merchant}
                  onChange={(e) => setEditComplaint({ ...editComplaint, merchant: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={editComplaint.category || 'General'}
                  onChange={(e) => setEditComplaint({ ...editComplaint, category: e.target.value })}
                >
                  {complaintCategories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
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
                <label className="form-label">Status</label>
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
              <label className="form-label">Complaint Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={editComplaint.description || ''}
                onChange={(e) => setEditComplaint({ ...editComplaint, description: e.target.value })}
                placeholder="Details of the complaint..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admin Response</label>
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
