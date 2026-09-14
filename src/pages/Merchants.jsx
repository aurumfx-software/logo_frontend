import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineEye,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineStar,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { merchants } from '../data/mockData';

export default function Merchants() {
  const [activeTab, setActiveTab] = useState('all');
  const [data, setData] = useState(merchants);
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  const filteredData =
    activeTab === 'all'
      ? data
      : data.filter((m) => m.status === activeTab);

  const handleStatusChange = (id, newStatus) => {
    setData((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)));
    setSelectedMerchant(null);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: 'Merchant Name',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-ultra-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {val?.charAt(0)}
          </div>
          <span style={{ fontWeight: 600 }}>{val}</span>
        </div>
      ),
    },
    { key: 'category', label: 'Category' },
    { key: 'city', label: 'City' },
    {
      key: 'rating',
      label: 'Rating',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <HiOutlineStar style={{ color: '#FFB946', fontSize: 14 }} />
          <span style={{ fontWeight: 600 }}>{val}</span>
        </div>
      ),
    },
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
            onClick={() => setSelectedMerchant(row)}
          >
            <HiOutlineEye />
          </button>
          {row.status === 'active' && (
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="Suspend"
              style={{ color: 'var(--danger)' }}
              onClick={() => handleStatusChange(row.id, 'suspended')}
            >
              <HiOutlineBan />
            </button>
          )}
          {row.status === 'suspended' && (
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="Reactivate"
              style={{ color: 'var(--success)' }}
              onClick={() => handleStatusChange(row.id, 'active')}
            >
              <HiOutlineCheckCircle />
            </button>
          )}
        </div>
      ),
    },
  ];

  const counts = {
    all: data.length,
    active: data.filter((m) => m.status === 'active').length,
    suspended: data.filter((m) => m.status === 'suspended').length,
    inactive: data.filter((m) => m.status === 'inactive').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Merchants"
        subtitle="View, search, and manage all registered merchants"
      />

      <div className="tabs">
        {['all', 'active', 'suspended', 'inactive'].map((tab) => (
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
        <div className="card-body" style={{ padding: 0 }}>
          <DataTable
            columns={columns}
            data={filteredData}
            searchPlaceholder="Search merchants..."
          />
        </div>
      </div>

      <Modal
        isOpen={!!selectedMerchant}
        onClose={() => setSelectedMerchant(null)}
        title="Merchant Details"
        size="lg"
      >
        {selectedMerchant && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 22,
                }}
              >
                {selectedMerchant.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>{selectedMerchant.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {selectedMerchant.category} · {selectedMerchant.city}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Status</label>
                <StatusBadge status={selectedMerchant.status} />
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Rating</label>
                <p style={{ fontWeight: 600 }}>⭐ {selectedMerchant.rating} ({selectedMerchant.reviews} reviews)</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Joined</label>
                <p>{selectedMerchant.joined}</p>
              </div>
              <div>
                <label className="form-label" style={{ color: 'var(--text-light)' }}>Merchant ID</label>
                <p style={{ fontFamily: 'monospace' }}>{selectedMerchant.id}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
