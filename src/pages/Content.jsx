import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineRefresh,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import Modal from '../components/UI/Modal';
import { contentApi } from '../api/operationsApi';

export default function Content() {
  const [activeTab, setActiveTab] = useState('terms');
  const [policies, setPolicies] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEditPolicyModal, setShowEditPolicyModal] = useState(false);
  const [policyContentEdit, setPolicyContentEdit] = useState('');
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', status: 'active' });
  const [submitting, setSubmitting] = useState(false);

  const loadAllContent = async () => {
    setLoading(true);
    try {
      const [policiesData, notifsData] = await Promise.all([
        contentApi.getPolicies().catch(() => []),
        contentApi.getNotifications().catch(() => []),
      ]);

      const policyMap = {};
      if (Array.isArray(policiesData)) {
        policiesData.forEach((p) => {
          policyMap[p.key] = p;
        });
      }
      setPolicies(policyMap);
      setNotifications(Array.isArray(notifsData) ? notifsData : []);
    } catch (err) {
      console.error('Error loading content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllContent();
  }, []);

  const handleSavePolicy = async () => {
    setSubmitting(true);
    try {
      const updated = await contentApi.updatePolicy(activeTab, policyContentEdit);
      setPolicies((prev) => ({ ...prev, [activeTab]: updated }));
      setShowEditPolicyModal(false);
      alert(`${activeTab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'} successfully saved to database!`);
    } catch (err) {
      alert(`Failed to save policy: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotif.title.trim() || !newNotif.message.trim()) return;
    setSubmitting(true);
    try {
      const created = await contentApi.createNotification({
        title: newNotif.title,
        message: newNotif.message,
        status: newNotif.status,
        sent: '0',
      });
      setNotifications([created, ...notifications]);
      setShowNotifModal(false);
      setNewNotif({ title: '', message: '', status: 'active' });
    } catch (err) {
      alert(`Failed to create notification: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await contentApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const currentPolicy = policies[activeTab] || {
    label: activeTab === 'terms' ? 'Terms and Conditions' : 'Privacy Policy',
    last_updated: '2026-10-11',
    content:
      activeTab === 'terms'
        ? 'Welcome to Logo Kerala. These Terms and Conditions govern your access to and use of our directory platform...'
        : 'At Logo Kerala, we respect your privacy. This policy outlines how information is collected and protected...',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Content Management"
        subtitle="Manage app legal policies (Terms & Conditions, Privacy Policy) & notifications"
      >
        <button className="btn btn-outline" onClick={loadAllContent}>
          <HiOutlineRefresh /> Refresh
        </button>
      </PageHeader>

      <div className="tabs">
        {[
          { key: 'terms', label: 'Terms & Conditions', icon: <HiOutlineDocumentText /> },
          { key: 'privacy', label: 'Privacy Policy', icon: <HiOutlineShieldCheck /> },
          { key: 'notifications', label: 'Push Notifications', icon: <HiOutlineBell /> },
        ].map((s) => (
          <button
            key={s.key}
            className={`tab ${activeTab === s.key ? 'active' : ''}`}
            onClick={() => setActiveTab(s.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-header-title">
              {activeTab === 'terms' && 'Terms and Conditions'}
              {activeTab === 'privacy' && 'Privacy Policy'}
              {activeTab === 'notifications' && `Push Notifications (${notifications.length})`}
            </h3>
            {(activeTab === 'terms' || activeTab === 'privacy') && (
              <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                Last updated in database: {currentPolicy.last_updated || '2026-10-11'}
              </p>
            )}
          </div>

          {(activeTab === 'terms' || activeTab === 'privacy') && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setPolicyContentEdit(currentPolicy.content);
                setShowEditPolicyModal(true);
              }}
            >
              <HiOutlinePencil /> Edit Policy
            </button>
          )}

          {activeTab === 'notifications' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowNotifModal(true)}>
              <HiOutlinePlus /> Create Notification
            </button>
          )}
        </div>

        <div className="card-body">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading legal policies...
            </div>
          ) : (
            <>
              {/* Terms & Privacy */}
              {(activeTab === 'terms' || activeTab === 'privacy') && (
                <div
                  style={{
                    background: 'var(--bg)',
                    borderRadius: 'var(--radius-md)',
                    padding: 24,
                    whiteSpace: 'pre-line',
                    fontFamily: 'inherit',
                    lineHeight: 1.7,
                    color: 'var(--text)',
                    fontSize: 14,
                    border: '1px solid var(--border-color)',
                    maxHeight: '600px',
                    overflowY: 'auto',
                  }}
                >
                  {currentPolicy.content}
                </div>
              )}

              {/* Push Notifications */}
              {activeTab === 'notifications' && (
                <div style={{ display: 'grid', gap: 12 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-light)' }}>
                      No push notifications yet. Click "Create Notification" above to send one.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: 16,
                          background: 'var(--bg)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--primary-ultra-light)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            flexShrink: 0,
                          }}
                        >
                          <HiOutlineBell />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{notif.title}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {notif.message}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: notif.status === 'active' ? 'var(--success)' : 'var(--text-light)',
                              background: notif.status === 'active' ? 'var(--success-light)' : 'rgba(0,0,0,0.05)',
                              padding: '3px 8px',
                              borderRadius: 4,
                            }}
                          >
                            {notif.status}
                          </span>
                          <button
                            className="btn btn-outline btn-sm btn-icon"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDeleteNotification(notif.id)}
                            title="Delete Notification"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Policy Modal */}
      <Modal
        isOpen={showEditPolicyModal}
        onClose={() => setShowEditPolicyModal(false)}
        title={`Edit ${activeTab === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowEditPolicyModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleSavePolicy}>
              {submitting ? 'Saving to Database...' : 'Save Policy'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">
            Policy Content (Will be displayed to consumers on the website and mobile app)
          </label>
          <textarea
            className="form-input"
            rows={14}
            value={policyContentEdit}
            onChange={(e) => setPolicyContentEdit(e.target.value)}
            style={{ fontSize: 13.5, lineHeight: 1.6 }}
          />
        </div>
      </Modal>

      {/* Create Notification Modal */}
      <Modal
        isOpen={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        title="Create Push Notification"
        size="md"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowNotifModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleCreateNotification}>
              {submitting ? 'Creating...' : 'Send Notification'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Notification Title *</label>
          <input
            className="form-input"
            placeholder="e.g., Weekend Special Deals"
            value={newNotif.title}
            onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="e.g., Get up to 50% discount on food orders..."
            value={newNotif.message}
            onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={newNotif.status}
            onChange={(e) => setNewNotif({ ...newNotif, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
          </select>
        </div>
      </Modal>
    </motion.div>
  );
}
