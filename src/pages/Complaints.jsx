import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineEye, HiOutlineChatAlt } from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { complaints } from '../data/mockData';

export default function Complaints() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [data, setData] = useState(complaints);

  const filteredData =
    activeTab === 'all'
      ? data
      : data.filter((c) => c.status === activeTab);

  const columns = [
    { key: 'id', label: 'ID' },
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
            title="View"
            onClick={() => setSelectedComplaint(row)}
          >
            <HiOutlineEye />
          </button>
          <button className="btn btn-outline btn-sm btn-icon" title="Respond">
            <HiOutlineChatAlt />
          </button>
        </div>
      ),
    },
  ];

  const counts = {
    all: data.length,
    open: data.filter((c) => c.status === 'open').length,
    'in-progress': data.filter((c) => c.status === 'in-progress').length,
    resolved: data.filter((c) => c.status === 'resolved').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Complaints"
        subtitle="Manage complaints & disputes between users and merchants"
      />

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
            {tab.label} ({counts[tab.key]})
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

      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title="Complaint Details"
        size="lg"
        footer={
          selectedComplaint?.status !== 'resolved' && (
            <>
              <button className="btn btn-outline" onClick={() => setSelectedComplaint(null)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setData((prev) =>
                    prev.map((c) => (c.id === selectedComplaint.id ? { ...c, status: 'resolved' } : c))
                  );
                  setSelectedComplaint(null);
                }}
              >
                Mark as Resolved
              </button>
            </>
          )
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
                Category: {selectedComplaint.category}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>User</label>
                <p style={{ fontWeight: 600 }}>{selectedComplaint.user}</p>
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
            {selectedComplaint.status !== 'resolved' && (
              <div className="form-group" style={{ marginTop: 20 }}>
                <label className="form-label">Response</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Type your response to the complaint..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
