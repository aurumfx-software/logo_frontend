import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineSpeakerphone,
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
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEditPolicyModal, setShowEditPolicyModal] = useState(false);
  const [policyContentEdit, setPolicyContentEdit] = useState('');
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', status: 'active' });
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', message: '', pinned: false });
  const [submitting, setSubmitting] = useState(false);

  const loadAllContent = async () => {
    setLoading(true);
    try {
      const [policiesData, notifsData, annsData] = await Promise.all([
        contentApi.getPolicies().catch(() => []),
        contentApi.getNotifications().catch(() => []),
        contentApi.getAnnouncements().catch(() => []),
      ]);

      const policyMap = {};
      policiesData.forEach((p) => {
        policyMap[p.key] = p;
      });
      setPolicies(policyMap);
      setNotifications(notifsData);
      setAnnouncements(annsData);
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

  const handleCreateAnnouncement = async () => {
    if (!newAnn.title.trim() || !newAnn.message.trim()) return;
    setSubmitting(true);
    try {
      const created = await contentApi.createAnnouncement(newAnn);
      setAnnouncements([created, ...announcements]);
      setShowAnnModal(false);
      setNewAnn({ title: '', message: '', pinned: false });
    } catch (err) {
      alert(`Failed to create announcement: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await contentApi.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const currentPolicy = policies[activeTab] || {
    label: activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy',
    last_updated: '2024-08-15',
    content:
      activeTab === 'terms'
        ? 'These Terms of Service govern your use of the Logo App platform...'
        : 'Your privacy is important to us. This Privacy Policy explains how we collect and protect data...',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Content Management"
        subtitle="Manage app content, policies, notifications & announcements in PostgreSQL"
      >
        <button className="btn btn-outline" onClick={loadAllContent}>
          <HiOutlineRefresh /> Refresh
        </button>
      </PageHeader>

      <div className="tabs">
        {[
          { key: 'terms', label: 'Terms of Service', icon: <HiOutlineDocumentText /> },
          { key: 'privacy', label: 'Privacy Policy', icon: <HiOutlineShieldCheck /> },
          { key: 'notifications', label: 'Push Notifications', icon: <HiOutlineBell /> },
          { key: 'announcements', label: 'Announcements', icon: <HiOutlineSpeakerphone /> },
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
              {activeTab === 'terms' && 'Terms of Service'}
              {activeTab === 'privacy' && 'Privacy Policy'}
              {activeTab === 'notifications' && `Push Notifications (${notifications.length})`}
              {activeTab === 'announcements' && `Announcements (${announcements.length})`}
            </h3>
            {(activeTab === 'terms' || activeTab === 'privacy') && (
              <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                Last updated: {currentPolicy.last_updated}
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

          {activeTab === 'announcements' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAnnModal(true)}>
              <HiOutlinePlus /> Create Announcement
            </button>
          )}
        </div>

        <div className="card-body">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading content...
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
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {currentPolicy.content}
                </div>
              )}

              {/* Push Notifications */}
              {activeTab === 'notifications' && (
                <div style={{ display: 'grid', gap: 12 }}>
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: 16,
                        background: 'var(--bg)',
                        borderRadius: 'var(--radius-md)',
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
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div>
                          <span
                            className={`badge ${
                              notif.status === 'active'
                                ? 'badge-active'
                                : notif.status === 'scheduled'
                                ? 'badge-pending'
                                : 'badge-info'
                            }`}
                          >
                            {notif.status}
                          </span>
                          <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
                            Sent: {notif.sent}
                          </div>
                        </div>
                        <button
                          className="btn btn-outline btn-sm btn-icon"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDeleteNotification(notif.id)}
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Announcements */}
              {activeTab === 'announcements' && (
                <div style={{ display: 'grid', gap: 12 }}>
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 16,
                        padding: 16,
                        background: 'var(--bg)',
                        borderRadius: 'var(--radius-md)',
                        border: ann.pinned ? '1px solid var(--primary)' : '1px solid transparent',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-sm)',
                          background: ann.pinned ? 'var(--primary-ultra-light)' : '#FEF3C7',
                          color: ann.pinned ? 'var(--primary)' : '#F59E0B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        <HiOutlineSpeakerphone />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{ann.title}</span>
                          {ann.pinned && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: 'var(--primary)',
                                background: 'var(--primary-ultra-light)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                              }}
                            >
                              PINNED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                          {ann.message}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 6 }}>
                          {ann.date}
                        </div>
                      </div>
                      <button
                        className="btn btn-outline btn-sm btn-icon"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  ))}
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
        title={`Edit ${activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowEditPolicyModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleSavePolicy}>
              {submitting ? 'Saving...' : 'Save Policy'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Policy Content (Markdown / Plain Text)</label>
          <textarea
            className="form-input"
            rows={10}
            value={policyContentEdit}
            onChange={(e) => setPolicyContentEdit(e.target.value)}
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

      {/* Create Announcement Modal */}
      <Modal
        isOpen={showAnnModal}
        onClose={() => setShowAnnModal(false)}
        title="Create Announcement"
        size="md"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowAnnModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleCreateAnnouncement}>
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            className="form-input"
            placeholder="e.g., Service Launch in Kannur"
            value={newAnn.title}
            onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Announcement message content..."
            value={newAnn.message}
            onChange={(e) => setNewAnn({ ...newAnn, message: e.target.value })}
          />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id="pinned_ann"
            checked={newAnn.pinned}
            onChange={(e) => setNewAnn({ ...newAnn, pinned: e.target.checked })}
          />
          <label htmlFor="pinned_ann" style={{ fontSize: 13, cursor: 'pointer', margin: 0 }}>
            Pin this announcement to the top
          </label>
        </div>
      </Modal>
    </motion.div>
  );
}
