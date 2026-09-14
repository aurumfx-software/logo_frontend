import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineLocationMarker } from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import StatsCard from '../components/UI/StatsCard';
import { geographyData } from '../data/mockData';

export default function Geography() {
  const [showModal, setShowModal] = useState(false);

  const totalCities = geographyData.length;
  const activeCities = geographyData.filter((g) => g.status === 'active').length;
  const totalZones = geographyData.reduce((sum, g) => sum + g.zones, 0);

  const columns = [
    {
      key: 'city',
      label: 'City',
      render: (val, row) => (
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
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            <HiOutlineLocationMarker />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{val}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{row.state}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'zones',
      label: 'Zones',
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    {
      key: 'merchants',
      label: 'Merchants',
      render: (val) => <span style={{ fontWeight: 600 }}>{val.toLocaleString()}</span>,
    },
    {
      key: 'users',
      label: 'Users',
      render: (val) => <span style={{ fontWeight: 600 }}>{val.toLocaleString()}</span>,
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
      render: () => (
        <button className="btn btn-outline btn-sm btn-icon" title="Edit">
          <HiOutlinePencil />
        </button>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Geography"
        subtitle="Manage service-area configuration (city/zone-wise rollout)"
      >
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> Add City
        </button>
      </PageHeader>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatsCard
          icon={<HiOutlineLocationMarker size={22} />}
          label="Total Cities"
          value={totalCities}
          color="primary"
          delay={0}
        />
        <StatsCard
          icon={<HiOutlineLocationMarker size={22} />}
          label="Active Cities"
          value={activeCities}
          color="success"
          delay={1}
        />
        <StatsCard
          icon={<HiOutlineLocationMarker size={22} />}
          label="Total Zones"
          value={totalZones}
          color="info"
          delay={2}
        />
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <DataTable
            columns={columns}
            data={geographyData}
            searchPlaceholder="Search cities..."
          />
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New City"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setShowModal(false)}>Add City</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">City Name</label>
          <input className="form-input" placeholder="e.g., Chandigarh" />
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <input className="form-input" placeholder="e.g., Punjab" />
        </div>
        <div className="form-group">
          <label className="form-label">Initial Status</label>
          <select className="form-select">
            <option>Pending</option>
            <option>Active</option>
          </select>
        </div>
      </Modal>
    </motion.div>
  );
}
