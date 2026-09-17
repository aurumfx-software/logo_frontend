import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineClipboardCheck,
  HiOutlineCollection,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineSpeakerphone,
  HiOutlineExclamationCircle,
  HiOutlineDocumentText,
  HiOutlineGlobe,
  HiOutlineChartBar,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const navSections = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    ],
  },
  {
    title: 'Management',
    items: [
      { path: '/registration-requests', icon: HiOutlineClipboardCheck, label: 'Registrations', badge: 12 },
      { path: '/categories', icon: HiOutlineCollection, label: 'Categories' },
      { path: '/merchants', icon: HiOutlineOfficeBuilding, label: 'Merchants' },
      { path: '/users', icon: HiOutlineUsers, label: 'Users' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { path: '/promotions', icon: HiOutlineSpeakerphone, label: 'Promotions' },
      { path: '/complaints', icon: HiOutlineExclamationCircle, label: 'Complaints', badge: 5 },
      { path: '/content', icon: HiOutlineDocumentText, label: 'Content' },
      { path: '/geography', icon: HiOutlineGlobe, label: 'Geography' },
      { path: '/reports', icon: HiOutlineChartBar, label: 'Reports' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">L</div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Logo Admin</span>
            <span className="sidebar-brand-sub">AurumFX Pvt Ltd</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <div className="sidebar-section-title">{section.title}</div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive && location.pathname === item.path ? 'active' : ''}`
                }
                end={item.path === '/'}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-link-icon">
                  <item.icon />
                </span>
                {!collapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="sidebar-link-badge">{item.badge}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer with user info + logout */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-footer-user" style={{ marginBottom: 8 }}>
            <div className="sidebar-footer-avatar">
              {user?.initials || 'A'}
            </div>
            <div className="sidebar-footer-info">
              <div className="sidebar-footer-name">{user?.name || 'Admin User'}</div>
              <div className="sidebar-footer-role">{user?.role || 'Super Admin'}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-link"
          title={collapsed ? 'Logout' : undefined}
          style={{
            width: '100%',
            color: '#EF4444',
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span className="sidebar-link-icon">
            <HiOutlineLogout />
          </span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
