import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineEye, HiOutlineTrash } from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { promotions } from '../data/mockData';

export default function Promotions() {
  const [showModal, setShowModal] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Promotions"
        subtitle="Manage banners, promotions & featured listings"
      >
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> New Promotion
        </button>
      </PageHeader>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {promotions.map((promo, idx) => (
          <motion.div
            key={promo.id}
            className="card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            style={{ overflow: 'hidden' }}
          >
            {/* Color strip */}
            <div
              style={{
                height: 4,
                background:
                  promo.status === 'active'
                    ? 'linear-gradient(90deg, var(--primary), var(--primary-light))'
                    : promo.status === 'pending'
                    ? 'linear-gradient(90deg, var(--warning), #FBBF24)'
                    : 'var(--border)',
              }}
            />
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <StatusBadge status={promo.status} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-light)',
                    background: 'var(--bg)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {promo.type}
                </span>
              </div>

              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{promo.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                {promo.placement} · {promo.startDate} → {promo.endDate}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  padding: '14px 0',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Impressions</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                    {promo.impressions.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Clicks</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                    {promo.clicks.toLocaleString()}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                  <HiOutlineEye /> View
                </button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                  <HiOutlinePencil /> Edit
                </button>
                <button className="btn btn-outline btn-sm btn-icon" style={{ color: 'var(--danger)' }}>
                  <HiOutlineTrash />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Promotion"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setShowModal(false)}>Create</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Title</label>
          <input className="form-input" placeholder="e.g., Diwali Special Offers" />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select">
              <option>Banner</option>
              <option>Featured</option>
              <option>Promotion</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Placement</label>
            <select className="form-select">
              <option>Home Top</option>
              <option>Home Middle</option>
              <option>Category Page</option>
            </select>
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" />
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
