import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineEye, HiOutlineBan, HiOutlineMail } from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import { users } from '../data/mockData';

export default function Users() {
  const [activeTab, setActiveTab] = useState('all');
  const [data, setData] = useState(users);

  const filteredData =
    activeTab === 'all'
      ? data
      : data.filter((u) => u.status === activeTab);

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: 'User',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="avatar"
            style={{
              background: `hsl(${val.charCodeAt(0) * 5}, 60%, 88%)`,
              color: `hsl(${val.charCodeAt(0) * 5}, 60%, 35%)`,
            }}
          >
            {val.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'city', label: 'City' },
    {
      key: 'searches',
      label: 'Searches',
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    { key: 'lastActive', label: 'Last Active' },
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
          <button className="btn btn-outline btn-sm btn-icon" title="View Profile">
            <HiOutlineEye />
          </button>
          <button className="btn btn-outline btn-sm btn-icon" title="Send Email">
            <HiOutlineMail />
          </button>
          {row.status === 'active' && (
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="Suspend"
              style={{ color: 'var(--danger)' }}
              onClick={() =>
                setData((prev) =>
                  prev.map((u) => (u.id === row.id ? { ...u, status: 'suspended' } : u))
                )
              }
            >
              <HiOutlineBan />
            </button>
          )}
        </div>
      ),
    },
  ];

  const counts = {
    all: data.length,
    active: data.filter((u) => u.status === 'active').length,
    suspended: data.filter((u) => u.status === 'suspended').length,
    inactive: data.filter((u) => u.status === 'inactive').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Users"
        subtitle="Manage public user accounts"
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
            searchPlaceholder="Search users..."
          />
        </div>
      </div>
    </motion.div>
  );
}
