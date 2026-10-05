import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineEye, HiOutlineTrash, HiOutlineRefresh } from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import GoogleMapsLocationInput from '../components/UI/GoogleMapsLocationInput';
import { promotionsApi } from '../api/operationsApi';
import { promotions as fallbackPromotions } from '../data/mockData';

const promoCategories = [
  'Solar & Electricals',
  'Automobile & Spares',
  'Shopping & Fashion',
  'Hotels & Dining',
  'Healthcare & Medicals',
  'Interiors & Furniture',
  'Education & Training',
  'Aluminium Fabrication',
  'Travels & Transport',
];

export default function Promotions() {
  const [showModal, setShowModal] = useState(false);
  const [viewPromo, setViewPromo] = useState(null);
  const [editPromo, setEditPromo] = useState(null);
  const [promoList, setPromoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [newPromo, setNewPromo] = useState({
    title: '',
    type: 'Featured',
    placement: 'Home Top',
    category: 'Solar & Electricals',
    location: '',
    startDate: '',
    endDate: '',
  });

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const data = await promotionsApi.list();
      if (data && data.length > 0) {
        setPromoList(data);
      } else {
        setPromoList(fallbackPromotions);
      }
    } catch (err) {
      console.error('Error loading promotions from API, using fallback:', err);
      setPromoList(fallbackPromotions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleCreatePromo = async () => {
    if (!newPromo.title.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: newPromo.title,
        type: newPromo.type,
        placement: `${newPromo.placement} (${newPromo.category})`,
        category: newPromo.category,
        location: newPromo.location,
        start_date: newPromo.startDate || '2026-10-01',
        end_date: newPromo.endDate || '2026-12-31',
        status: 'active',
      };
      const created = await promotionsApi.create(payload);
      setPromoList([created, ...promoList.filter((p) => p.id !== created.id)]);
      setShowModal(false);
      setNewPromo({
        title: '',
        type: 'Featured',
        placement: 'Home Top',
        category: 'Solar & Electricals',
        location: '',
        startDate: '',
        endDate: '',
      });
    } catch (err) {
      alert(`Failed to save promotion: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePromo = async () => {
    if (!editPromo || !editPromo.title.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: editPromo.title,
        category: editPromo.category,
        type: editPromo.type,
        placement: editPromo.placement,
        location: editPromo.location,
        start_date: editPromo.start_date || editPromo.startDate,
        end_date: editPromo.end_date || editPromo.endDate,
        status: editPromo.status,
        impressions: parseInt(editPromo.impressions) || 0,
        clicks: parseInt(editPromo.clicks) || 0,
      };
      const updated = await promotionsApi.update(editPromo.id, payload);
      setPromoList((prev) =>
        prev.map((p) => (p.id === editPromo.id ? { ...p, ...updated } : p))
      );
      setEditPromo(null);
    } catch (err) {
      alert(`Failed to update promotion: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await promotionsApi.delete(id);
      setPromoList((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Promotions"
        subtitle="Manage banners, promotions & featured listings saved in PostgreSQL"
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={loadPromotions} title="Refresh live data">
            <HiOutlineRefresh /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> New Promotion
          </button>
        </div>
      </PageHeader>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading promotions from database...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {promoList.map((promo, idx) => (
            <motion.div
              key={promo.id || promo.promo_code || idx}
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
                  {promo.placement} · {promo.start_date || promo.startDate} → {promo.end_date || promo.endDate}
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
                      {(promo.impressions || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Clicks</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                      {(promo.clicks || 0).toLocaleString()}
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
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setViewPromo(promo)}
                  >
                    <HiOutlineEye /> View
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setEditPromo({ ...promo })}
                  >
                    <HiOutlinePencil /> Edit
                  </button>
                  <button
                    className="btn btn-outline btn-sm btn-icon"
                    style={{ color: 'var(--danger)' }}
                    title="Delete"
                    onClick={() => handleDeletePromo(promo.id)}
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Promotion Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Promotion"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleCreatePromo}>
              {submitting ? 'Saving...' : 'Create Promotion'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Promotion Title *</label>
          <input
            className="form-input"
            placeholder="e.g., Festival Offer - Up to 65% OFF"
            value={newPromo.title}
            onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Ad Category *</label>
            <select
              className="form-select"
              value={newPromo.category}
              onChange={(e) => setNewPromo({ ...newPromo, category: e.target.value })}
            >
              {promoCategories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Promotion Type</label>
            <select
              className="form-select"
              value={newPromo.type}
              onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value })}
            >
              <option value="Featured">Featured Ad</option>
              <option value="Sponsored">Sponsored Listing</option>
              <option value="Banner">Banner Carousel</option>
              <option value="Promotion">General Promotion</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Location Search (Google Maps Autocomplete) *</label>
          <GoogleMapsLocationInput
            value={newPromo.location}
            onChange={(loc) => setNewPromo({ ...newPromo, location: loc })}
            placeholder="Search Google Maps for target location (e.g. Payyanur, Kannur, Kochi)..."
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={newPromo.startDate}
              onChange={(e) => setNewPromo({ ...newPromo, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={newPromo.endDate}
              onChange={(e) => setNewPromo({ ...newPromo, endDate: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Promotion Modal */}
      <Modal
        isOpen={!!editPromo}
        onClose={() => setEditPromo(null)}
        title="Edit Promotion"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditPromo(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleUpdatePromo}>
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {editPromo && (
          <div>
            <div className="form-group">
              <label className="form-label">Promotion Title *</label>
              <input
                className="form-input"
                value={editPromo.title}
                onChange={(e) => setEditPromo({ ...editPromo, title: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Ad Category</label>
                <select
                  className="form-select"
                  value={editPromo.category || 'Shopping & Fashion'}
                  onChange={(e) => setEditPromo({ ...editPromo, category: e.target.value })}
                >
                  {promoCategories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Promotion Type</label>
                <select
                  className="form-select"
                  value={editPromo.type || 'Featured'}
                  onChange={(e) => setEditPromo({ ...editPromo, type: e.target.value })}
                >
                  <option value="Featured">Featured Ad</option>
                  <option value="Sponsored">Sponsored Listing</option>
                  <option value="Banner">Banner Carousel</option>
                  <option value="Promotion">General Promotion</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Placement Subtitle</label>
              <input
                className="form-input"
                value={editPromo.placement || ''}
                onChange={(e) => setEditPromo({ ...editPromo, placement: e.target.value })}
                placeholder="e.g., Home Top, Food Category"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location (Target Area / Google Maps Search)</label>
              <GoogleMapsLocationInput
                value={editPromo.location || ''}
                onChange={(loc) => setEditPromo({ ...editPromo, location: loc })}
                placeholder="e.g., Payyanur, Kannur, Kochi..."
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editPromo.start_date || editPromo.startDate || ''}
                  onChange={(e) => setEditPromo({ ...editPromo, start_date: e.target.value, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editPromo.end_date || editPromo.endDate || ''}
                  onChange={(e) => setEditPromo({ ...editPromo, end_date: e.target.value, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editPromo.status || 'active'}
                  onChange={(e) => setEditPromo({ ...editPromo, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Impressions</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={editPromo.impressions || 0}
                  onChange={(e) => setEditPromo({ ...editPromo, impressions: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Clicks</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={editPromo.clicks || 0}
                  onChange={(e) => setEditPromo({ ...editPromo, clicks: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* View Promotion Details Modal */}
      <Modal
        isOpen={!!viewPromo}
        onClose={() => setViewPromo(null)}
        title="Promotion Details"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                const toEdit = { ...viewPromo };
                setViewPromo(null);
                setEditPromo(toEdit);
              }}
            >
              <HiOutlinePencil /> Edit Promotion
            </button>
            <button className="btn btn-primary" onClick={() => setViewPromo(null)}>Close</button>
          </div>
        }
      >
        {viewPromo && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <StatusBadge status={viewPromo.status} />
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>{viewPromo.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{viewPromo.placement}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg)', padding: 14, borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Category:</span>
                <p style={{ fontWeight: 600 }}>{viewPromo.category || 'N/A'}</p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Type:</span>
                <p style={{ fontWeight: 600 }}>{viewPromo.type}</p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Location:</span>
                <p style={{ fontWeight: 600 }}>{viewPromo.location || 'All Areas'}</p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Date Range:</span>
                <p style={{ fontWeight: 600 }}>{viewPromo.start_date || viewPromo.startDate} → {viewPromo.end_date || viewPromo.endDate}</p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Total Impressions:</span>
                <p style={{ fontWeight: 700, color: 'var(--text)' }}>{(viewPromo.impressions || 0).toLocaleString()}</p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-light)' }}>Total Clicks:</span>
                <p style={{ fontWeight: 700, color: 'var(--primary)' }}>{(viewPromo.clicks || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
