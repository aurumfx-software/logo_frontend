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
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

        <button className="header-icon-btn" aria-label="Notifications">
          <HiOutlineBell />
          <span className="badge"></span>
        </button>

        {/* Profile Avatar & Dropdown Container */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
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
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  width: 250,
                  background: 'white',
                  borderRadius: 16,
                  boxShadow: '0 20px 35px -10px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.06)',
                  border: '1px solid #E5E7EB',
                  zIndex: 1000,
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

