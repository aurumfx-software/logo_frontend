import React, { useState, useEffect } from 'react';
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
import { normalizeRole, getRoleDisplayTitle, ROLES, getStaffPermissions } from '../../utils/rbac';

const ALL_NAV_ITEMS = [
  {
    title: 'Main Navigation',
    items: [
      { key: 'dashboard', path: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    ],
  },
  {
    title: 'Directory & Management',
    items: [
      { key: 'registrations', path: '/registration-requests', icon: HiOutlineClipboardCheck, label: 'Registrations', badge: 12 },
      { key: 'merchants', path: '/merchants', icon: HiOutlineOfficeBuilding, label: 'Merchants' },
      { key: 'categories', path: '/categories', icon: HiOutlineCollection, label: 'Categories' },
      { key: 'users', path: '/users', icon: HiOutlineUsers, label: 'Staff & User Accounts' },
    ],
  },
  {
    title: 'Operations & Insights',
    items: [
      { key: 'promotions', path: '/promotions', icon: HiOutlineSpeakerphone, label: 'Promotions' },
      { key: 'complaints', path: '/complaints', icon: HiOutlineExclamationCircle, label: 'Complaints', badge: 5 },
      { key: 'content', path: '/content', icon: HiOutlineDocumentText, label: 'Content' },
      { key: 'geography', path: '/geography', icon: HiOutlineGlobe, label: 'Geography' },
      { key: 'reports', path: '/reports', icon: HiOutlineChartBar, label: 'Reports' },
    ],
  },
];

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [staffPerms, setStaffPerms] = useState(() => getStaffPermissions());

  const userRole = normalizeRole(user);
  const isAdminUser = userRole === ROLES.ADMIN;

  useEffect(() => {
    const handlePermChange = () => {
      setStaffPerms(getStaffPermissions());
    };
    window.addEventListener('staff-permissions-updated', handlePermChange);
    return () => {
      window.removeEventListener('staff-permissions-updated', handlePermChange);
    };
  }, []);

  const handleLogout = () => {
    if (onCloseMobile) onCloseMobile();
    logout();
    navigate('/login', { replace: true });
  };

  // Filter navigation items dynamically based on role and permissions set by Admin
  const navSections = ALL_NAV_ITEMS.map((section) => {
    const allowedItems = section.items.filter((item) => {
      if (isAdminUser) return true;
      // For Staff users, check if Admin has granted permission for this module
      return !!staffPerms[item.key];
    });
    return {
      title: section.title,
      items: allowedItems,
    };
  }).filter((section) => section.items.length > 0);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">L</div>
        {(!collapsed || mobileOpen) && (
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
            {(!collapsed || mobileOpen) && (
              <div className="sidebar-section-title">{section.title}</div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                }}
                className={({ isActive }) =>
                  `sidebar-link ${isActive && location.pathname === item.path ? 'active' : ''}`
                }
                end={item.path === '/'}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <span className="sidebar-link-icon">
                  <item.icon />
                </span>
                {(!collapsed || mobileOpen) && (
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
              {user?.initials || (isAdminUser ? 'A' : 'S')}
            </div>
            <div className="sidebar-footer-info">
              <div className="sidebar-footer-name">{user?.name || (isAdminUser ? 'Admin User' : 'Staff User')}</div>
              <div className="sidebar-footer-role">{getRoleDisplayTitle(user)}</div>
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
