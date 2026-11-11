import React, { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineFilter,
  HiOutlineArrowUp,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClock,
  HiOutlineCash,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import {
  fetchAdminWithdrawals,
  sendAdminWithdrawal,
  rejectAdminWithdrawal,
} from '../api/walletApi';

export default function Withdrawals() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const [sendingId, setSendingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const updateBadgeCount = useCallback((count) => {
    const num = isNaN(count) ? 0 : Math.max(0, count);
    setPendingCount(num);
    try {
      localStorage.setItem('pending_withdrawals_count', String(num));
      window.dispatchEvent(new CustomEvent('withdrawals-count-updated', { detail: num }));
    } catch (_) {}
  }, []);

  const loadPendingCount = useCallback(async () => {
    try {
      const res = await fetchAdminWithdrawals({ status: 'PENDING', page: 1, pageSize: 1 });
      updateBadgeCount(res?.total ?? 0);
    } catch (_) {}
  }, [updateBadgeCount]);

  const loadCompletedCount = useCallback(async () => {
    try {
      const res = await fetchAdminWithdrawals({ status: 'COMPLETED', page: 1, pageSize: 1 });
      setCompletedCount(res?.total ?? 0);
    } catch (_) {}
  }, []);

  const loadWithdrawals = useCallback(
    async (targetPage = page, targetStatus = statusFilter) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchAdminWithdrawals({
          status: targetStatus,
          page: targetPage,
          pageSize,
        });
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.withdrawals)
          ? res.withdrawals
          : [];
        setData(list);
        const totalCount = res?.total ?? list.length;
        setTotal(totalCount);
        setPage(res?.page ?? targetPage);
        setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));

        if (targetStatus === 'PENDING') {
          updateBadgeCount(totalCount);
        }
      } catch (err) {
        console.error('Failed to load withdrawals:', err);
        setError(err.message || 'Failed to load withdrawal requests.');
      } finally {
        setLoading(false);
      }
    },
    [page, pageSize, statusFilter, updateBadgeCount]
  );

  useEffect(() => {
    loadWithdrawals(1, statusFilter);
    loadPendingCount();
    loadCompletedCount();
  }, [statusFilter]);

  // ── Admin: Approve Withdrawal ──
  const handleApprove = async (txnGroupId, userName, amount) => {
    if (!txnGroupId) return;
    const confirmed = window.confirm(
      `Approve and send ₹${Number(amount || 0).toFixed(2)} to ${userName || 'user'} bank account?`
    );
    if (!confirmed) return;

    setSendingId(txnGroupId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await sendAdminWithdrawal(txnGroupId);
      setActionSuccess(res?.message || `✓ Withdrawal of ₹${Number(amount).toFixed(2)} approved! Status is now Withdrawed.`);
      await loadWithdrawals(page, statusFilter);
      loadPendingCount();
      loadCompletedCount();
    } catch (err) {
      console.error('Approve withdrawal error:', err);
      setActionError(err.message || 'Failed to approve withdrawal.');
    } finally {
      setSendingId(null);
    }
  };

  // ── Admin: Reject Withdrawal ──
  const handleReject = async (txnGroupId, userName, amount) => {
    if (!txnGroupId) return;
    const reason = window.prompt(
      `Reject withdrawal of ₹${Number(amount || 0).toFixed(2)} for ${userName || 'user'}?\nEnter rejection reason:`,
      'Rejected by admin'
    );
    if (reason === null) return;

    setRejectingId(txnGroupId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await rejectAdminWithdrawal(txnGroupId, reason.trim() || 'Rejected by admin');
      setActionSuccess(res?.message || `✓ Withdrawal rejected and ₹${Number(amount).toFixed(2)} refunded to user wallet.`);
      await loadWithdrawals(page, statusFilter);
      loadPendingCount();
      loadCompletedCount();
    } catch (err) {
      console.error('Reject withdrawal error:', err);
      setActionError(err.message || 'Failed to reject withdrawal request.');
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Withdrawals"
        subtitle="Review, approve, and track customer bank withdrawal requests"
        breadcrumbs={[
          { label: 'Dashboard', path: '/' },
          { label: 'Withdrawals', active: true },
        ]}
        actions={
          <button
            type="button"
            onClick={() => {
              loadWithdrawals(page, statusFilter);
              loadPendingCount();
              loadCompletedCount();
            }}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlineRefresh className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* ── Summary Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Card 1: Pending Requests */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          style={{
            background: 'linear-gradient(135deg, #78350F 0%, #D97706 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(217, 119, 6, 0.2)',
            border: statusFilter === 'PENDING' ? '2px solid #FDE68A' : '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12.5, color: '#FDE68A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending Requests
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', marginTop: 4 }}>
                {pendingCount}
              </div>
              <div style={{ fontSize: 11.5, color: '#FEF3C7', marginTop: 2 }}>
                Requests waiting for admin approval
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              <HiOutlineClock />
            </div>
          </div>
        </div>

        {/* Card 2: Withdrawed / Completed */}
        <div
          onClick={() => setStatusFilter('COMPLETED')}
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #059669 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.2)',
            border: statusFilter === 'COMPLETED' ? '2px solid #A7F3D0' : '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12.5, color: '#A7F3D0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Withdrawed
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', marginTop: 4 }}>
                {completedCount}
              </div>
              <div style={{ fontSize: 11.5, color: '#D1FAE5', marginTop: 2 }}>
                Successfully disbursed to user banks
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              <HiOutlineCheckCircle />
            </div>
          </div>
        </div>

        {/* Card 3: All Statuses */}
        <div
          onClick={() => setStatusFilter('ALL')}
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(51, 65, 85, 0.2)',
            border: statusFilter === 'ALL' ? '2px solid #CBD5E1' : '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12.5, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Records
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', marginTop: 4 }}>
                {statusFilter === 'ALL' ? total : (pendingCount + completedCount)}
              </div>
              <div style={{ fontSize: 11.5, color: '#CBD5E1', marginTop: 2 }}>
                Filter to view all withdrawal requests
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              <HiOutlineCreditCard />
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Alerts ── */}
      {actionSuccess && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 18px',
            background: '#DCFCE7',
            borderLeft: '4px solid #16A34A',
            borderRadius: 8,
            color: '#15803D',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)',
          }}
        >
          <HiOutlineCheckCircle style={{ fontSize: 22, color: '#16A34A', flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 18px',
            background: '#FEE2E2',
            borderLeft: '4px solid #EF4444',
            borderRadius: 8,
            color: '#991B1B',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)',
          }}
        >
          <HiOutlineExclamationCircle style={{ fontSize: 22, color: '#EF4444', flexShrink: 0 }} />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="card">
        <div
          className="card-header"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-light, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="badge badge-info"
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 8,
                background: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #DBEAFE',
              }}
            >
              Total: {total} Requests
            </span>
            {pendingCount > 0 && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 12,
                  background: '#FEF3C7',
                  color: '#B45309',
                }}
              >
                {pendingCount} Pending Approval
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 12.5,
                color: 'var(--text-secondary, #64748B)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <HiOutlineFilter style={{ fontSize: 14 }} /> Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-select"
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 13,
                border: '1px solid var(--border-light, #CBD5E1)',
                background: 'var(--card-bg, #FFFFFF)',
                color: 'var(--text, #0F172A)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="PENDING">Pending Approval</option>
              <option value="COMPLETED">Withdrawed</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HiOutlineRefresh className="animate-spin" style={{ fontSize: 32, color: '#3B82F6', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Loading withdrawal requests...</div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{ padding: '30px 20px', textAlign: 'center' }}>
            <div style={{ color: '#DC2626', fontWeight: 600, marginBottom: 12 }}>{error}</div>
            <button
              onClick={() => loadWithdrawals(page, statusFilter)}
              className="btn btn-outline"
              style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
            >
              <HiOutlineRefresh /> Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && data.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HiOutlineCreditCard style={{ fontSize: 44, color: '#CBD5E1', marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #0F172A)' }}>
              No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} withdrawal requests found.
            </div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
              Customer withdrawal requests will appear here for admin approval.
            </div>
          </div>
        )}

        {/* Withdrawals Table */}
        {!loading && !error && data.length > 0 && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beneficiary User</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Bank Details</th>
                  <th>Mode</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th>Requested Date</th>
                  <th style={{ textAlign: 'center' }}>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((w) => {
                  const isPending = (w.status || '').toUpperCase() === 'PENDING';
                  const isCompleted = (w.status || '').toUpperCase() === 'COMPLETED';
                  const isRejected = (w.status || '').toUpperCase() === 'REJECTED';
                  const isFailed = (w.status || '').toUpperCase() === 'FAILED';
                  const isSendingThis = sendingId === w.transaction_group_id;
                  const isRejectingThis = rejectingId === w.transaction_group_id;

                  const dateStr = w.created_at
                    ? new Date(w.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={w.id || w.transaction_group_id}>
                      {/* Beneficiary User */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text, #0F172A)' }}>
                          {w.account_holder_name || w.user_name || 'Customer'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary, #64748B)', marginTop: 2 }}>
                          {w.user_phone ? `📞 ${w.user_phone}` : ''}
                          {w.user_email ? ` • ${w.user_email}` : ''}
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, fontSize: 14.5, color: '#DC2626' }}>
                          ₹{Number(w.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Bank Details */}
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B' }}>
                          A/C: <span style={{ fontFamily: 'monospace' }}>{w.account_number_masked || '—'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          IFSC: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{w.ifsc || '—'}</span>
                        </div>
                      </td>

                      {/* Mode */}
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: '#F1F5F9',
                            color: '#334155',
                          }}
                        >
                          {w.payout_mode || 'IMPS'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: 12,
                            display: 'inline-block',
                            backgroundColor: isCompleted
                              ? '#DCFCE7'
                              : isPending
                              ? '#FEF3C7'
                              : isRejected || isFailed
                              ? '#FEE2E2'
                              : '#DBEAFE',
                            color: isCompleted
                              ? '#15803D'
                              : isPending
                              ? '#B45309'
                              : isRejected || isFailed
                              ? '#B91C1C'
                              : '#1D4ED8',
                          }}
                        >
                          {isCompleted
                            ? 'Withdrawed'
                            : isPending
                            ? 'Pending Approval'
                            : isRejected
                            ? 'Rejected'
                            : isFailed
                            ? 'Failed'
                            : w.status}
                        </span>
                      </td>

                      {/* Requested Date */}
                      <td style={{ fontSize: 12, color: 'var(--text-secondary, #64748B)', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      {/* Admin Action */}
                      <td style={{ textAlign: 'center' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            {/* Approve Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleApprove(
                                  w.transaction_group_id,
                                  w.account_holder_name || w.user_name,
                                  w.amount
                                )
                              }
                              disabled={isSendingThis || isRejectingThis}
                              className="btn btn-success"
                              style={{
                                padding: '6px 14px',
                                fontSize: 12,
                                fontWeight: 700,
                                borderRadius: 8,
                                background: '#16A34A',
                                color: '#FFFFFF',
                                border: 'none',
                                cursor: isSendingThis || isRejectingThis ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
                              }}
                              title="Approve withdrawal and disburse money to user bank account"
                            >
                              {isSendingThis ? (
                                <>
                                  <HiOutlineRefresh className="animate-spin" />
                                  <span>Approving...</span>
                                </>
                              ) : (
                                <>
                                  <HiOutlineCheckCircle style={{ fontSize: 15 }} />
                                  <span>Approve</span>
                                </>
                              )}
                            </button>

                            {/* Reject Button */}
                            <button
                              type="button"
                              onClick={() =>
                                handleReject(
                                  w.transaction_group_id,
                                  w.account_holder_name || w.user_name,
                                  w.amount
                                )
                              }
                              disabled={isSendingThis || isRejectingThis}
                              className="btn btn-danger"
                              style={{
                                padding: '6px 14px',
                                fontSize: 12,
                                fontWeight: 700,
                                borderRadius: 8,
                                background: '#DC2626',
                                color: '#FFFFFF',
                                border: 'none',
                                cursor: isSendingThis || isRejectingThis ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                              }}
                              title="Reject withdrawal and refund money back to user wallet"
                            >
                              {isRejectingThis ? (
                                <>
                                  <HiOutlineRefresh className="animate-spin" />
                                  <span>Rejecting...</span>
                                </>
                              ) : (
                                <span>Reject</span>
                              )}
                            </button>
                          </div>
                        ) : isCompleted ? (
                          <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>
                            ✓ Withdrawed
                            {w.payout_id && (
                              <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748B' }}>
                                Ref: {w.payout_id}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#991B1B', fontWeight: 600 }}>
                            {w.failure_reason || (isRejected ? 'Rejected' : 'Failed')}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && !error && data.length > 0 && totalPages > 1 && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-light, #E2E8F0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary, #64748B)' }}>
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total requests)
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => loadWithdrawals(Math.max(1, page - 1), statusFilter)}
                disabled={page <= 1}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <HiOutlineChevronLeft /> Previous
              </button>
              <button
                type="button"
                onClick={() => loadWithdrawals(Math.min(totalPages, page + 1), statusFilter)}
                disabled={page >= totalPages}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                Next <HiOutlineChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
