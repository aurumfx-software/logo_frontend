import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlineLocationMarker, HiOutlineTrash, HiOutlineRefresh } from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import StatsCard from '../components/UI/StatsCard';
import { geographyApi } from '../api/operationsApi';
import { geographyData as fallbackGeography } from '../data/mockData';

export default function Geography() {
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ total_cities: 0, active_cities: 0, total_zones: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newCity, setNewCity] = useState({
    city: '',
    state: '',
    zones: 1,
    status: 'Active',
  });

  const loadGeography = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        geographyApi.list(),
        geographyApi.getSummary(),
      ]);
      if (list && list.length > 0) {
        setData(list);
      } else {
        setData(fallbackGeography);
      }
      if (sum) {
        setSummary(sum);
      }
    } catch (err) {
      console.error('Error loading geography, using fallback:', err);
      setData(fallbackGeography);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeography();
  }, []);

  const handleAddCity = async () => {
    if (!newCity.city.trim() || !newCity.state.trim()) return;
    setSubmitting(true);
    try {
      const created = await geographyApi.create({
        city: newCity.city,
        state: newCity.state,
        zones: parseInt(newCity.zones) || 1,
        status: newCity.status.toLowerCase(),
      });
      setData((prev) => [...prev, created]);
      setSummary((prev) => ({
        total_cities: prev.total_cities + 1,
        active_cities: newCity.status.toLowerCase() === 'active' ? prev.active_cities + 1 : prev.active_cities,
        total_zones: prev.total_zones + (parseInt(newCity.zones) || 1),
      }));
      setShowModal(false);
      setNewCity({ city: '', state: '', zones: 1, status: 'Active' });
    } catch (err) {
      alert(`Failed to add city: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this geography region?')) return;
    try {
      await geographyApi.delete(id);
      setData((prev) => prev.filter((g) => g.id !== id));
      setSummary((prev) => ({
        ...prev,
        total_cities: Math.max(0, prev.total_cities - 1),
      }));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

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
      render: (val) => <span style={{ fontWeight: 600 }}>{(val || 0).toLocaleString()}</span>,
    },
    {
      key: 'users',
      label: 'Users',
      render: (val) => <span style={{ fontWeight: 600 }}>{(val || 0).toLocaleString()}</span>,
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
        <button
          className="btn btn-outline btn-sm btn-icon"
          style={{ color: 'var(--danger)' }}
          title="Delete Region"
          onClick={() => handleDelete(row.id)}
        >
          <HiOutlineTrash />
        </button>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Geography"
        subtitle="Manage service-area configuration (city/zone-wise rollout) saved in PostgreSQL"
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={loadGeography}>
            <HiOutlineRefresh /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> Add City
          </button>
        </div>
      </PageHeader>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <StatsCard
          icon={<HiOutlineLocationMarker size={22} />}
          label="Total Cities"
          value={summary.total_cities || data.length}
          color="primary"
          delay={0}
        />
        <StatsCard
          icon={<HiOutlineLocationMarker size={22} />}
          label="Active Cities"
          value={summary.active_cities || data.filter((g) => g.status === 'active').length}
          color="success"
          delay={1}
        />
        <StatsCard
          icon={<HiOutlineLocationMarker size={22} />}
          label="Total Zones"
          value={summary.total_zones || data.reduce((sum, g) => sum + (g.zones || 0), 0)}
          color="info"
          delay={2}
        />
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search cities or states..."
          />
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New City / Region"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleAddCity}>
              {submitting ? 'Saving...' : 'Add City'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">City Name *</label>
          <input
            className="form-input"
            placeholder="e.g., Payyanur / Chandigarh"
            value={newCity.city}
            onChange={(e) => setNewCity({ ...newCity, city: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">State *</label>
          <input
            className="form-input"
            placeholder="e.g., Kerala / Punjab"
            value={newCity.state}
            onChange={(e) => setNewCity({ ...newCity, state: e.target.value })}
          />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Zones Count</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={newCity.zones}
              onChange={(e) => setNewCity({ ...newCity, zones: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select
              className="form-select"
              value={newCity.status}
              onChange={(e) => setNewCity({ ...newCity, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
