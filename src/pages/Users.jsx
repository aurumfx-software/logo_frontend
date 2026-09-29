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
  HiOutlineLockClosed,
  HiOutlineCheck,
  HiOutlineUserGroup,
  HiOutlineCog,
} from 'react-icons/hi';
import { useLocation } from 'react-router-dom';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { createAdminOrStaffAccount, fetchUsersList, toggleUserStatus } from '../api/userApi';
import { getStaffPermissions, saveStaffPermissions, MODULE_NAMES, isAdmin } from '../utils/rbac';

export default function Users() {
  const location = useLocation();
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user);

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'admins' | 'staff' | 'permissions'
  const [data, setData] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Staff Dynamic Permissions State (Controlled by Admin)
  const [staffPermissions, setStaffPermissionsState] = useState(() => getStaffPermissions());

  // Kerala district → cities/towns mapping
  const DISTRICT_REGIONS = {
    Kannur: ['Payyanur', 'Kannur City', 'Taliparamba', 'Iritty', 'Thaliparamba', 'Sreekandapuram', 'Kuthuparamba', 'Mattannur', 'Panoor', 'Anthoor'],
    Kozhikode: ['Kozhikode City', 'Calicut', 'Vadakara', 'Koyilandy', 'Ramanattukara', 'Feroke', 'Perambra', 'Quilandy'],
    Ernakulam: ['Kochi', 'Aluva', 'Perumbavoor', 'Angamaly', 'Kothamangalam', 'Muvattupuzha', 'Thrippunithura', 'North Paravur'],
    Thrissur: ['Thrissur City', 'Chalakudy', 'Kodungallur', 'Guruvayur', 'Kunnamkulam', 'Irinjalakuda'],
    Malappuram: ['Malappuram City', 'Tirur', 'Manjeri', 'Perinthalmanna', 'Nilambur', 'Ponnani', 'Kondotty'],
    Palakkad: ['Palakkad City', 'Ottapalam', 'Shoranur', 'Mannarkkad', 'Alathur', 'Chittur'],
    Thiruvananthapuram: ['Thiruvananthapuram City', 'Neyyattinkara', 'Nedumangad', 'Varkala', 'Attingal'],
    Kollam: ['Kollam City', 'Karunagappally', 'Kottarakkara', 'Punalur', 'Chavara'],
    Alappuzha: ['Alappuzha City', 'Cherthala', 'Kayamkulam', 'Haripad', 'Chengannur'],
    Kottayam: ['Kottayam City', 'Pala', 'Changanacherry', 'Vaikom', 'Ettumanoor'],
    Idukki: ['Munnar', 'Thodupuzha', 'Adimali', 'Nedumkandam', 'Kumily'],
    Wayanad: ['Kalpetta', 'Mananthavady', 'Sulthan Bathery', 'Vythiri'],
    Kasaragod: ['Kasaragod City', 'Kanhangad', 'Hosdurg', 'Bekal', 'Nileshwar'],
    Pathanamthitta: ['Pathanamthitta City', 'Thiruvalla', 'Adoor', 'Pandalam', 'Ranny'],
  };

  // Auto-generate a staff user code
  const generateUserCode = () => {
    const prefix = 'STF';
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
    return `${prefix}-${ts}${rand}`;
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff',                // FIXED: only Staff can be created here
    district: 'Kannur',
    regions: [],                  // multi-select cities
    userCode: generateUserCode(), // auto-generated
    password: '',
    sendEmail: true,              // send credentials to email
    moduleAccess: {},             // per-user module visibility overrides
  });

  // Load users on mount
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

  // Handle URL query parameters for modal
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('addAdmin') === 'true' || params.get('addRole') === 'admin') {
      setFormData((prev) => ({ ...prev, role: 'Admin' }));
      setIsAddModalOpen(true);
    } else if (params.get('addFieldStaff') === 'true' || params.get('addRole') === 'staff') {
      setFormData((prev) => ({ ...prev, role: 'Staff' }));
      setIsAddModalOpen(true);
    }
  }, [location]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleStaffPermission = (moduleKey) => {
    if (!isUserAdmin) {
      showToast('Only Admin has permission to modify Staff access settings.');
      return;
    }
    const updated = {
      ...staffPermissions,
      [moduleKey]: !staffPermissions[moduleKey],
    };
    setStaffPermissionsState(updated);
    saveStaffPermissions(updated);
    const modLabel = MODULE_NAMES.find((m) => m.key === moduleKey)?.label || moduleKey;
    showToast(`Staff access for "${modLabel}" is now ${updated[moduleKey] ? 'ENABLED' : 'DISABLED'}`);
  };

  const applyPermissionPreset = (presetType) => {
    if (!isUserAdmin) return;
    let newPerms = { ...staffPermissions };
    if (presetType === 'all') {
      MODULE_NAMES.forEach((m) => {
        newPerms[m.key] = true;
      });
      showToast('All modules ENABLED for Staff role');
    } else if (presetType === 'minimal') {
      MODULE_NAMES.forEach((m) => {
        newPerms[m.key] = m.key === 'dashboard' || m.key === 'merchants';
      });
      showToast('Minimal Access preset applied to Staff role');
    } else if (presetType === 'standard') {
      MODULE_NAMES.forEach((m) => {
        newPerms[m.key] = ['dashboard', 'merchants', 'categories', 'geography', 'reports'].includes(m.key);
      });
      showToast('Standard Staff Access preset applied');
    }
    setStaffPermissionsState(newPerms);
    saveStaffPermissions(newPerms);
  };

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const regionLabel = formData.regions.length > 0 ? formData.regions.join(', ') : formData.district;
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: 'Staff',
      password: formData.password || 'Password123!',
      city: regionLabel,
      district: formData.district,
      regions: formData.regions,
      userCode: formData.userCode,
      sendEmail: formData.sendEmail,
      moduleAccess: formData.moduleAccess,
    };

    setIsSubmitting(true);
    try {
      const newAccount = await createAdminOrStaffAccount(payload);
      setData([newAccount, ...data]);
      setIsAddModalOpen(false);
      showToast(`✅ Staff "${formData.name}" created! Code: ${formData.userCode}${formData.sendEmail ? ' | Credentials emailed ✉️' : ''}`);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Staff',
        district: 'Kannur',
        regions: [],
        userCode: generateUserCode(),
        password: '',
        sendEmail: true,
        moduleAccess: {},
      });
    } catch (err) {
      console.error('Failed to create account:', err);
      // Fallback: still add to local list
      const fallback = {
        id: `usr-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'Staff',
        city: regionLabel,
        userCode: formData.userCode,
        status: 'active',
        lastActive: new Date().toLocaleDateString(),
      };
      setData((prev) => [fallback, ...prev]);
      setIsAddModalOpen(false);
      showToast(`✅ Staff "${formData.name}" added locally. Code: ${formData.userCode}`);
      setFormData({
        name: '', email: '', phone: '', role: 'Staff',
        district: 'Kannur', regions: [], userCode: generateUserCode(),
        password: '', sendEmail: true, moduleAccess: {},
      });
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
    showToast(`Account "${row.name}" has been ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}.`);
  };

  const filteredData = data.filter((u) => {
    if (activeTab === 'all') return true;
    const rLower = (u.role || '').toString().toLowerCase();
    if (activeTab === 'admins') return rLower.includes('admin');
    if (activeTab === 'staff') return rLower.includes('staff');
    return u.status === activeTab;
  });

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: 'Account / User',
      render: (val, row) => {
        const roleLower = (row.role || '').toLowerCase();
        const isAdminAccount = roleLower.includes('admin');

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="avatar"
              style={{
                background: isAdminAccount ? '#EDE9FE' : '#D1FAE5',
                color: isAdminAccount ? '#6D28D9' : '#065F46',
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
      render: (val) => {
        const roleLower = (val || '').toLowerCase();
        const isAdminAccount = roleLower.includes('admin');

        return (
          <span
            style={{
              background: isAdminAccount ? '#EDE9FE' : '#D1FAE5',
              color: isAdminAccount ? '#6D28D9' : '#065F46',
              border: isAdminAccount ? '1px solid #C4B5FD' : '1px solid #A7F3D0',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
            }}
          >
            {isAdminAccount ? <HiOutlineShieldCheck size={14} /> : <HiOutlineUserGroup size={14} />}
            {isAdminAccount ? 'Admin' : 'Staff'}
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
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-outline btn-sm btn-icon"
            title="View Details"
            onClick={() => showToast(`Viewing details for ${row.name} (${row.role || 'Staff'})`)}
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
          {isUserAdmin && (
            <button
              className="btn btn-outline btn-sm btn-icon"
              title={row.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
              style={{ color: row.status === 'active' ? 'var(--danger)' : '#10B981' }}
              onClick={() => handleToggleSuspend(row)}
            >
              {row.status === 'active' ? <HiOutlineBan /> : <HiOutlineCheckCircle />}
            </button>
          )}
        </div>
      ),
    },
  ];

  const counts = {
    all: data.length,
    admins: data.filter((u) => (u.role || '').toLowerCase().includes('admin')).length,
    staff: data.filter((u) => (u.role || '').toLowerCase().includes('staff')).length,
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
        title="Role & Access Control"
        subtitle="Manage 2-Role System (Admin & Staff) and set visibility permissions for Staff members"
      >
        {isUserAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
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
            + Create New Account
          </button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="tabs" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
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
          🛡️ Admin Accounts ({counts.admins})
        </button>
        <button
          className={`tab ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          👥 Staff Accounts ({counts.staff})
        </button>
        <button
          className={`tab ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
          style={{ background: activeTab === 'permissions' ? '#1E1B4B' : undefined, color: activeTab === 'permissions' ? '#A5B4FC' : undefined, fontWeight: 700 }}
        >
          ⚙️ Staff Permissions & Visibility Control
        </button>
      </div>

      {/* TAB: Staff Permissions Settings */}
      {activeTab === 'permissions' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
              borderRadius: 16,
              padding: '24px 28px',
              color: 'white',
              marginBottom: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <HiOutlineLockClosed style={{ color: '#A5B4FC' }} size={20} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#A5B4FC' }}>
                  Admin Access Decision Panel
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
                Configure What Parts Staff Should See or Not See
              </h2>
              <p style={{ margin: '6px 0 0 0', opacity: 0.85, fontSize: 13 }}>
                Toggle ON to grant Staff access to a module, or toggle OFF to hide it completely from their sidebar and access.
              </p>
            </div>

            {isUserAdmin && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => applyPermissionPreset('all')}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Enable All
                </button>
                <button
                  onClick={() => applyPermissionPreset('standard')}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Standard Preset
                </button>
                <button
                  onClick={() => applyPermissionPreset('minimal')}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Minimal Access
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
              marginBottom: 30,
            }}
          >
            {MODULE_NAMES.map((mod) => {
              const isEnabled = !!staffPermissions[mod.key];

              return (
                <div
                  key={mod.key}
                  className="card"
                  style={{
                    padding: 20,
                    border: isEnabled ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                    background: isEnabled ? '#F5F3FF' : '#FAFAFA',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E1B4B' }}>
                        {mod.label}
                      </h4>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{mod.path}</div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleStaffPermission(mod.key)}
                      style={{
                        background: isEnabled ? '#10B981' : '#CBD5E1',
                        border: 'none',
                        width: 52,
                        height: 28,
                        borderRadius: 20,
                        position: 'relative',
                        cursor: isUserAdmin ? 'pointer' : 'not-allowed',
                        transition: 'all 0.25s ease',
                        padding: 2,
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'white',
                          position: 'absolute',
                          top: 2,
                          left: isEnabled ? 26 : 2,
                          transition: 'all 0.25s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                      >
                        {isEnabled ? <HiOutlineCheck size={14} style={{ color: '#10B981' }} /> : <HiOutlineX size={14} style={{ color: '#94A3B8' }} />}
                      </div>
                    </button>
                  </div>

                  <p style={{ fontSize: 13, color: '#475569', margin: '0 0 14px 0', minHeight: 38 }}>
                    {mod.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: isEnabled ? '#047857' : '#B91C1C',
                        background: isEnabled ? '#D1FAE5' : '#FEE2E2',
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {isEnabled ? 'VISIBLE TO STAFF' : 'HIDDEN FROM STAFF'}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      {isEnabled ? 'Staff can access' : 'Admin only'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        /* TAB: Accounts Table */
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {loadingUsers && (
              <div style={{ padding: '16px 24px', fontSize: 13, color: '#6C63FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F3F4F6' }}>
                <span>🔄 Loading accounts from database...</span>
              </div>
            )}
            <DataTable
              columns={columns}
              data={filteredData}
              searchPlaceholder="Search accounts by name, email, city or role..."
            />
          </div>
        </div>
      )}

      {/* Modal: Create New Staff Account */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(5px)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 12px',
              overflowY: 'auto',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: 'white',
                borderRadius: 20,
                width: '100%',
                maxWidth: 600,
                maxHeight: 'calc(100vh - 32px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.35)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 22px',
                  background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HiOutlineUserAdd size={22} style={{ color: '#A5B4FC' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Create New Staff Account</h3>
                    <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>Only Staff members can be created here. Role is fixed.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: 22, cursor: 'pointer' }}
                >
                  <HiOutlineX />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddAccountSubmit} style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Auto-generated User Code */}
                <div style={{ background: '#F5F3FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, color: '#4338CA', fontWeight: 600 }}>
                    🆔 Auto-Generated Staff Code
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 16, color: '#1E1B4B', letterSpacing: 2 }}>
                      {formData.userCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, userCode: generateUserCode() }))}
                      title="Regenerate code"
                      style={{ background: '#EDE9FE', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: '#6D28D9', fontWeight: 700 }}
                    >
                      🔄 Regenerate
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Full Name *</label>
                  <input
                    type="text" name="name" required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                {/* Email + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Email Address *</label>
                    <input
                      type="email" name="email" required
                      placeholder="staff@aurumfx.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Phone Number</label>
                    <input
                      type="tel" name="phone"
                      placeholder="+91 98471 23456"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Role — fixed to Staff */}
                <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <HiOutlineUserGroup style={{ color: '#059669', fontSize: 20 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Role: Staff (Admin Configured Access)</div>
                    <div style={{ fontSize: 11, color: '#047857' }}>Only Staff accounts can be created here. Admin accounts are system-managed.</div>
                  </div>
                </div>

                {/* District + Multi-Region */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>📍 Assigned District</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={(e) => setFormData(p => ({ ...p, district: e.target.value, regions: [] }))}
                    className="form-select"
                  >
                    {Object.keys(DISTRICT_REGIONS).map(d => (
                      <option key={d} value={d}>{d} District</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    🏘️ Assigned Regions / Cities
                    <span style={{ fontWeight: 400, color: '#64748B', marginLeft: 6, fontSize: 11 }}>(select multiple)</span>
                  </label>

                  {/* Region chips grid */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: '#FAFAFA', minHeight: 54 }}>
                    {(DISTRICT_REGIONS[formData.district] || []).map((region) => {
                      const selected = formData.regions.includes(region);
                      return (
                        <button
                          key={region}
                          type="button"
                          onClick={() => setFormData(p => ({
                            ...p,
                            regions: selected
                              ? p.regions.filter(r => r !== region)
                              : [...p.regions, region],
                          }))}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: selected ? '1.5px solid #6C63FF' : '1.5px solid #CBD5E1',
                            background: selected ? '#EDE9FE' : 'white',
                            color: selected ? '#4C1D95' : '#475569',
                            transition: 'all 0.15s',
                          }}
                        >
                          {selected ? '✓ ' : ''}{region}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected regions summary */}
                  {formData.regions.length > 0 && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: '#F5F3FF', borderRadius: 8, fontSize: 12, color: '#4338CA', fontWeight: 600 }}>
                      ✅ {formData.regions.length} region{formData.regions.length > 1 ? 's' : ''} selected: {formData.regions.join(' • ')}
                    </div>
                  )}
                </div>

                {/* Module Visibility for this staff */}
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HiOutlineCog style={{ color: '#6C63FF' }} /> Module Visibility for This Staff
                    <span style={{ fontWeight: 400, fontSize: 11, color: '#64748B' }}>(overrides global settings for this user)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {MODULE_NAMES.map((mod) => {
                      // Use per-user override if set, else fall back to global staffPermissions
                      const globalVal = !!staffPermissions[mod.key];
                      const overrideVal = formData.moduleAccess.hasOwnProperty(mod.key)
                        ? formData.moduleAccess[mod.key]
                        : globalVal;
                      return (
                        <label
                          key={mod.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 10px',
                            borderRadius: 8,
                            border: overrideVal ? '1.5px solid #C7D2FE' : '1.5px solid #E2E8F0',
                            background: overrideVal ? '#EDE9FE' : 'white',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 600,
                            color: overrideVal ? '#4338CA' : '#64748B',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={overrideVal}
                            onChange={() => setFormData(p => ({
                              ...p,
                              moduleAccess: { ...p.moduleAccess, [mod.key]: !overrideVal },
                            }))}
                            style={{ accentColor: '#6C63FF', width: 14, height: 14 }}
                          />
                          {mod.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Password */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Password *</label>
                  <input
                    type="password" name="password" required
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                {/* Send credentials by email toggle */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: formData.sendEmail ? '1.5px solid #A7F3D0' : '1.5px solid #E2E8F0',
                    background: formData.sendEmail ? '#F0FDF4' : '#FAFAFA',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={() => setFormData(p => ({ ...p, sendEmail: !p.sendEmail }))}
                    style={{ accentColor: '#10B981', width: 16, height: 16 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: formData.sendEmail ? '#065F46' : '#374151' }}>
                      ✉️ Send Login Credentials via Email
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>
                      Staff will receive their email, password & user code at {formData.email || 'their email address'}
                    </div>
                  </div>
                </label>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F3F4F6' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', fontWeight: 600, color: '#4B5563', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 24px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #6C63FF 0%, #5A52D5 100%)',
                      color: 'white', fontWeight: 700,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(108, 99, 255, 0.4)',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <HiOutlineUserAdd size={16} />
                    {isSubmitting ? 'Creating Staff...' : 'Create Staff Account'}
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
