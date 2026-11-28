import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineEye,
  HiOutlineBan,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatsCard from '../components/UI/StatsCard';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import CircularSpinner from '../components/UI/CircularSpinner';
import {
  fetchAdminSubscribers,
  stopAdminSubscription,
  unstopAdminSubscription,
} from '../api/subscriptionApi';

function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function Subscribers() {
  const [audienceTab, setAudienceTab] = useState('MERCHANT'); // 'MERCHANT' | 'USER' | 'STOPPED'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED'
  const [searchQuery, setSearchQuery] = useState('');
  const [subscribers, setSubscribers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active_merchants: 0,
    active_customers: 0,
    stopped_or_expired: 0,
    total_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [stoppingId, setStoppingId] = useState(null);
  const [unstoppingId, setUnstoppingId] = useState(null);
  const [stopModalState, setStopModalState] = useState(null); // { targetName, plans: [], selectedIds: [], reason: '' }
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const effectiveAudience = audienceTab === 'STOPPED' ? 'ALL' : audienceTab;
      const effectiveStatus = audienceTab === 'STOPPED' ? 'CANCELLED' : statusFilter;
      const res = await fetchAdminSubscribers({
        audience: effectiveAudience,
        status: effectiveStatus,
        search: searchQuery,
      });
      setSubscribers(Array.isArray(res.items) ? res.items : []);
      if (res.summary) setSummary(res.summary);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, [audienceTab, statusFilter, searchQuery]);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  const handleOpenStopModal = (row) => {
    const targetName =
      row.merchant_business_name || row.user_name || row.user_email || `User #${row.user_id}`;
    const sameUserActivePlans = subscribers.filter((item) => {
      if (item.status !== 'ACTIVE') return false;
      if (row.merchant_profile_id && item.merchant_profile_id) {
        return String(item.merchant_profile_id) === String(row.merchant_profile_id);
      }
      return String(item.user_id) === String(row.user_id) && item.audience === row.audience;
    });
    const plansList = sameUserActivePlans.length > 0 ? sameUserActivePlans : [row];
    setStopModalState({
      targetName,
      plans: plansList,
      selectedIds: [row.subscription_id],
      reason: 'Stopped by Administrator',
    });
  };

  const handleConfirmStopPlans = async (e) => {
    e.preventDefault();
    if (!stopModalState || stopModalState.selectedIds.length === 0) return;
    setStoppingId(stopModalState.selectedIds[0]);
    setErrorMsg('');
    try {
      for (const subId of stopModalState.selectedIds) {
        await stopAdminSubscription(subId, stopModalState.reason);
      }
      const count = stopModalState.selectedIds.length;
      showToast(
        `${count} subscription plan${count > 1 ? 's' : ''} stopped for ${stopModalState.targetName}.`
      );
      if (selectedSub && stopModalState.selectedIds.includes(selectedSub.subscription_id)) {
        setSelectedSub(null);
      }
      setStopModalState(null);
      await loadSubscribers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to stop subscription');
    } finally {
      setStoppingId(null);
    }
  };

  const handleUnstopSubscription = async (row) => {
    const targetName =
      row.merchant_business_name || row.user_name || row.user_email || `User #${row.user_id}`;
    setUnstoppingId(row.subscription_id);
    setErrorMsg('');
    try {
      const updated = await unstopAdminSubscription(row.subscription_id);
      showToast(`Subscription "${row.package_name}" un-stopped & reactivated for ${targetName}.`);
      setSubscribers((prev) =>
        prev.map((item) =>
          item.subscription_id === row.subscription_id ? { ...item, ...updated } : item
        )
      );
      if (selectedSub && selectedSub.subscription_id === row.subscription_id) {
        setSelectedSub((prev) => ({ ...prev, ...updated }));
      }
      await loadSubscribers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to un-stop subscription');
    } finally {
      setUnstoppingId(null);
    }
  };

  const columns = [
    {
      key: 'subscriber',
      label: audienceTab === 'MERCHANT' ? 'Merchant & Store' : 'Customer',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5 }}>
            {audienceTab === 'MERCHANT'
              ? row.merchant_business_name || row.user_name || `Merchant #${row.user_id}`
              : row.user_name || `Customer #${row.user_id}`}
          </div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
            {row.login_id ? `ID: ${row.login_id}` : row.user_code ? `Code: ${row.user_code}` : `User #${row.user_id}`}
            {row.user_phone ? ` • ${row.user_phone}` : ''}
          </div>
          {row.user_email && (
            <div style={{ fontSize: 11, color: '#64748B' }}>{row.user_email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'package_name',
      label: 'Subscribed Plan',
      render: (val, row) => (
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 9px',
              borderRadius: 7,
              background: '#EFF6FF',
              color: '#1D4ED8',
              fontSize: 12,
              fontWeight: 800,
              border: '1px solid #BFDBFE',
            }}
          >
            {val}
          </span>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: '#059669', marginTop: 4 }}>
            Paid: ₹{Number(row.amount_paid ?? row.package_price ?? 0).toLocaleString('en-IN')}
            {row.duration_days ? ` (${row.duration_days} days)` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'started_at',
      label: 'Subscribed Date & Time',
      render: (val) => (
        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
          {formatDateTime(val)}
        </div>
      ),
    },
    {
      key: 'expires_at',
      label: 'Expires / Days Left',
      render: (val, row) => (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
            {val ? formatDateTime(val) : 'No Expiry'}
          </div>
          {row.status === 'ACTIVE' && row.days_remaining !== null && row.days_remaining !== undefined && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 3,
                padding: '2px 7px',
                borderRadius: 999,
                background: '#ECFDF5',
                color: '#065F46',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <HiOutlineClock size={12} /> {row.days_remaining}d left
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const mapped = val === 'CANCELLED' ? 'stopped' : String(val || 'ACTIVE').toLowerCase();
        return (
          <StatusBadge
            status={mapped === 'active' ? 'active' : mapped === 'stopped' ? 'rejected' : 'pending'}
            label={val === 'CANCELLED' ? 'Stopped' : val}
          />
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => {
        const isActive = row.status === 'ACTIVE';
        const isStopped = row.status === 'CANCELLED';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSelectedSub(row)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 700 }}
            >
              <HiOutlineEye size={14} /> Details
            </button>
            {isActive && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={stoppingId === row.subscription_id}
                onClick={() => handleOpenStopModal(row)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 700 }}
              >
                <HiOutlineBan size={14} />
                {stoppingId === row.subscription_id ? 'Stopping...' : 'Stop'}
              </button>
            )}
            {isStopped && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                disabled={unstoppingId === row.subscription_id}
                onClick={() => handleUnstopSubscription(row)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 700 }}
              >
                <HiOutlineCheckCircle size={14} />
                {unstoppingId === row.subscription_id ? 'Restoring...' : 'Un-stop'}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Subscribers & Active Plans"
        subtitle="Track all Merchant & Customer subscriptions live with date/time logs, plan permissions, details, and instant Admin stop control."
      >
        <button
          type="button"
          className="btn btn-outline"
          onClick={loadSubscribers}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <HiOutlineRefresh className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </PageHeader>

      {toastMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            fontWeight: 700,
            fontSize: 13.5,
          }}
        >
          ✓ {toastMsg}
        </div>
      )}
      {errorMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            fontWeight: 700,
            fontSize: 13.5,
          }}
        >
          {errorMsg}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <StatsCard
          label="Active Merchant Subscribers"
          value={summary.active_merchants || 0}
          trend="up"
          trendValue="Live Merchant Plans"
          icon={<HiOutlineOfficeBuilding />}
          color="success"
          delay={0}
        />
        <StatsCard
          label="Active Customer Subscribers"
          value={summary.active_customers || 0}
          trend="up"
          trendValue="Live Customer Plans"
          icon={<HiOutlineUserGroup />}
          color="primary"
          delay={1}
        />
        <StatsCard
          label="Subscription Revenue"
          value={`₹${Number(summary.total_revenue || 0).toLocaleString('en-IN')}`}
          trend="up"
          trendValue={`${summary.total || 0} Total Purchases`}
          icon={<HiOutlineCreditCard />}
          color="info"
          delay={2}
        />
        <StatsCard
          label="Stopped / Expired"
          value={summary.stopped_or_expired || 0}
          trend="down"
          trendValue="Inactive History"
          icon={<HiOutlineShieldCheck />}
          color="warning"
          delay={3}
        />
      </div>

      {/* Section Tabs: Merchants vs Customers */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setAudienceTab('MERCHANT')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              border: audienceTab === 'MERCHANT' ? '2px solid #2563EB' : '1px solid #E2E8F0',
              background: audienceTab === 'MERCHANT' ? '#EFF6FF' : '#FFFFFF',
              color: audienceTab === 'MERCHANT' ? '#1E40AF' : '#475569',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
            }}
          >
            <HiOutlineOfficeBuilding size={18} />
            <span>Merchants</span>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: audienceTab === 'MERCHANT' ? '#2563EB' : '#F1F5F9', color: audienceTab === 'MERCHANT' ? '#fff' : '#475569', fontSize: 11.5 }}>
              {summary.active_merchants || 0} Active
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAudienceTab('USER')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              border: audienceTab === 'USER' ? '2px solid #7C3AED' : '1px solid #E2E8F0',
              background: audienceTab === 'USER' ? '#F5F3FF' : '#FFFFFF',
              color: audienceTab === 'USER' ? '#5B21B6' : '#475569',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
            }}
          >
            <HiOutlineUserGroup size={18} />
            <span>Customers</span>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: audienceTab === 'USER' ? '#7C3AED' : '#F1F5F9', color: audienceTab === 'USER' ? '#fff' : '#475569', fontSize: 11.5 }}>
              {summary.active_customers || 0} Active
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAudienceTab('STOPPED')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              border: audienceTab === 'STOPPED' ? '2px solid #DC2626' : '1px solid #E2E8F0',
              background: audienceTab === 'STOPPED' ? '#FEF2F2' : '#FFFFFF',
              color: audienceTab === 'STOPPED' ? '#991B1B' : '#475569',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
            }}
          >
            <HiOutlineBan size={18} />
            <span>Stopped List</span>
            <span style={{ padding: '2px 8px', borderRadius: 999, background: audienceTab === 'STOPPED' ? '#DC2626' : '#F1F5F9', color: audienceTab === 'STOPPED' ? '#fff' : '#475569', fontSize: 11.5 }}>
              {summary.stopped_or_expired || 0}
            </span>
          </button>
        </div>

        {/* Status Filter Pills + Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {audienceTab !== 'STOPPED' && ['ALL', 'ACTIVE', 'CANCELLED', 'EXPIRED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: statusFilter === st ? '1.5px solid #0F172A' : '1px solid #CBD5E1',
                background: statusFilter === st ? '#0F172A' : '#FFFFFF',
                color: statusFilter === st ? '#FFFFFF' : '#475569',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {st === 'ALL' ? 'All' : st === 'CANCELLED' ? 'Stopped' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
          <div style={{ position: 'relative' }}>
            <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search name, store, ID, phone, plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '7px 12px 7px 32px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12.5,
                width: 240,
                background: '#FFFFFF',
              }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading && (
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#2563EB' }}>
              <CircularSpinner size={16} />
              <span>Loading {audienceTab === 'MERCHANT' ? 'merchant' : 'customer'} subscribers...</span>
            </div>
          )}
          <DataTable
            columns={columns}
            data={subscribers}
            loading={loading}
            onRowClick={(row) => setSelectedSub(row)}
            emptyText={`No ${audienceTab === 'MERCHANT' ? 'merchant' : 'customer'} subscribers found in this filter.`}
          />
        </div>
      </div>

      {/* Subscriber Details Modal */}
      <Modal
        isOpen={Boolean(selectedSub)}
        onClose={() => setSelectedSub(null)}
        title="Subscriber Plan & Account Details"
        size="lg"
        footer={
          selectedSub && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>
                Subscription ID: #{selectedSub.subscription_id} ({selectedSub.subscription_code})
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedSub(null)}>
                  Close
                </button>
                {selectedSub.status === 'ACTIVE' && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={stoppingId === selectedSub.subscription_id}
                    onClick={() => handleOpenStopModal(selectedSub)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <HiOutlineBan />
                    {stoppingId === selectedSub.subscription_id ? 'Stopping...' : 'Stop Subscription'}
                  </button>
                )}
                {selectedSub.status === 'CANCELLED' && (
                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={unstoppingId === selectedSub.subscription_id}
                    onClick={() => handleUnstopSubscription(selectedSub)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <HiOutlineCheckCircle />
                    {unstoppingId === selectedSub.subscription_id ? 'Restoring...' : 'Un-stop Subscription'}
                  </button>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedSub && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 14, borderRadius: 12, background: selectedSub.status === 'ACTIVE' ? '#ECFDF5' : '#FEF2F2', border: selectedSub.status === 'ACTIVE' ? '1px solid #A7F3D0' : '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: selectedSub.status === 'ACTIVE' ? '#047857' : '#991B1B', textTransform: 'uppercase' }}>
                  {selectedSub.audience === 'MERCHANT' ? 'Merchant Subscription' : 'Customer Subscription'}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{selectedSub.package_name}</div>
                <div style={{ fontSize: 12.5, color: '#475569' }}>
                  Code: <strong>{selectedSub.package_code || '-'}</strong> • Paid: <strong>₹{Number(selectedSub.amount_paid || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: selectedSub.status === 'ACTIVE' ? '#16A34A' : '#DC2626' }}>
                  {selectedSub.status === 'CANCELLED' ? 'STOPPED' : selectedSub.status}
                </div>
                {selectedSub.status === 'ACTIVE' && selectedSub.days_remaining !== null && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>
                    {selectedSub.days_remaining} Days Remaining
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Subscriber Name</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{selectedSub.user_name || '-'}</div>
              </div>
              {selectedSub.merchant_business_name && (
                <div style={{ padding: 12, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Merchant Store</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                    {selectedSub.merchant_business_name} (#{selectedSub.merchant_profile_id})
                  </div>
                </div>
              )}
              <div style={{ padding: 12, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Login ID / User Code</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                  {selectedSub.login_id || '-'} ({selectedSub.user_code || `User #${selectedSub.user_id}`})
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Phone &amp; Email</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{selectedSub.user_phone || '-'}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{selectedSub.user_email || '-'}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Subscribed At (Date &amp; Time)</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{formatDateTime(selectedSub.started_at)}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Expires At (Date &amp; Time)</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{formatDateTime(selectedSub.expires_at)}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Payment Reference</div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#2563EB', wordBreak: 'break-all' }}>{selectedSub.payment_reference || '-'}</div>
              </div>
              {selectedSub.cancelled_at && (
                <div style={{ padding: 12, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#B91C1C' }}>Stopped At</div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#991B1B' }}>{formatDateTime(selectedSub.cancelled_at)}</div>
                </div>
              )}
            </div>

            {Array.isArray(selectedSub.features) && selectedSub.features.length > 0 && (
              <div style={{ padding: 14, borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF', marginBottom: 8 }}>
                  Included Plan Permissions / Features
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedSub.features.map((feat, idx) => (
                    <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, padding: '4px 9px', borderRadius: 7, background: '#FFFFFF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                      <HiOutlineCheckCircle size={13} />
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Select Plan(s) to Stop Modal */}
      <Modal
        isOpen={Boolean(stopModalState)}
        onClose={() => !stoppingId && setStopModalState(null)}
        title={`Stop Subscription Plan — ${stopModalState?.targetName || ''}`}
        size="md"
        footer={
          stopModalState && (
            <>
              <button
                type="button"
                className="btn btn-outline"
                disabled={Boolean(stoppingId)}
                onClick={() => setStopModalState(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={Boolean(stoppingId) || stopModalState.selectedIds.length === 0}
                onClick={handleConfirmStopPlans}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <HiOutlineBan />
                {stoppingId
                  ? 'Stopping...'
                  : `Stop ${stopModalState.selectedIds.length} Selected Plan${stopModalState.selectedIds.length > 1 ? 's' : ''}`}
              </button>
            </>
          )
        }
      >
        {stopModalState && (
          <form onSubmit={handleConfirmStopPlans}>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#475569' }}>
              Choose which active subscription plan(s) of <strong>{stopModalState.targetName}</strong> you want to stop:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {stopModalState.plans.map((plan) => {
                const checked = stopModalState.selectedIds.includes(plan.subscription_id);
                return (
                  <label
                    key={plan.subscription_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: checked ? '2px solid #DC2626' : '1px solid #CBD5E1',
                      background: checked ? '#FEF2F2' : '#F8FAFC',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setStopModalState((prev) => ({
                            ...prev,
                            selectedIds: isChecked
                              ? [...prev.selectedIds, plan.subscription_id]
                              : prev.selectedIds.filter((id) => id !== plan.subscription_id),
                          }));
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                          {plan.package_name}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>
                          Paid ₹{Number(plan.amount_paid ?? plan.package_price ?? 0).toLocaleString('en-IN')}
                          {plan.days_remaining !== null && plan.days_remaining !== undefined
                            ? ` • ${plan.days_remaining}d left`
                            : ''}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#059669' }}>ACTIVE</span>
                  </label>
                );
              })}
            </div>
            <div className="form-group">
              <label className="form-label">Stop Reason (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={stopModalState.reason}
                onChange={(e) =>
                  setStopModalState((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Reason for stopping subscription"
              />
            </div>
          </form>
        )}
      </Modal>
    </motion.div>
  );
}
