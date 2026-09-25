import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineEye,
  HiOutlineBan,
  HiOutlineMail,
  HiOutlineUserAdd,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineX,
  HiOutlineBadgeCheck,
} from 'react-icons/hi';
import { useLocation } from 'react-router-dom';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { createAdminOrStaffAccount, fetchUsersList, toggleUserStatus } from '../api/userApi';

export default function Users() {
  const location = useLocation();
  const { user } = useAuth();

  const userRole = user?.role || 'Super Admin';
  const isAdminOnly = userRole === 'Admin';
  const isFieldStaff = userRole === 'Field Staff';

  const [activeTab, setActiveTab] = useState('all');
  const [data, setData] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: isAdminOnly ? 'Field Staff' : 'Admin',
    city: 'Payyanur',
    password: '',
  });

  // Load real users from API on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoadingUsers(true);
        const apiUsers = await fetchUsersList();
        if (Array.isArray(apiUsers)) {
          setData(apiUsers);
        } else {
          setData([]);
        }
      } catch (err) {
        console.warn('Backend users list error:', err);
        setData([]);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  // Open modal automatically if query param ?addAdmin=true or ?addFieldStaff=true is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('addAdmin') === 'true' || params.get('addRole') === 'admin') {
      if (!isAdminOnly) {
        setFormData((prev) => ({ ...prev, role: 'Admin' }));
      }
      setIsAddModalOpen(true);
    } else if (params.get('addFieldStaff') === 'true' || params.get('addRole') === 'field_staff') {
      setFormData((prev) => ({ ...prev, role: 'Field Staff' }));
      setIsAddModalOpen(true);
    }
  }, [location, isAdminOnly]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAdminSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    try {
      const newAccount = await createAdminOrStaffAccount({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        password: formData.password || 'Password123!',
        city: formData.city,
      });

      setData([newAccount, ...data]);
      setIsAddModalOpen(false);
      setActiveTab('admins');
      showToast(`New ${formData.role} account "${formData.name}" created successfully!`);

      setFormData({
        name: '',
        email: '',
        phone: '',
        role: isAdminOnly ? 'Field Staff' : 'Admin',
        city: 'Payyanur',
        password: '',
      });
    } catch (err) {
      console.error('Failed to create account:', err);
      showToast(`Error: ${err.message || 'Failed to create account'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSuspend = async (row) => {
    const newStatus = row.status === 'active' ? 'suspended' : 'active';
    setData((prev) =>
      prev.map((u) => (u.id === row.id ? { ...u, status: newStatus } : u))
    );
    if (row.rawId || row.id) {
      await toggleUserStatus(row.rawId || row.id, row.status);
    }
    showToast(
      `Account "${row.name}" has been ${
        newStatus === 'suspended' ? 'suspended' : 'reactivated'
      }.`
    );
  };

  const filteredData = data.filter((u) => {
    if (activeTab === 'all') return true;
    const rLower = (u.role || '').toString().toLowerCase();
    if (activeTab === 'admins')
      return rLower.includes('admin') || rLower.includes('staff');
    if (activeTab === 'users')
      return rLower.includes('user') || rLower.includes('merchant') || !u.role;
    return u.status === activeTab;
  });

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: 'Account / User',
      render: (val, row) => {
        const isSuper =
          (row.role || '').toLowerCase().includes('super') ||
          (row.name || '').toLowerCase() === 'super admin' ||
          (row.email || '').toLowerCase() === 'aurumfxsoftware@gmail.com';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="avatar"
              style={{
                background: isSuper
                  ? '#EDE9FE'
                  : (row.role || '').toLowerCase().includes('admin')
                  ? '#D1FAE5'
                  : (row.role || '').toLowerCase().includes('staff')
                  ? '#DBEAFE'
                  : `hsl(${val.charCodeAt(0) * 5}, 60%, 88%)`,
                color: isSuper
                  ? '#6D28D9'
                  : (row.role || '').toLowerCase().includes('admin')
                  ? '#065F46'
                  : (row.role || '').toLowerCase().includes('staff')
                  ? '#1E40AF'
                  : `hsl(${val.charCodeAt(0) * 5}, 60%, 35%)`,
                fontWeight: 700,
              }}
            >
              {val.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{row.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      label: 'Role',
      render: (val, row) => {
        const roleStr = (val || 'User').toString();
        const isSuper =
          roleStr.toLowerCase().includes('super') ||
          (row?.name || '').toLowerCase() === 'super admin' ||
          (row?.email || '').toLowerCase() === 'aurumfxsoftware@gmail.com';
        const displayRoleStr = isSuper ? 'Super Admin' : roleStr;
        const roleLower = displayRoleStr.toLowerCase();

        let bg = '#F1F5F9';
        let color = '#475569';
        let border = '1px solid #CBD5E1';

        if (isSuper || roleLower.includes('super')) {
          bg = '#EDE9FE';
          color = '#6D28D9';
          border = '1px solid #C4B5FD';
        } else if (roleLower.includes('admin')) {
          bg = '#D1FAE5';
          color = '#065F46';
          border = '1px solid #A7F3D0';
        } else if (roleLower.includes('staff')) {
          bg = '#DBEAFE';
          color = '#1E40AF';
          border = '1px solid #BFDBFE';
        } else if (roleLower.includes('merchant')) {
          bg = '#FEF3C7';
          color = '#B45309';
          border = '1px solid #FDE68A';
        } else if (roleLower.includes('user')) {
          bg = '#E0F2FE';
          color = '#0369A1';
          border = '1px solid #BAE6FD';
        }

        return (
          <span
            style={{
              background: bg,
              color: color,
              border: border,
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {(isSuper || roleLower.includes('super')) && <HiOutlineShieldCheck size={14} />}
            {displayRoleStr}
          </span>
        );
      },
    },
    { key: 'city', label: 'City / Region' },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => val || 'N/A',
    },
    { key: 'lastActive', label: 'Last Active' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => {
        const isSuper =
          (row.role || '').toLowerCase().includes('super') ||
          (row.name || '').toLowerCase() === 'super admin' ||
          (row.email || '').toLowerCase() === 'aurumfxsoftware@gmail.com';

        if (isSuper) {
          return (
            <span
              style={{
                fontSize: 11,
                color: '#6D28D9',
                background: '#EDE9FE',
                padding: '4px 10px',
                borderRadius: 6,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              🔒 Protected
            </span>
          );
        }

        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="View Details"
              onClick={() => showToast(`Viewing details for ${row.name} (${row.role || 'User'})`)}
            >
              <HiOutlineEye />
            </button>
            <button
              className="btn btn-outline btn-sm btn-icon"
              title="Send Email"
              onClick={() => showToast(`Opening email compose to ${row.email}`)}
            >
              <HiOutlineMail />
            </button>
            <button
              className="btn btn-outline btn-sm btn-icon"
              title={row.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
              style={{ color: row.status === 'active' ? 'var(--danger)' : '#10B981' }}
              onClick={() => handleToggleSuspend(row)}
            >
              {row.status === 'active' ? <HiOutlineBan /> : <HiOutlineCheckCircle />}
            </button>
          </div>
        );
      },
    },
  ];

  const counts = {
    all: data.length,
    admins: data.filter(
      (u) => u.role === 'Super Admin' || u.role === 'Admin' || u.role === 'Field Staff'
    ).length,
    users: data.filter((u) => u.role === 'User' || !u.role).length,
    active: data.filter((u) => u.status === 'active').length,
    suspended: data.filter((u) => u.status === 'suspended').length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 80,
              right: 24,
              zIndex: 9999,
              background: '#6C63FF',
              color: 'white',
              padding: '14px 22px',
              borderRadius: 12,
              boxShadow: '0 10px 25px rgba(108, 99, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <HiOutlineBadgeCheck size={22} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title="User & Admin Management"
        subtitle="Manage public users, operational admins, and field staff accounts"
      >
        {!isFieldStaff && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                role: isAdminOnly ? 'Field Staff' : 'Admin',
              }));
              setIsAddModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              fontWeight: 700,
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(108, 99, 255, 0.35)',
            }}
          >
            <HiOutlineUserAdd size={18} />
            {isAdminOnly ? '+ Add Field Staff' : '+ Add New Admin'}
          </button>
        )}
      </PageHeader>

      <div className="tabs" style={{ flexWrap: 'wrap', gap: 8 }}>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Accounts ({counts.all})
        </button>
        <button
          className={`tab ${activeTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          🛡️ Admins & Staff ({counts.admins})
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👤 Public Users ({counts.users})
        </button>
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({counts.active})
        </button>
        <button
          className={`tab ${activeTab === 'suspended' ? 'active' : ''}`}
          onClick={() => setActiveTab('suspended')}
        >
          Suspended ({counts.suspended})
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loadingUsers && (
            <div style={{ padding: '16px 24px', fontSize: 13, color: '#6C63FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F3F4F6' }}>
              <span>🔄 Loading live users from API...</span>
            </div>
          )}
          <DataTable
            columns={columns}
            data={filteredData}
            searchPlaceholder="Search users, admins, email, city..."
          />
        </div>
      </div>

      {/* Modal: Add New Admin Account */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 12px',
              overflowY: 'auto',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'white',
                borderRadius: 20,
                width: '100%',
                maxWidth: 580,
                maxHeight: 'calc(100vh - 32px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #1E1B4B 0%, #2D286B 100%)',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HiOutlineShieldCheck size={24} style={{ color: '#A5B4FC', flexShrink: 0 }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                      {isAdminOnly ? 'Create Field Staff Account' : 'Create Admin Account'}
                    </h3>
                    <p style={{ margin: 0, fontSize: 11, opacity: 0.85 }}>
                      {isAdminOnly ? 'Operational Admin Control Panel' : 'Super Admin Control Panel'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: 22,
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HiOutlineX />
                </button>
              </div>

              {/* Modal Body */}
              <form
                onSubmit={handleAddAdminSubmit}
                style={{ padding: '20px 20px 16px', overflowY: 'auto', flex: 1 }}
              >
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Anish V.P."
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-grid-responsive" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="admin@locality.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 98471 23456"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-grid-responsive" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Assigned Role *
                    </label>
                    {isAdminOnly ? (
                      <>
                        <select
                          name="role"
                          value="Field Staff"
                          disabled
                          className="form-select"
                          style={{
                            fontWeight: 600,
                            color: '#1E1B4B',
                            background: '#F3F4F6',
                            cursor: 'not-allowed',
                          }}
                        >
                          <option value="Field Staff">Field Staff (Merchant Onboarding Desk)</option>
                        </select>
                        <span style={{ fontSize: 11, color: '#6B7280', marginTop: 4, display: 'block' }}>
                          * Operational Admins are permitted to create Field Staff accounts only.
                        </span>
                      </>
                    ) : (
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="form-select"
                        style={{ fontWeight: 600, color: '#1E1B4B' }}
                      >
                        <option value="Admin">Admin (Operational Approvals)</option>
                        <option value="Field Staff">Field Staff (Merchant Onboarding)</option>
                        <option value="User">User (Public Account)</option>
                        <option value="Merchant">Merchant (Business Account)</option>
                      </select>
                    )}
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Assigned Region / City
                    </label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option>Payyanur</option>
                      <option>Kannur</option>
                      <option>Taliparamba</option>
                      <option>Bangalore</option>
                      <option>Mumbai</option>
                      <option>Delhi</option>
                      <option>Kochi</option>
                      <option>All Regions</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                  <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                    User will be prompted to change password upon initial login.
                  </span>
                </div>

                {/* Footer Buttons */}
                <div
                  className="modal-footer-buttons"
                  style={{
                    display: 'flex',
                    gap: 10,
                    justifyContent: 'flex-end',
                    paddingTop: 14,
                    borderTop: '1px solid #F3F4F6',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '1px solid #E5E7EB',
                      background: 'white',
                      fontWeight: 600,
                      color: '#4B5563',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #6C63FF 0%, #5A52D5 100%)',
                      color: 'white',
                      fontWeight: 700,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 14px rgba(108, 99, 255, 0.4)',
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
