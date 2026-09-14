import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineSpeakerphone,
  HiOutlinePencil,
  HiOutlinePlus,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';

const contentSections = [
  {
    key: 'terms',
    label: 'Terms of Service',
    icon: <HiOutlineDocumentText />,
    lastUpdated: '2024-08-15',
    content:
      'These Terms of Service govern your use of the Logo App platform. By accessing or using our services, you agree to be bound by these terms...',
  },
  {
    key: 'privacy',
    label: 'Privacy Policy',
    icon: <HiOutlineShieldCheck />,
    lastUpdated: '2024-08-10',
    content:
      'Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform...',
  },
  {
    key: 'notifications',
    label: 'Push Notifications',
    icon: <HiOutlineBell />,
    lastUpdated: '2024-09-14',
    content: null,
    notifications: [
      { id: 1, title: 'Welcome new users', message: 'Welcome to Logo App! Discover local businesses near you.', status: 'active', sent: '24,850' },
      { id: 2, title: 'Festival Sale', message: 'Check out amazing Diwali deals from top merchants!', status: 'scheduled', sent: '—' },
      { id: 3, title: 'App Update', message: 'Update to the latest version for better performance.', status: 'sent', sent: '22,100' },
    ],
  },
  {
    key: 'announcements',
    label: 'Announcements',
    icon: <HiOutlineSpeakerphone />,
    lastUpdated: '2024-09-12',
    content: null,
    announcements: [
      { id: 1, title: 'New City Launch — Goa', message: 'We are expanding to Goa! Merchants can now register.', date: '2024-09-12', pinned: true },
      { id: 2, title: 'Platform Maintenance', message: 'Scheduled maintenance on Sep 20, 2–4 AM IST.', date: '2024-09-10', pinned: false },
      { id: 3, title: 'Merchant Guidelines Updated', message: 'Please review the updated guidelines for listing your business.', date: '2024-09-05', pinned: false },
    ],
  },
];

export default function Content() {
  const [activeTab, setActiveTab] = useState('terms');
  const section = contentSections.find((s) => s.key === activeTab);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Content Management"
        subtitle="Manage app content, policies, notifications & announcements"
      />

      <div className="tabs">
        {contentSections.map((s) => (
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
            <h3 className="card-header-title">{section.label}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
              Last updated: {section.lastUpdated}
            </p>
          </div>
          {section.content && (
            <button className="btn btn-primary btn-sm">
              <HiOutlinePencil /> Edit
            </button>
          )}
          {(section.notifications || section.announcements) && (
            <button className="btn btn-primary btn-sm">
              <HiOutlinePlus /> Create New
            </button>
          )}
        </div>
        <div className="card-body">
          {/* Terms & Privacy */}
          {section.content && (
            <div
              style={{
                background: 'var(--bg)',
                borderRadius: 'var(--radius-md)',
                padding: 24,
                fontSize: 14,
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
              }}
            >
              {section.content}
            </div>
          )}

          {/* Notifications */}
          {section.notifications && (
            <div style={{ display: 'grid', gap: 12 }}>
              {section.notifications.map((notif) => (
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
                  <div style={{ textAlign: 'right' }}>
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
                </div>
              ))}
            </div>
          )}

          {/* Announcements */}
          {section.announcements && (
            <div style={{ display: 'grid', gap: 12 }}>
              {section.announcements.map((ann) => (
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
                  <button className="btn btn-outline btn-sm btn-icon">
                    <HiOutlinePencil />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
