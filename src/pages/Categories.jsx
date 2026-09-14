import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineChevronDown, HiOutlineChevronRight } from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import { categories } from '../data/mockData';

export default function Categories() {
  const [expanded, setExpanded] = useState({});
  const [showModal, setShowModal] = useState(false);

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Categories"
        subtitle="Manage entity categories & sub-categories"
      >
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> Add Category
        </button>
      </PageHeader>

      <div style={{ display: 'grid', gap: 12 }}>
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            className="card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '18px 24px',
                cursor: 'pointer',
                gap: 16,
              }}
              onClick={() => toggle(cat.id)}
            >
              <span style={{ fontSize: 28 }}>{cat.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{cat.name}</span>
                  <StatusBadge status={cat.status} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {cat.count} entities · {cat.subcategories.length} subcategories
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="btn btn-outline btn-sm btn-icon"
                  onClick={(e) => { e.stopPropagation(); }}
                  title="Edit"
                >
                  <HiOutlinePencil />
                </button>
                <button
                  className="btn btn-outline btn-sm btn-icon"
                  onClick={(e) => { e.stopPropagation(); }}
                  title="Delete"
                  style={{ color: 'var(--danger)' }}
                >
                  <HiOutlineTrash />
                </button>
                <span style={{ color: 'var(--text-light)', fontSize: 18, marginLeft: 8 }}>
                  {expanded[cat.id] ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
                </span>
              </div>
            </div>

            {expanded[cat.id] && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                style={{
                  borderTop: '1px solid var(--border-light)',
                  padding: '16px 24px 20px',
                  paddingLeft: 76,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {cat.subcategories.map((sub, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        background: 'var(--bg)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text)',
                      }}
                    >
                      {sub}
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-light)',
                          cursor: 'pointer',
                          fontSize: 14,
                          padding: 0,
                          display: 'flex',
                        }}
                      >
                        <HiOutlinePencil />
                      </button>
                    </div>
                  ))}
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 16px',
                      background: 'var(--primary-ultra-light)',
                      color: 'var(--primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      fontWeight: 600,
                      border: '1px dashed var(--primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <HiOutlinePlus size={14} /> Add Sub-category
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Category"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setShowModal(false)}>Create Category</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Category Name</label>
          <input className="form-input" placeholder="e.g., Entertainment" />
        </div>
        <div className="form-group">
          <label className="form-label">Icon (Emoji)</label>
          <input className="form-input" placeholder="e.g., 🎬" />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select">
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </Modal>
    </motion.div>
  );
}
