import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineCreditCard,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiOutlineBan,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import CircularSpinner from '../components/UI/CircularSpinner';
import { fetchUsersList } from '../api/userApi';
import { adminAdjustWallet } from '../api/walletApi';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected customer for viewing details
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Wallet modal state
  const [walletModalCustomer, setWalletModalCustomer] = useState(null);
  const [walletOp, setWalletOp] = useState({ operation: 'credit', amount: '', note: '' });
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMsg, setWalletMsg] = useState({ type: '', text: '' });

  const loadCustomers = async () => {
    setLoading(true);
    try {
      // Customers are users with role FIELD_STAFF or public mobile customers
      const allUsers = await fetchUsersList();
      // Filter to show customers (Field Staff / Public Users / Registered app users)
      const custList = (allUsers || []).filter((u) => {
        const r = (u.role || '').toUpperCase();
        return r !== 'ADMIN' && r !== 'SUPER_ADMIN' && r !== 'SUPERADMIN';
      });
      setCustomers(custList);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.district || '').toLowerCase().includes(q) ||
      (c.user_code || '').toLowerCase().includes(q);

    const matchesDistrict =
      districtFilter === 'all' ||
      (c.district && c.district.toLowerCase() === districtFilter.toLowerCase()) ||
      (c.city && c.city.toLowerCase() === districtFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (c.is_active || c.status === 'ACTIVE' || c.status === 'active')) ||
      (statusFilter === 'inactive' && (!c.is_active || c.status === 'INACTIVE' || c.status === 'suspended'));

    return matchesSearch && matchesDistrict && matchesStatus;
  });

  const districts = Array.from(
    new Set(customers.map((c) => c.district || c.city).filter(Boolean))
  ).sort();

  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    if (!walletOp.amount || Number(walletOp.amount) <= 0) {
      setWalletMsg({ type: 'error', text: 'Please enter a valid amount in ₹' });
      return;
    }
    if (!walletModalCustomer?.id) {
      setWalletMsg({ type: 'error', text: 'Customer ID not found' });
      return;
    }
    setWalletLoading(true);
    setWalletMsg({ type: '', text: '' });
    try {
      await adminAdjustWallet({
        user_id: walletModalCustomer.id,
        operation: walletOp.operation,
        amount: Number(walletOp.amount),
        claim_mode: true,
        note: walletOp.note || `Admin ${walletOp.operation} for customer ${walletModalCustomer.name}`,
      });
      const opLabel = walletOp.operation === 'credit' ? 'sent to Redeem section for' : 'debited from';
      setWalletMsg({
        type: 'success',
        text: `✅ ₹${walletOp.amount} ${opLabel} ${walletModalCustomer.name}! (Claimable in Redeem section)`,
      });
      setWalletOp({ operation: 'credit', amount: '', note: '' });
      setTimeout(() => {
        setWalletModalCustomer(null);
        setWalletMsg({ type: '', text: '' });
      }, 1500);
    } catch (err) {
      setWalletMsg({ type: 'error', text: err.message || 'Wallet operation failed' });
    } finally {
      setWalletLoading(false);
    }
  };

  const columns = [
    {
      key: 'user_code',
      label: 'Customer ID',
      render: (val, row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
          {val || `USR_${row.id}`}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Customer',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {(val || 'C')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{val || 'App Customer'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.email || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => (
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>
          {val ? `+91 ${val}` : '—'}
        </span>
      ),
    },
    {
      key: 'district',
      label: 'Location',
      render: (_, row) => (
        <div style={{ fontSize: 13, color: 'var(--text)' }}>
          <div>📍 {row.city || row.district || 'Kerala'}</div>
          {row.district && row.city && row.district !== row.city && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.district}</div>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (val) => (
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {val ? new Date(val).toLocaleDateString('en-IN') : 'Recent'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val, row) => {
        const isActive = val !== false && row.status !== 'INACTIVE' && row.status !== 'suspended';
        return <StatusBadge status={isActive ? 'active' : 'suspended'} />;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-outline btn-sm btn-icon"
            title="View Customer Details"
            onClick={() => setSelectedCustomer(row)}
          >
            <HiOutlineEye />
          </button>
          <button
            className="btn btn-outline btn-sm btn-icon"
            title="Customer Wallet (Send Cash / Credit)"
            style={{ color: '#059669', borderColor: '#A7F3D0' }}
            onClick={() => {
              setWalletModalCustomer(row);
              setWalletOp({ operation: 'credit', amount: '', note: '' });
              setWalletMsg({ type: '', text: '' });
            }}
          >
            <HiOutlineCreditCard />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 60 }}>
      <PageHeader
        title="Customers"
        subtitle="View, search, and manage registered mobile application users and customer wallets"
      >
        <button className="btn btn-outline" onClick={loadCustomers} title="Refresh customer list">
          <HiOutlineRefresh /> Refresh
        </button>
      </PageHeader>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 18, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            <HiOutlineUserGroup />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Customers</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{customers.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 18, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            <HiOutlineCheckCircle />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Active Users</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>
              {customers.filter((c) => c.is_active !== false && c.status !== 'INACTIVE').length}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 18, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            <HiOutlineLocationMarker />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Districts Active</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#7C3AED' }}>{districts.length || 14}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 20, borderRadius: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <HiOutlineSearch style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-secondary)', fontSize: 18 }} />
            <input
              type="text"
              placeholder="Search by customer name, phone, email, place..."
              className="form-input"
              style={{ paddingLeft: 38 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ minWidth: 160 }}>
            <select
              className="form-select"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
            >
              <option value="all">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 140 }}>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Data Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <CircularSpinner size={36} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCustomers}
          keyField="id"
          emptyMessage="No registered customers found"
        />
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Profile — ${selectedCustomer.name || 'User'}`}
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 22,
                }}
              >
                {(selectedCustomer.name || 'C')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                  {selectedCustomer.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {selectedCustomer.user_code || `USR_${selectedCustomer.id}`}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Phone</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {selectedCustomer.phone ? `+91 ${selectedCustomer.phone}` : '—'}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Email</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2, wordBreak: 'break-all' }}>
                  {selectedCustomer.email || '—'}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>District / City</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {selectedCustomer.city || selectedCustomer.district || 'Kerala'}
                </div>
              </div>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Account Status</div>
                <div style={{ marginTop: 4 }}>
                  <StatusBadge status={selectedCustomer.is_active !== false ? 'active' : 'suspended'} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setWalletModalCustomer(selectedCustomer);
                  setSelectedCustomer(null);
                  setWalletOp({ operation: 'credit', amount: '', note: '' });
                }}
              >
                💳 Adjust Customer Wallet
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Customer Wallet Modal */}
      {walletModalCustomer && (
        <Modal
          isOpen={!!walletModalCustomer}
          onClose={() => setWalletModalCustomer(null)}
          title={`💳 Wallet — ${walletModalCustomer.name || 'Customer'}`}
          maxWidth="500px"
        >
          <form onSubmit={handleWalletSubmit}>
            <div style={{ marginBottom: 16, background: '#F8FAFC', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 13, color: '#64748B' }}>Customer Account:</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                {walletModalCustomer.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{walletModalCustomer.user_code || `USR_${walletModalCustomer.id}`}</span> | Phone: {walletModalCustomer.phone || '—'}
              </div>
            </div>

            {walletMsg.text && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 13,
                  fontWeight: 600,
                  background: walletMsg.type === 'error' ? '#FEE2E2' : '#DCFCE7',
                  color: walletMsg.type === 'error' ? '#991B1B' : '#166534',
                  border: `1px solid ${walletMsg.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
                }}
              >
                {walletMsg.text}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Action Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setWalletOp({ ...walletOp, operation: 'credit' })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    border: '1.5px solid',
                    cursor: 'pointer',
                    background: walletOp.operation === 'credit' ? '#ECFDF5' : '#ffffff',
                    borderColor: walletOp.operation === 'credit' ? '#10B981' : '#CBD5E1',
                    color: walletOp.operation === 'credit' ? '#047857' : '#64748B',
                  }}
                >
                  ➕ Credit / Send Cash
                </button>
                <button
                  type="button"
                  onClick={() => setWalletOp({ ...walletOp, operation: 'debit' })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    border: '1.5px solid',
                    cursor: 'pointer',
                    background: walletOp.operation === 'debit' ? '#FEF2F2' : '#ffffff',
                    borderColor: walletOp.operation === 'debit' ? '#EF4444' : '#CBD5E1',
                    color: walletOp.operation === 'debit' ? '#B91C1C' : '#64748B',
                  }}
                >
                  ➖ Deduct Cash
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 100"
                className="form-input"
                style={{ fontSize: 16, fontWeight: 700 }}
                value={walletOp.amount}
                onChange={(e) => setWalletOp({ ...walletOp, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Note / Description (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Promotional cashback / Customer loyalty reward"
                className="form-input"
                value={walletOp.note}
                onChange={(e) => setWalletOp({ ...walletOp, note: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setWalletModalCustomer(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={walletLoading}
                style={{
                  background: walletOp.operation === 'credit' ? '#059669' : '#DC2626',
                  borderColor: walletOp.operation === 'credit' ? '#059669' : '#DC2626',
                }}
              >
                {walletLoading
                  ? 'Processing...'
                  : walletOp.operation === 'credit'
                  ? `Send ₹${walletOp.amount || '0'} to Customer`
                  : `Deduct ₹${walletOp.amount || '0'} from Customer`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </motion.div>
  );
}
