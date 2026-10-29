import React, { useState, useRef, useEffect } from 'react';
import {
  HiOutlineMenu,
  HiOutlineSearch,
  HiOutlineBell,
  HiOutlineMoon,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineChevronDown,
  HiOutlineSparkles,
  HiOutlineOfficeBuilding,
  HiOutlineKey,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../api/notificationApi';

function formatNotifTime(isoString) {
  if (!isoString) return 'Recent';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recent';
  }
}

export default function Header({ title, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications(25);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.warn('Failed to load notifications in header:', err);
    }
  };

  // Initial load & All-time Polling (every 12 seconds for real-time alert!)
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 12000);

    const handleFocus = () => loadNotifications();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('registration-count-updated', loadNotifications);
    window.addEventListener('promotion-count-updated', loadNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('registration-count-updated', loadNotifications);
      window.removeEventListener('promotion-count-updated', loadNotifications);
    };
  }, []);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markNotificationAsRead(notif.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    setNotifDropdownOpen(false);

    const type = notif.type || '';
    if (type === 'PROMOTION_REQUEST' || type === 'PROMOTION_APPROVED' || type === 'PROMOTION_REJECTED') {
      navigate('/promotions');
    } else if (type === 'PROMO_ACCESS_REQUEST') {
      navigate('/registration-requests?section=promo-access');
    } else if (type === 'MERCHANT_REGISTRATION') {
      navigate('/registration-requests');
    } else if (type === 'PROMO_ACCESS_APPROVED') {
      navigate('/merchant');
    } else {
      navigate('/registration-requests');
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <HiOutlineMenu />
        </button>
        <h2 className="header-title">{title}</h2>
      </div>

      <div className="header-right">
        <div className="header-search">
          <HiOutlineSearch className="header-search-icon" />
          <input type="text" placeholder="Search anything..." />
        </div>

        <button className="header-icon-btn" aria-label="Toggle theme">
          <HiOutlineMoon />
        </button>

        {/* Real-time Notifications Bell & Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="header-icon-btn"
            aria-label="Notifications"
            onClick={() => setNotifDropdownOpen((prev) => !prev)}
            style={{ position: 'relative' }}
          >
            <HiOutlineBell />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 0 0 2px white',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {notifDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: -40,
                  width: 380,
                  maxWidth: '90vw',
                  background: '#FFFFFF',
                  borderRadius: 14,
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                  zIndex: 999999,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid #F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#F9FAFB',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          background: '#FEE2E2',
                          color: '#DC2626',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 10,
                        }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '36px 20px', textAlign: 'center', color: '#6B7280' }}>
                      <HiOutlineBell style={{ fontSize: 32, color: '#9CA3AF', margin: '0 auto 8px', display: 'block' }} />
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>No notifications right now</p>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>New merchant & promotion requests will appear here</span>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isUnread = !notif.is_read;
                      const type = notif.type || 'INFO';
                      let icon = <HiOutlineBell style={{ color: '#6B7280' }} />;
                      let iconBg = '#F3F4F6';
                      if (type === 'PROMOTION_REQUEST' || type === 'PROMOTION_APPROVED') {
                        icon = <HiOutlineSparkles style={{ color: '#D97706' }} />;
                        iconBg = '#FEF3C7';
                      } else if (type === 'MERCHANT_REGISTRATION') {
                        icon = <HiOutlineOfficeBuilding style={{ color: '#2563EB' }} />;
                        iconBg = '#DBEAFE';
                      } else if (type === 'PROMO_ACCESS_REQUEST' || type === 'PROMO_ACCESS_APPROVED') {
                        icon = <HiOutlineKey style={{ color: '#059669' }} />;
                        iconBg = '#D1FAE5';
                      }

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start',
                            borderBottom: '1px solid #F3F4F6',
                            background: isUnread ? '#F0FDF4' : '#FFFFFF',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!isUnread) e.currentTarget.style.background = '#F9FAFB';
                          }}
                          onMouseLeave={(e) => {
                            if (!isUnread) e.currentTarget.style.background = '#FFFFFF';
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: iconBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          >
                            {icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <span style={{ fontWeight: isUnread ? 700 : 600, fontSize: 13, color: '#111827' }}>
                                {notif.title}
                              </span>
                              {isUnread && (
                                <span
                                  style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: '#10B981',
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </div>
                            <p
                              style={{
                                margin: '3px 0 4px',
                                fontSize: 12,
                                color: '#4B5563',
                                lineHeight: 1.4,
                                wordBreak: 'break-word',
                              }}
                            >
                              {notif.message}
                            </p>
                            <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                              {formatNotifTime(notif.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: '10px 16px',
                    borderTop: '1px solid #F3F4F6',
                    background: '#F9FAFB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      navigate('/registration-requests');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    View All Requests →
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifDropdownOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6B7280',
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Avatar & Dropdown Container */}
        <div style={{ position: 'relative', zIndex: 999999 }} ref={dropdownRef}>
          <button
            className="header-avatar-btn"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-label="User profile menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <div className="header-avatar" title={user?.name || 'Admin User'}>
              {user?.initials || 'A'}
            </div>
            <HiOutlineChevronDown
              size={14}
              style={{
                color: 'var(--text-secondary)',
                transition: 'transform 0.2s ease',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Profile Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 250,
                  maxWidth: 'calc(100vw - 24px)',
                  background: 'white',
                  borderRadius: 16,
                  boxShadow: '0 20px 45px -10px rgba(0,0,0,0.25), 0 6px 18px rgba(0,0,0,0.1)',
                  border: '1px solid #E5E7EB',
                  zIndex: 999999,
                  overflow: 'hidden',
                }}
              >
                {/* User Info Header */}
                <div
                  style={{
                    padding: '16px 18px',
                    borderBottom: '1px solid #F3F4F6',
                    background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                    color: 'white',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6C63FF, #A5B4FC)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      }}
                    >
                      {user?.initials || 'A'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}
                      >
                        {user?.name || 'Admin User'}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#C7D2FE',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}
                      >
                        {user?.email || 'admin@locality.com'}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(4px)',
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#E0E7FF',
                    }}
                  >
                    <HiOutlineShieldCheck size={13} />
                    {user?.role || 'Super Admin'}
                  </div>
                </div>

                {/* Dropdown Options */}
                <div style={{ padding: '8px 6px' }}>
                  <div
                    style={{
                      padding: '8px 12px',
                      fontSize: 12,
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      borderRadius: 8,
                    }}
                  >
                    <HiOutlineUser size={16} style={{ color: '#6C63FF' }} />
                    <span>Role: <strong>{user?.role || 'Admin'}</strong></span>
                  </div>

                  <div
                    style={{
                      height: 1,
                      background: '#F3F4F6',
                      margin: '6px 0',
                    }}
                  />

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 8,
                      color: '#EF4444',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#FEE2E2';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <HiOutlineLogout size={18} />
                    <span>Log Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

