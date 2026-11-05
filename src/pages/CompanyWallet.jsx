import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineUsers,
  HiOutlineCash,
  HiOutlinePaperAirplane,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineFilter,
  HiOutlineCollection,
  HiOutlineReceiptTax,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import StatsCard from '../components/UI/StatsCard';
import Modal from '../components/UI/Modal';
import {
  fetchAdminWalletSummary,
  fetchAdminAllTransactions,
  fetchPlatformLedgerTransactions,
  adminSendFunds,
} from '../api/walletApi';

export default function CompanyWallet() {
  // Summary State
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryError, setSummaryError] = useState('');

  // Transactions State & Tabs
  const [activeTab, setActiveTab] = useState('all_tx'); // 'all_tx' | 'ledger'
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [expandedTxId, setExpandedTxId] = useState(null);

  const [txLoading, setTxLoading] = useState(true);
  const [txData, setTxData] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize] = useState(20);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txError, setTxError] = useState('');

  // Global Alerts
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Send Funds Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendRecipientType, setSendRecipientType] = useState('user'); // 'user' | 'merchant'
  const [sendIdentifierType, setSendIdentifierType] = useState('user_id'); // 'user_id' | 'email'
  const [sendIdentifierValue, setSendIdentifierValue] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [sendingFunds, setSendingFunds] = useState(false);
  const [sendModalError, setSendModalError] = useState('');

  // ── Load Admin Wallet Summary ──
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await fetchAdminWalletSummary();
      setSummaryData(res);
    } catch (err) {
      console.error('Wallet summary load error:', err);
      setSummaryError(err.message || 'Failed to load wallet summary');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ── Load Transactions (All Transactions or Platform Ledger) ──
  const loadTransactions = useCallback(async (page = 1) => {
    setTxLoading(true);
    setTxError('');
    try {
      let res;
      if (activeTab === 'all_tx') {
        res = await fetchAdminAllTransactions(page, txPageSize, txTypeFilter);
      } else {
        res = await fetchPlatformLedgerTransactions(page, txPageSize);
      }
      const list = Array.isArray(res?.data) ? res.data : [];
      setTxData(list);
      const totalCount = res?.meta?.total_items ?? res?.total ?? list.length;
      setTxTotal(totalCount);
      const currentPage = res?.meta?.page ?? res?.page ?? page;
      setTxPage(currentPage);
      const totalPages = res?.meta?.total_pages ?? res?.total_pages ?? Math.max(1, Math.ceil(totalCount / txPageSize));
      setTxTotalPages(totalPages);
    } catch (err) {
      console.error('Transactions load error:', err);
      setTxError(err.message || 'Failed to load wallet transactions');
    } finally {
      setTxLoading(false);
    }
  }, [activeTab, txTypeFilter, txPageSize]);

  // Initial and reactive load
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadTransactions(1);
  }, [activeTab, txTypeFilter, loadTransactions]);

  // Refresh all
  const handleRefreshAll = () => {
    setActionSuccess('');
    setActionError('');
    loadSummary();
    loadTransactions(txPage);
  };

  // ── Send Funds Submission ──
  const handleSendFundsSubmit = async (e) => {
    e.preventDefault();
    setSendModalError('');
    setActionSuccess('');
    setActionError('');

    const cleanIdentifier = sendIdentifierValue.trim();
    if (!cleanIdentifier) {
      setSendModalError(`Please enter the recipient ${sendIdentifierType === 'email' ? 'email' : 'ID'}`);
      return;
    }

    const numericAmount = parseFloat(sendAmount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      setSendModalError('Please enter a valid amount greater than ₹0');
      return;
    }

    setSendingFunds(true);
    try {
      const payload = {
        recipient_type: sendRecipientType,
        amount: numericAmount,
        note: sendNote.trim() || undefined,
      };

      if (sendIdentifierType === 'email') {
        payload.email = cleanIdentifier;
      } else {
        payload.user_id = cleanIdentifier;
      }

      const res = await adminSendFunds(payload);
      const msg = res?.message || `Successfully sent ₹${numericAmount.toFixed(2)} to ${res?.recipient || cleanIdentifier}!`;
      setActionSuccess(msg);
      setShowSendModal(false);

      // Reset form
      setSendIdentifierValue('');
      setSendAmount('');
      setSendNote('');

      // Refresh real-time data
      await loadSummary();
      await loadTransactions(1);
    } catch (err) {
      console.error('Send funds error:', err);
      setSendModalError(err.message || 'Failed to send funds');
    } finally {
      setSendingFunds(false);
    }
  };

  // Extract Summary Values
  const companyBalance = summaryData?.company_balance !== undefined
    ? Number(summaryData.company_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

  const totalActiveWalletsBalance = (summaryData?.total_balance_across_active_wallets ?? summaryData?.total_active_wallets_balance) !== undefined
    ? Number(summaryData?.total_balance_across_active_wallets ?? summaryData?.total_active_wallets_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

  const totalWalletCount = summaryData?.total_wallet_count ?? summaryData?.total_wallets_count ?? 0;

  const getTxTypeBadge = (type) => {
    const norm = (type || '').toUpperCase();
    if (norm.includes('CASHBACK')) {
      return { label: 'Cashback Redemption', bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };
    }
    if (norm.includes('TRANSFER')) {
      return { label: 'P2P Transfer', bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' };
    }
    if (norm.includes('ADMIN')) {
      return { label: 'Admin Credit', bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' };
    }
    if (norm.includes('TOPUP')) {
      return { label: 'Wallet Top-up', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
    }
    if (norm.includes('WITHDRAW')) {
      return { label: 'Bank Withdrawal', bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
    }
    return { label: type || 'Transaction', bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 40 }}>
      {/* Top Header */}
      <PageHeader
        title="Admin Wallet"
        subtitle="Real-time company balance, active customer and merchant wallet balances, ledger transactions & fund transfers"
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={handleRefreshAll}
            disabled={summaryLoading || txLoading}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlineRefresh className={summaryLoading || txLoading ? 'animate-spin' : ''} style={{ fontSize: 16 }} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setSendModalError('');
              setShowSendModal(true);
            }}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlinePaperAirplane style={{ fontSize: 18, transform: 'rotate(45deg)' }} />
            <span>Send Funds</span>
          </button>
        </div>
      </PageHeader>

      {/* Action Alerts */}
      {actionSuccess && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: '#D1FAE5',
            borderLeft: '4px solid #10B981',
            borderRadius: 8,
            color: '#065F46',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <HiOutlineCheckCircle style={{ fontSize: 20, color: '#10B981', flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: '#FEE2E2',
            borderLeft: '4px solid #EF4444',
            borderRadius: 8,
            color: '#B91C1C',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <HiOutlineExclamationCircle style={{ fontSize: 20, color: '#EF4444', flexShrink: 0 }} />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Summary Error ── */}
      {summaryError && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: '#FEF3C7',
            borderLeft: '4px solid #F59E0B',
            borderRadius: 8,
            color: '#92400E',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {summaryError}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 1. ADMIN WALLET SUMMARY CARDS (Requirement 7A)               */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Card 1: Company Balance */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderRadius: 16,
            padding: '24px 28px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60A5FA',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                <HiOutlineCash style={{ fontSize: 14 }} />
                Platform Reserve
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>
                Company Balance
              </div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 24, color: '#3B82F6', fontWeight: 700 }}>₹</span>
                {summaryLoading ? '—' : companyBalance}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
                Live company central pool & fee revenue
              </div>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3B82F6',
                fontSize: 24,
              }}
            >
              <HiOutlineCreditCard />
            </div>
          </div>
        </div>

        {/* Card 2: Total Balance Across Active Wallets */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
            borderRadius: 16,
            padding: '24px 28px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(49, 46, 129, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(99, 102, 241, 0.25)',
                  color: '#A5B4FC',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                <HiOutlineTrendingUp style={{ fontSize: 14 }} />
                Active Circulation
              </div>
              <div style={{ fontSize: 13, color: '#C7D2FE', fontWeight: 500 }}>
                Total Balance Across Active Wallets
              </div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 24, color: '#818CF8', fontWeight: 700 }}>₹</span>
                {summaryLoading ? '—' : totalActiveWalletsBalance}
              </div>
              <div style={{ fontSize: 12, color: '#A5B4FC', marginTop: 8 }}>
                Total funds held by active customer & merchant accounts
              </div>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818CF8',
                fontSize: 24,
              }}
            >
              <HiOutlineTrendingUp />
            </div>
          </div>
        </div>

        {/* Card 3: Total Wallet Count */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
            borderRadius: 16,
            padding: '24px 28px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(6, 95, 70, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(16, 185, 129, 0.25)',
                  color: '#6EE7B7',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                <HiOutlineUsers style={{ fontSize: 14 }} />
                Active Wallets
              </div>
              <div style={{ fontSize: 13, color: '#A7F3D0', fontWeight: 500 }}>
                Total Wallet Count
              </div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                }}
              >
                {summaryLoading ? '—' : Number(totalWalletCount).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 12, color: '#6EE7B7', marginTop: 8 }}>
                Registered active wallets across the platform
              </div>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34D399',
                fontSize: 24,
              }}
            >
              <HiOutlineUsers />
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 2. ADMIN WALLET TRANSACTIONS TABLE (Requirement 7B)           */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginTop: 24 }}>
        <div
          className="card-header"
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div className="card-header-title" style={{ fontSize: 16, fontWeight: 700 }}>
                {activeTab === 'all_tx' ? 'All Wallet Transactions' : 'Platform Commission Ledger'}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {activeTab === 'all_tx'
                  ? 'Complete transaction history across all users, merchants, and platform wallets (GET /api/v1/admin/transactions)'
                  : 'Company commission ledger of incoming 2% platform fees earned from merchant QR sales (GET /api/v1/wallet/admin/transactions/platform-ledger)'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-info" style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px' }}>
                Total: {txTotal} Transactions
              </span>
            </div>
          </div>

          {/* Navigation Tabs & Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'inline-flex', padding: 3, background: 'var(--bg-light, #F1F5F9)', borderRadius: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all_tx');
                  setTxPage(1);
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  backgroundColor: activeTab === 'all_tx' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'all_tx' ? '#2563EB' : 'var(--text-secondary, #64748B)',
                  boxShadow: activeTab === 'all_tx' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <HiOutlineCollection style={{ fontSize: 16 }} />
                <span>All Transactions</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('ledger');
                  setTxPage(1);
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  backgroundColor: activeTab === 'ledger' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'ledger' ? '#2563EB' : 'var(--text-secondary, #64748B)',
                  boxShadow: activeTab === 'ledger' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <HiOutlineReceiptTax style={{ fontSize: 16 }} />
                <span>Platform Commission Ledger</span>
              </button>
            </div>

            {/* Filter by Transaction Type (Only on All Transactions tab) */}
            {activeTab === 'all_tx' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HiOutlineFilter style={{ fontSize: 14 }} /> Type:
                </span>
                <select
                  value={txTypeFilter}
                  onChange={(e) => {
                    setTxTypeFilter(e.target.value);
                    setTxPage(1);
                  }}
                  className="input-select"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    border: '1px solid var(--border-light, #CBD5E1)',
                    background: 'var(--card-bg, #FFFFFF)',
                    color: 'var(--text, #0F172A)',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">All Types</option>
                  <option value="CASHBACK_REDEMPTION">Cashback Redemption</option>
                  <option value="P2P_TRANSFER">P2P Transfer</option>
                  <option value="ADMIN_CREDIT">Admin Credit</option>
                  <option value="WALLET_TOPUP">Wallet Top-up</option>
                  <option value="WITHDRAWAL">Bank Withdrawal</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Error State */}
        {txError && (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ color: '#DC2626', fontWeight: 600, marginBottom: 12 }}>{txError}</div>
            <button onClick={() => loadTransactions(txPage)} className="btn btn-outline" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <HiOutlineRefresh /> Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {txLoading && !txError && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HiOutlineRefresh className="animate-spin" style={{ fontSize: 32, color: '#3B82F6', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Loading transactions...</div>
          </div>
        )}

        {/* Empty State */}
        {!txLoading && !txError && txData.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HiOutlineCash style={{ fontSize: 44, color: '#CBD5E1', marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              {activeTab === 'all_tx' ? 'No transactions found.' : 'No platform commission transactions found.'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
              {activeTab === 'all_tx'
                ? 'Transactions performed across the platform will appear here.'
                : 'When customers redeem QR cashback at merchant stores, incoming 2% platform fees will appear here.'}
            </div>
          </div>
        )}

        {/* ── Table 1: All Wallet Transactions (GET /api/v1/admin/transactions) ── */}
        {!txLoading && !txError && txData.length > 0 && activeTab === 'all_tx' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Initiated By</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Total Amount</th>
                  <th>Ledger Summary</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'center' }}>Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {txData.map((t) => {
                  const badge = getTxTypeBadge(t.transaction_type);
                  const isExpanded = expandedTxId === t.id;
                  const dateStr = t.created_at ? new Date(t.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }) : '—';
                  const formattedAmount = Number(t.amount || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  return (
                    <React.Fragment key={t.id}>
                      <tr style={{ background: isExpanded ? 'rgba(59, 130, 246, 0.03)' : undefined }}>
                        {/* Ref ID */}
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>#{t.id}</span>
                            <span
                              style={{
                                fontSize: 11,
                                fontFamily: 'monospace',
                                color: 'var(--text-secondary)',
                                marginTop: 2,
                                maxWidth: 140,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={t.transaction_group_id}
                            >
                              {t.transaction_group_id}
                            </span>
                          </div>
                        </td>

                        {/* Initiated By */}
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {t.initiated_by_name || (t.initiated_by_email ? t.initiated_by_email.split('@')[0] : 'System')}
                          </div>
                          {t.initiated_by_email && (
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {t.initiated_by_email}
                            </div>
                          )}
                        </td>

                        {/* Type Badge */}
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 6,
                              backgroundColor: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`,
                              fontSize: 11.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Amount */}
                        <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                          ₹{formattedAmount}
                        </td>

                        {/* Ledger Summary */}
                        <td style={{ fontSize: 12 }}>
                          {Array.isArray(t.ledger_entries) && t.ledger_entries.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {t.ledger_entries.map((entry, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: 11,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    fontWeight: 600,
                                    backgroundColor: (entry.direction || '').toUpperCase() === 'CREDIT' ? '#DCFCE7' : '#FEE2E2',
                                    color: (entry.direction || '').toUpperCase() === 'CREDIT' ? '#15803D' : '#B91C1C',
                                  }}
                                >
                                  {entry.direction === 'CREDIT' ? '+' : '-'}₹{Number(entry.amount).toFixed(2)} ({entry.wallet_type})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>

                        {/* Description */}
                        <td style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 220 }}>
                          {t.description || '—'}
                        </td>

                        {/* Date */}
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {dateStr}
                        </td>

                        {/* Expand Button */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedTxId(isExpanded ? null : t.id)}
                            className="btn btn-outline"
                            style={{
                              padding: '4px 8px',
                              fontSize: 11,
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span>{isExpanded ? 'Hide' : 'Lines'}</span>
                            {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Ledger Entries Row */}
                      {isExpanded && (
                        <tr style={{ background: '#F8FAFC' }}>
                          <td colSpan={8} style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#334155' }}>
                              Ledger Breakdown for Transaction #{t.id} ({t.transaction_group_id}):
                            </div>
                            {Array.isArray(t.ledger_entries) && t.ledger_entries.length > 0 ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                                {t.ledger_entries.map((entry) => {
                                  const isCred = (entry.direction || '').toUpperCase() === 'CREDIT';
                                  return (
                                    <div
                                      key={entry.id}
                                      style={{
                                        background: '#FFFFFF',
                                        border: `1px solid ${isCred ? '#BBF7D0' : '#FECACA'}`,
                                        borderRadius: 8,
                                        padding: '10px 14px',
                                        fontSize: 12,
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontWeight: 700, color: isCred ? '#15803D' : '#B91C1C' }}>
                                          {entry.direction} (₹{Number(entry.amount).toFixed(2)})
                                        </span>
                                        <span style={{ fontSize: 10, background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                          {entry.wallet_type} WALLET
                                        </span>
                                      </div>
                                      <div style={{ color: '#475569' }}>
                                        <strong>Account:</strong> {entry.user_name || entry.user_email || `Wallet #${entry.wallet_id}`}
                                      </div>
                                      <div style={{ color: '#475569', marginTop: 2 }}>
                                        <strong>Balance After:</strong> ₹{Number(entry.balance_after || 0).toFixed(2)}
                                      </div>
                                      {entry.counterparty_name && (
                                        <div style={{ color: '#64748B', marginTop: 2 }}>
                                          <strong>Counterparty:</strong> {entry.counterparty_name}
                                        </div>
                                      )}
                                      {entry.note && (
                                        <div style={{ color: '#64748B', marginTop: 2, fontStyle: 'italic' }}>
                                          "{entry.note}"
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ color: '#94A3B8', fontSize: 12 }}>No ledger lines recorded for this transaction.</div>
                            )}

                            {/* Bank details if withdrawal */}
                            {(t.bank_account_holder_name || t.bank_account_last4) && (
                              <div style={{ marginTop: 10, padding: '8px 12px', background: '#EFF6FF', borderRadius: 6, fontSize: 12, color: '#1E40AF' }}>
                                <strong>Bank Details:</strong> {t.bank_account_holder_name || '—'} | Account Last 4: {t.bank_account_last4 || '—'} | IFSC: {t.bank_ifsc || '—'}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Table 2: Platform Commission Ledger (GET /api/v1/wallet/admin/transactions/platform-ledger) ── */}
        {!txLoading && !txError && txData.length > 0 && activeTab === 'ledger' && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Merchant / Store</th>
                  <th>Transaction Type</th>
                  <th style={{ textAlign: 'center' }}>Direction</th>
                  <th style={{ textAlign: 'right' }}>Commission Received</th>
                  <th style={{ textAlign: 'right' }}>Balance After</th>
                  <th>Note</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {txData.map((t) => {
                  const isCredit = (t.direction || '').toUpperCase() === 'CREDIT';
                  const formattedAmount = Number(t.amount || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  const formattedBalanceAfter = Number(t.balance_after || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  const dateStr = t.date ? new Date(t.date).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }) : '—';

                  const customerDisplay = t.customer_name || t.customer_details;
                  const merchantDisplay = t.merchant_name || t.merchant_details;

                  return (
                    <tr key={t.id}>
                      {/* Customer Details */}
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {customerDisplay ? (
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{t.customer_name || customerDisplay}</span>
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  backgroundColor: '#F1F5F9',
                                  color: '#475569',
                                }}
                              >
                                User
                              </span>
                            </div>
                            {(t.customer_phone || t.customer_email) && (
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                {t.customer_phone || t.customer_email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Merchant Details */}
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {merchantDisplay ? (
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{t.merchant_name || merchantDisplay}</span>
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  backgroundColor: '#EFF6FF',
                                  color: '#2563EB',
                                }}
                              >
                                Merchant
                              </span>
                            </div>
                            {t.merchant_city && (
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                                📍 {t.merchant_city}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Transaction Type */}
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 6,
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: 11,
                            textTransform: 'uppercase',
                          }}
                        >
                          {t.transaction_type || 'PLATFORM_FEE'}
                        </span>
                      </td>

                      {/* Direction */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`badge ${isCredit ? 'badge-active' : 'badge-inactive'}`}
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            backgroundColor: isCredit ? '#DCFCE7' : '#FEE2E2',
                            color: isCredit ? '#15803D' : '#B91C1C',
                          }}
                        >
                          {isCredit ? '+ CREDIT' : '- DEBIT'}
                        </span>
                      </td>

                      {/* Commission Received (Amount) */}
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          color: isCredit ? '#15803D' : '#B91C1C',
                          fontSize: 14,
                        }}
                      >
                        {isCredit ? '+' : '-'}₹{formattedAmount}
                      </td>

                      {/* Balance After */}
                      <td
                        style={{
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          fontSize: 13,
                          color: 'var(--text)',
                        }}
                      >
                        ₹{formattedBalanceAfter}
                      </td>

                      {/* Note */}
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 240 }}>
                        {t.note || '—'}
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Controls ── */}
        {!txLoading && !txError && txTotal > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 24px',
              borderTop: '1px solid var(--border-light)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Showing {Math.min((txPage - 1) * txPageSize + 1, txTotal)} to{' '}
              {Math.min(txPage * txPageSize, txTotal)} of {txTotal} entries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => loadTransactions(txPage - 1)}
                disabled={txPage <= 1 || txLoading}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  fontSize: 13,
                  opacity: txPage <= 1 ? 0.5 : 1,
                  cursor: txPage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <HiOutlineChevronLeft />
                <span>Previous</span>
              </button>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  padding: '0 8px',
                }}
              >
                Page {txPage} of {txTotalPages}
              </span>

              <button
                type="button"
                onClick={() => loadTransactions(txPage + 1)}
                disabled={txPage >= txTotalPages || txLoading}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  fontSize: 13,
                  opacity: txPage >= txTotalPages ? 0.5 : 1,
                  cursor: txPage >= txTotalPages ? 'not-allowed' : 'pointer',
                }}
              >
                <span>Next</span>
                <HiOutlineChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 3. ADMIN SEND FUNDS MODAL (Requirement 7C)                    */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Funds from Admin Wallet"
        size="md"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={() => setShowSendModal(false)}
              className="btn btn-outline"
              disabled={sendingFunds}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={sendingFunds}
              onClick={handleSendFundsSubmit}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {sendingFunds ? (
                <>
                  <HiOutlineRefresh className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <HiOutlinePaperAirplane style={{ transform: 'rotate(45deg)' }} />
                  <span>Send Funds</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSendFundsSubmit}>
          {sendModalError && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: '#FEE2E2',
                borderLeft: '4px solid #EF4444',
                borderRadius: 6,
                color: '#B91C1C',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {sendModalError}
            </div>
          )}

          {/* Recipient Type: User or Merchant */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Recipient Type *
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `2px solid ${sendRecipientType === 'user' ? '#3B82F6' : '#E2E8F0'}`,
                  background: sendRecipientType === 'user' ? '#EFF6FF' : '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13.5,
                  color: sendRecipientType === 'user' ? '#1E40AF' : '#475569',
                }}
              >
                <input
                  type="radio"
                  name="recipient_type"
                  value="user"
                  checked={sendRecipientType === 'user'}
                  onChange={() => setSendRecipientType('user')}
                />
                <span>Customer / User</span>
              </label>

              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `2px solid ${sendRecipientType === 'merchant' ? '#3B82F6' : '#E2E8F0'}`,
                  background: sendRecipientType === 'merchant' ? '#EFF6FF' : '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13.5,
                  color: sendRecipientType === 'merchant' ? '#1E40AF' : '#475569',
                }}
              >
                <input
                  type="radio"
                  name="recipient_type"
                  value="merchant"
                  checked={sendRecipientType === 'merchant'}
                  onChange={() => setSendRecipientType('merchant')}
                />
                <span>Merchant / Store</span>
              </label>
            </div>
          </div>

          {/* Identifier Type Switch: User ID or Email */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
                Recipient Identifier *
              </label>
              <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                <span
                  onClick={() => setSendIdentifierType('user_id')}
                  style={{
                    cursor: 'pointer',
                    color: sendIdentifierType === 'user_id' ? '#3B82F6' : '#64748B',
                    fontWeight: sendIdentifierType === 'user_id' ? 700 : 500,
                    textDecoration: sendIdentifierType === 'user_id' ? 'underline' : 'none',
                  }}
                >
                  Use {sendRecipientType === 'merchant' ? 'Merchant ID' : 'User ID'}
                </span>
                <span style={{ color: '#CBD5E1' }}>|</span>
                <span
                  onClick={() => setSendIdentifierType('email')}
                  style={{
                    cursor: 'pointer',
                    color: sendIdentifierType === 'email' ? '#3B82F6' : '#64748B',
                    fontWeight: sendIdentifierType === 'email' ? 700 : 500,
                    textDecoration: sendIdentifierType === 'email' ? 'underline' : 'none',
                  }}
                >
                  Use Email
                </span>
              </div>
            </div>

            <input
              type={sendIdentifierType === 'email' ? 'email' : 'number'}
              placeholder={
                sendIdentifierType === 'email'
                  ? 'e.g. merchant@store.com or user@gmail.com'
                  : sendRecipientType === 'merchant'
                  ? 'e.g. 102 (Merchant ID or User ID)'
                  : 'e.g. 45 (User ID)'
              }
              value={sendIdentifierValue}
              onChange={(e) => setSendIdentifierValue(e.target.value)}
              className="form-input"
              required
            />
            <span style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4, display: 'block' }}>
              {sendIdentifierType === 'email'
                ? 'Enter the registered email of the recipient account.'
                : 'Enter the numeric database ID of the user or merchant.'}
            </span>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 500.00"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Optional Note */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Transaction Note <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Promotional cash grant / Merchant top-up"
              value={sendNote}
              onChange={(e) => setSendNote(e.target.value)}
              className="form-input"
            />
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
