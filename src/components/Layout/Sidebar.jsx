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
  HiOutlineShoppingBag,
  HiOutlineCreditCard,
  HiOutlineTag,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineTruck,
  HiOutlineCube,
  HiOutlineSparkles,
  HiOutlineQuestionMarkCircle,
  HiOutlinePhone,
  HiOutlineChatAlt2,
  HiOutlineHome,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole, getRoleDisplayTitle, ROLES, getStaffPermissions } from '../../utils/rbac';
import { fetchAdminWithdrawals } from '../../api/walletApi';
import { logoutCustomerSession } from '../../api/customerApi';
import { logoutMerchantSession } from '../../api/merchantApi';

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
      { key: 'customers', path: '/customers', icon: HiOutlineUserGroup, label: 'Customers' },
      { key: 'products', path: '/products', icon: HiOutlineShoppingBag, label: 'Products & Orders' },
      { key: 'categories', path: '/categories', icon: HiOutlineCollection, label: 'Categories' },
      { key: 'users', path: '/users', icon: HiOutlineUsers, label: 'Staff & User Accounts' },
    ],
  },
  {
    title: 'Operations & Insights',
    items: [
      { key: 'promotions', path: '/promotions', icon: HiOutlineSpeakerphone, label: 'Promotions' },
      { key: 'subscriptions', path: '/subscriptions', icon: HiOutlineTag, label: 'Subscriptions', adminOnly: true },
      { key: 'wallet', path: '/wallet', icon: HiOutlineCreditCard, label: 'Platform Wallet' },
      { key: 'withdrawals', path: '/withdrawals', icon: HiOutlineCreditCard, label: 'Withdrawals', adminOnly: true },
      { key: 'complaints', path: '/complaints', icon: HiOutlineExclamationCircle, label: 'Complaints' },
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
  const [regBadgeCount, setRegBadgeCount] = useState(() => {
    try {
      const stored = localStorage.getItem('registration_requests_count');
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        return isNaN(parsed) ? 12 : Math.max(0, parsed);
      }
    } catch (e) {}
    return 12;
  });
  const [withdrawalsBadgeCount, setWithdrawalsBadgeCount] = useState(() => {
    try {
      const stored = localStorage.getItem('pending_withdrawals_count');
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
      }
    } catch (e) {}
    return 0;
  });

  const userRole = normalizeRole(user);
  const rawRoleStr = String(user?.role || '').toUpperCase();
  const isAdminUser = userRole === ROLES.ADMIN;
  const isMerchantUser = !isAdminUser && (userRole === ROLES.MERCHANT || (user?.email || '').toLowerCase() === 'merchent@gmail.com');
  const isSellerUser = !isAdminUser && (userRole === ROLES.SELLER || (user?.email || '').toLowerCase() === 'user01@gmail.com');
  const isCustomerUser = !isAdminUser && !isMerchantUser && !isSellerUser && (rawRoleStr === 'FIELD_STAFF' || rawRoleStr === 'CUSTOMER' || userRole === ROLES.STAFF);

  const currentTabParam = new URLSearchParams(location.search || '').get('tab') || '';
  const isMerchantProductTabActive =
    isMerchantUser &&
    ['seller-orders', 'dispatched', 'my-products', 'sell-ad'].includes(currentTabParam);
  const [merchProductsOpen, setMerchProductsOpen] = useState(isMerchantProductTabActive);

  useEffect(() => {
    if (isMerchantProductTabActive) {
      setMerchProductsOpen(true);
    }
  }, [isMerchantProductTabActive]);

  useEffect(() => {
    const handlePermChange = () => {
      setStaffPerms(getStaffPermissions());
    };
    const handleCountChange = () => {
      try {
        const stored = localStorage.getItem('registration_requests_count');
        if (stored !== null) {
          const parsed = parseInt(stored, 10);
          setRegBadgeCount(isNaN(parsed) ? 0 : Math.max(0, parsed));
        }
      } catch (e) {}
    };
    const handleWithdrawalsCountChange = (e) => {
      try {
        const count = e?.detail ?? parseInt(localStorage.getItem('pending_withdrawals_count') || '0', 10);
        setWithdrawalsBadgeCount(isNaN(count) ? 0 : Math.max(0, count));
      } catch (e) {}
    };

    if (isAdminUser) {
      fetchAdminWithdrawals({ status: 'PENDING', page: 1, pageSize: 1 })
        .then((res) => {
          const total = res?.total ?? 0;
          setWithdrawalsBadgeCount(total);
          localStorage.setItem('pending_withdrawals_count', String(total));
        })
        .catch(() => {});
    }

    window.addEventListener('staff-permissions-updated', handlePermChange);
    window.addEventListener('registration-count-updated', handleCountChange);
    window.addEventListener('withdrawals-count-updated', handleWithdrawalsCountChange);
    return () => {
      window.removeEventListener('staff-permissions-updated', handlePermChange);
      window.removeEventListener('registration-count-updated', handleCountChange);
      window.removeEventListener('withdrawals-count-updated', handleWithdrawalsCountChange);
    };
  }, [isAdminUser]);

  const handleLogout = async () => {
    if (onCloseMobile) onCloseMobile();
    await Promise.all([
      logoutCustomerSession().catch(() => {}),
      logoutMerchantSession().catch(() => {}),
    ]);
    logout();
    navigate('/login', { replace: true });
  };

  // If Customer (FIELD_STAFF) user: Exact Mobile App Customer Account menu in Sidebar.
  // If Merchant user: ONLY Logo Merchant section is shown.
  // If Admin: Full admin modules.
  const navSections = isCustomerUser
    ? [
        {
          title: 'CUSTOMER ACCOUNT',
          items: [
            { key: 'cust_profile', path: '/dashboard?tab=profile', icon: HiOutlineUser, label: 'Customer Profile' },
            { key: 'cust_wallet', path: '/dashboard?tab=wallet', icon: HiOutlineCreditCard, label: 'Wallet & Cashback', pill: (user?.can_sell_products || user?.is_subscriber) ? 'UNLOCKED' : '₹500 PLAN' },
            { key: 'cust_orders', path: '/dashboard?tab=seller-orders', icon: HiOutlineShoppingBag, label: 'Customer Orders', pill: '₹500 PLAN' },
            { key: 'cust_dispatched', path: '/dashboard?tab=dispatched', icon: HiOutlineTruck, label: 'Dispatched & In Transit', pill: '₹500 PLAN' },
            { key: 'cust_products', path: '/dashboard?tab=my-products', icon: HiOutlineCube, label: 'My Products', pill: '₹500 PLAN' },
            { key: 'cust_sell', path: '/dashboard?tab=sell-ad', icon: HiOutlineTag, label: 'Sell / Post an Ad', pill: '₹500 PLAN' },
            { key: 'cust_subs', path: '/dashboard?tab=subscriptions', icon: HiOutlineSparkles, label: 'Seller Plan & Subscriptions', pill: (user?.can_sell_products || user?.is_subscriber) ? 'ACTIVE' : 'UPGRADE' },
          ],
        },
        {
          title: 'SUPPORT & GRIEVANCE',
          items: [
            { key: 'cust_grievance', path: '/dashboard?tab=grievance', icon: HiOutlineExclamationCircle, label: 'Report an Issue / Grievance' },
            { key: 'cust_help', path: '/dashboard?tab=help', icon: HiOutlineQuestionMarkCircle, label: 'Help & Customer Support' },
          ],
        },
      ]
    : isSellerUser
    ? [
        {
          title: 'Products & Orders Platform',
          items: [
            { key: 'products', path: '/products', icon: HiOutlineShoppingBag, label: 'Products & Orders' },
          ],
        },
      ]
    : isMerchantUser
    ? [
        {
          title: 'MERCHANT & BUSINESS WORKSPACE',
          items: [
            { key: 'merch_edit', path: '/merchant?tab=edit', icon: HiOutlineOfficeBuilding, label: 'Manage & Edit Store', pill: 'STORE' },
            {
              key: 'merch_products_group',
              isDropdown: true,
              icon: HiOutlineCube,
              label: 'My Products',
              isOpen: merchProductsOpen,
              onToggle: () => {
                if (collapsed && !mobileOpen) {
                  navigate('/merchant?tab=my-products');
                  return;
                }
                setMerchProductsOpen((prev) => !prev);
              },
              children: [
                { key: 'merch_cust_orders', path: '/merchant?tab=seller-orders', icon: HiOutlineShoppingBag, label: 'Customer Orders', pill: 'PLAN' },
                { key: 'merch_dispatched', path: '/merchant?tab=dispatched', icon: HiOutlineTruck, label: 'Dispatched & In Transit', pill: 'PLAN' },
                { key: 'merch_my_products', path: '/merchant?tab=my-products', icon: HiOutlineCube, label: 'My Products', pill: 'PLAN' },
                { key: 'merch_sell_ad', path: '/merchant?tab=sell-ad', icon: HiOutlineTag, label: 'Sell / Post an Ad', pill: 'PLAN' },
              ],
            },
            { key: 'merch_promo', path: '/merchant?tab=promotions', icon: HiOutlineSpeakerphone, label: 'Promotions & Ad Banners', pill: 'NEW PROMO' },
            { key: 'merch_subs', path: '/merchant?tab=subscriptions', icon: HiOutlineSparkles, label: 'Growth & Promo Subscriptions', pill: 'NEW' },
            { key: 'merch_complaints', path: '/merchant?tab=complaints', icon: HiOutlineChatAlt2, label: 'Store Complaints & Support' },
            { key: 'merch_helpline', path: '/merchant?tab=helpline', icon: HiOutlinePhone, label: 'Merchant Helpline: 93727 02692' },
          ],
        },
        {
          title: 'SUPPORT & GRIEVANCE',
          items: [
            { key: 'merch_grievance', path: '/merchant?tab=grievance', icon: HiOutlineExclamationCircle, label: 'Report an Issue / Grievance' },
            { key: 'merch_help', path: '/merchant?tab=help', icon: HiOutlineQuestionMarkCircle, label: 'Help & Customer Support' },
          ],
        },
      ]
    : ALL_NAV_ITEMS.map((section) => {
        const allowedItems = section.items
          .filter((item) => {
            if (item.adminOnly && !isAdminUser) return false;
            if (isAdminUser) return true;
            return !!staffPerms[item.key];
          })
          .map((item) => {
            if (item.key === 'registrations') {
              return { ...item, badge: regBadgeCount };
            }
            if (item.key === 'withdrawals') {
              return { ...item, badge: withdrawalsBadgeCount };
            }
            return item;
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
        <div className="sidebar-brand-icon">
          {isCustomerUser ? 'C' : isSellerUser ? 'S' : isMerchantUser ? 'M' : 'L'}
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">
              {isCustomerUser ? 'Logo Kerala' : isSellerUser ? 'Seller Platform' : isMerchantUser ? 'Logo Merchant' : 'Logo Admin'}
            </span>
            <span className="sidebar-brand-sub">
              {isCustomerUser ? 'Customer Account' : isSellerUser ? 'Products & Orders' : isMerchantUser ? 'Merchant Workspace' : 'AurumFX Pvt Ltd'}
            </span>
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
            {section.items.map((item) => {
              if (item.isDropdown) {
                const anyChildActive = (item.children || []).some(
                  (c) => `${location.pathname}${location.search || ''}` === c.path
                );
                return (
                  <div key={item.key}>
                    <button
                      type="button"
                      onClick={item.onToggle}
                      className={`sidebar-link ${anyChildActive ? 'active' : ''}`}
                      title={collapsed && !mobileOpen ? item.label : undefined}
                      style={{ width: '100%' }}
                    >
                      <span className="sidebar-link-icon">
                        <item.icon />
                      </span>
                      {(!collapsed || mobileOpen) && (
                        <>
                          <span style={{ flex: 1, minWidth: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.label}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.78, flexShrink: 0 }}>
                            {item.isOpen ? <HiOutlineChevronDown size={15} /> : <HiOutlineChevronRight size={15} />}
                          </span>
                        </>
                      )}
                    </button>
                    {item.isOpen && (!collapsed || mobileOpen) && (
                      <div
                        style={{
                          margin: '2px 0 6px 12px',
                          paddingLeft: 8,
                          borderLeft: '1px solid rgba(148, 163, 184, 0.22)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        {(item.children || []).map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={() => {
                              if (onCloseMobile) onCloseMobile();
                            }}
                            className={() => {
                              const fullCur = `${location.pathname}${location.search || ''}`;
                              return `sidebar-link ${fullCur === child.path ? 'active' : ''}`;
                            }}
                            style={{ padding: '7px 10px', fontSize: 12.5 }}
                          >
                            <span className="sidebar-link-icon">
                              <child.icon />
                            </span>
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {child.label}
                            </span>
                            {child.pill && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  background: 'rgba(56,189,248,0.18)',
                                  color: '#7dd3fc',
                                  flexShrink: 0,
                                }}
                              >
                                {child.pill}
                              </span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={({ isActive }) => {
                    const fullCur = `${location.pathname}${location.search || ''}`;
                    const isMatch = item.path.includes('?tab=')
                      ? fullCur === item.path ||
                        (item.path === '/dashboard?tab=profile' && location.pathname === '/dashboard' && !location.search) ||
                        (item.path === '/merchant?tab=edit' && (location.pathname === '/merchant' || location.pathname === '/merchant/dashboard' || location.pathname === '/merchant-portal') && !location.search)
                      : isActive && location.pathname === item.path;
                    return `sidebar-link ${isMatch ? 'active' : ''}`;
                  }}
                  end={item.path === '/'}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                >
                  <span className="sidebar-link-icon">
                    <item.icon />
                  </span>
                  {(!collapsed || mobileOpen) && (
                    <>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                      {item.pill && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: item.pill === 'UPGRADE' ? 'rgba(168,85,247,0.22)' : 'rgba(56,189,248,0.18)',
                            color: item.pill === 'UPGRADE' ? '#d8b4fe' : '#7dd3fc',
                            flexShrink: 0,
                          }}
                        >
                          {item.pill}
                        </span>
                      )}
                      {Number(item.badge) > 0 && (
                        <span className="sidebar-link-badge">{item.badge}</span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer with user info + logout */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-footer-user" style={{ marginBottom: 8 }}>
            <div className="sidebar-footer-avatar">
              {user?.initials || (isCustomerUser ? (user?.name || 'C').charAt(0).toUpperCase() : isMerchantUser ? 'M' : isAdminUser ? 'A' : 'S')}
            </div>
            <div className="sidebar-footer-info">
              <div className="sidebar-footer-name">{user?.name || (isCustomerUser ? 'Customer' : isMerchantUser ? 'Logo Merchant' : isAdminUser ? 'Admin User' : 'Staff User')}</div>
              <div className="sidebar-footer-role">{isCustomerUser ? 'Customer Account' : getRoleDisplayTitle(user)}</div>
            </div>
          </div>
        )}
        <NavLink
          to="/"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
          }}
          className="sidebar-link"
          title={collapsed ? 'Home' : undefined}
          style={{
            width: '100%',
            marginBottom: 4,
            color: '#e2e8f0',
          }}
        >
          <span className="sidebar-link-icon">
            <HiOutlineHome />
          </span>
          {!collapsed && <span>Home</span>}
        </NavLink>
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
