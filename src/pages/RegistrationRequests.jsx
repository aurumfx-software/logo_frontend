import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCheck, HiOutlineX, HiOutlineEye } from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { registrationRequests } from '../data/mockData';

export default function RegistrationRequests() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [data, setData] = useState(registrationRequests);

  const filteredData =
    activeTab === 'all'
      ? data
      : data.filter((r) => r.status === activeTab);

  const handleApprove = (id) => {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    setSelectedRequest(null);
  };

  const handleReject = (id) => {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
    setSelectedRequest(null);
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
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-outline btn-sm btn-icon"
            title="View"
            onClick={() => setSelectedRequest(row)}
          >
            <HiOutlineEye />
          </button>
          {row.status === 'pending' && (
            <>
              <button
                className="btn btn-success btn-sm btn-icon"
                title="Approve"
                onClick={() => handleApprove(row.id)}
              >
                <HiOutlineCheck />
              </button>
              <button
                className="btn btn-danger btn-sm btn-icon"
                title="Reject"
                onClick={() => handleReject(row.id)}
              >
                <HiOutlineX />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const counts = {
    all: data.length,
    pending: data.filter((r) => r.status === 'pending').length,
    approved: data.filter((r) => r.status === 'approved').length,
    rejected: data.filter((r) => r.status === 'rejected').length,
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
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
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

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Registration Details"
        footer={
          selectedRequest?.status === 'pending' && (
            <>
              <button className="btn btn-outline" onClick={() => setSelectedRequest(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleReject(selectedRequest.id)}>
                Reject
              </button>
              <button className="btn btn-success" onClick={() => handleApprove(selectedRequest.id)}>
                Approve
              </button>
            </>
          )
        }
      >
        {selectedRequest && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Business Name</label>
                <p style={{ fontWeight: 600 }}>{selectedRequest.name}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Category</label>
                <p>{selectedRequest.category}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Email</label>
                <p>{selectedRequest.email}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Phone</label>
                <p>{selectedRequest.phone}</p>
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
    </motion.div>
  );
}
