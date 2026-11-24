import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  HiOutlineXCircle,
  HiOutlineFilter,
  HiOutlineCollection,
  HiOutlineReceiptTax,
  HiOutlineArrowDown,
  HiOutlineArrowUp,
  HiOutlineEye,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineShoppingBag,
} from 'react-icons/hi';
import PageHeader from '../components/UI/PageHeader';
import Modal from '../components/UI/Modal';
import { fetchUsersList } from '../api/userApi';
import { fetchMerchantsList } from '../api/merchantApi';
import {
  fetchAdminWalletSummary,
  fetchAdminWalletTransactions,
  fetchAdminTransactionDetail,
  fetchPlatformLedgerTransactions,
  adminSendFunds,
  fetchAdminWithdrawals,
  sendAdminWithdrawal,
  rejectAdminWithdrawal,
} from '../api/walletApi';

export default function CompanyWallet() {
  // ── Summary State ──
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryError, setSummaryError] = useState('');

  // ── Added Fund State (Admin Capital Float) ──
  const [addedFundBalance, setAddedFundBalance] = useState(() => {
    const saved = localStorage.getItem('admin_added_fund_balance');
    return saved !== null ? parseFloat(saved) : 50000.0;
  });
  const [showAddFundModal, setShowAddFundModal] = useState(false);
  const [addFundAmount, setAddFundAmount] = useState('');
  const [addFundSource, setAddFundSource] = useState('Bank Deposit');
  const [addFundNote, setAddFundNote] = useState('');
  const [isAddingFund, setIsAddingFund] = useState(false);

  // ── Platform Cash Totals ──
  const [totalReceived, setTotalReceived] = useState('0.00');
  const [totalDeducted, setTotalDeducted] = useState('0.00');

  // ── Tabs: 'cash_flow' | 'all_tx' | 'withdrawals' | 'ledger' ──
  const [activeTab, setActiveTab] = useState('cash_flow');
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState('');

  // ── Table 4: Withdrawals State (2-Step Admin Approval) ──
  const [withdrawalsData, setWithdrawalsData] = useState([]);
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0);
  const [withdrawalsPendingCount, setWithdrawalsPendingCount] = useState(0);
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [withdrawalsPageSize] = useState(15);
  const [withdrawalsTotalPages, setWithdrawalsTotalPages] = useState(1);
  const [withdrawalsStatusFilter, setWithdrawalsStatusFilter] = useState('PENDING');
  const [sendingTxGroupId, setSendingTxGroupId] = useState(null);
  const [rejectingTxGroupId, setRejectingTxGroupId] = useState(null);

  // ── Table 1: Platform Cash Flow State ──
  const [cashData, setCashData] = useState([]);
  const [cashTotal, setCashTotal] = useState(0);
  const [cashPage, setCashPage] = useState(1);
  const [cashPageSize] = useState(10);
  const [cashTotalPages, setCashTotalPages] = useState(1);
  const [cashMovementFilter, setCashMovementFilter] = useState('ALL'); // 'ALL' | 'RECEIVED' | 'SENT' | 'ADDED_FUND'

  // ── Table 2: All Wallet Transactions State ──
  const [txData, setTxData] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize] = useState(10);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [expandedTxId, setExpandedTxId] = useState(null);

  // ── Table 3: Platform Commission Ledger State ──
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize] = useState(20);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);

  // ── Global Alerts ──
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // ── Transaction Detail Modal State ──
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTx, setDetailTx] = useState(null);
  const [detailError, setDetailError] = useState('');

  // ── Send Cash Modal State ──
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendRecipientType, setSendRecipientType] = useState('user'); // 'user' | 'merchant'
  const [sendSearchQuery, setSendSearchQuery] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedSourceWallet, setSelectedSourceWallet] = useState('added_fund'); // 'added_fund' | 'commission' | 'received_fund'
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');
  const [sendingFunds, setSendingFunds] = useState(false);
  const [sendModalError, setSendModalError] = useState('');

  // ── Preloaded directory for search ──
  const [allCustomers, setAllCustomers] = useState([]);
  const [allMerchants, setAllMerchants] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const location = useLocation();

  const updatePendingWithdrawalsCount = useCallback((count) => {
    const num = isNaN(count) ? 0 : Math.max(0, count);
    setWithdrawalsPendingCount(num);
    try {
      localStorage.setItem('pending_withdrawals_count', String(num));
      window.dispatchEvent(new CustomEvent('withdrawals-count-updated', { detail: num }));
    } catch (_) {}
  }, []);

  // ── Sync activeTab with URL (/wallet?tab=all_tx) ──
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'all_tx') {
        setActiveTab('all_tx');
      } else if (tabParam === 'ledger') {
        setActiveTab('ledger');
      } else {
        setActiveTab('cash_flow');
      }
    } catch (_) {}
  }, [location.pathname, location.search]);

  // ── Load Admin Wallet Summary ──
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await fetchAdminWalletSummary();
      setSummaryData(res);
      // Also fetch pending withdrawals count for notification badge
      fetchAdminWithdrawals({ status: 'PENDING', page: 1, pageSize: 1 })
        .then((wRes) => updatePendingWithdrawalsCount(wRes?.total ?? 0))
        .catch(() => {});
    } catch (err) {
      console.error('Wallet summary load error:', err);
      setSummaryError(err.message || 'Failed to load wallet summary');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ── Load Transactions, Cash Flow, and Withdrawals ──
  const loadWalletData = useCallback(
    async (
      targetTxPage = txPage,
      targetCashPage = cashPage,
      targetLedgerPage = ledgerPage,
      targetWithdrawalsPage = withdrawalsPage
    ) => {
      setTableLoading(true);
      setTableError('');
      try {
        if (activeTab === 'withdrawals') {
          const res = await fetchAdminWithdrawals({
            status: withdrawalsStatusFilter,
            page: targetWithdrawalsPage,
            pageSize: withdrawalsPageSize,
          });
          const list = Array.isArray(res?.data)
            ? res.data
            : (Array.isArray(res?.withdrawals) ? res.withdrawals : []);
          setWithdrawalsData(list);
          const totalCount = res?.total ?? list.length;
          setWithdrawalsTotal(totalCount);
          setWithdrawalsPage(res?.page ?? targetWithdrawalsPage);
          setWithdrawalsTotalPages(Math.max(1, Math.ceil(totalCount / withdrawalsPageSize)));
          if (withdrawalsStatusFilter === 'PENDING') {
            updatePendingWithdrawalsCount(totalCount);
          }
        } else if (activeTab === 'ledger') {
          const res = await fetchPlatformLedgerTransactions(targetLedgerPage, ledgerPageSize);
          const list = Array.isArray(res?.data) ? res.data : [];
          setLedgerData(list);
          const totalCount = res?.meta?.total_items ?? res?.total ?? list.length;
          setLedgerTotal(totalCount);
          setLedgerPage(targetLedgerPage);
          setLedgerTotalPages(Math.max(1, Math.ceil(totalCount / ledgerPageSize)));
        } else {
          const res = await fetchAdminWalletTransactions({
            page: targetTxPage,
            pageSize: txPageSize,
            cashPage: targetCashPage,
            cashPageSize: cashPageSize,
            transactionType: txTypeFilter,
          });

          // Filter helper: Exclude subscription and membership entries
          const isSubscription = (item) => {
            const str = `${item.transaction_type || ''} ${item.type || ''} ${item.description || ''} ${item.note || ''}`.toUpperCase();
            return str.includes('SUBSCRIPTION') || str.includes('MEMBERSHIP');
          };

          let customEntries = [];
          try {
            customEntries = JSON.parse(localStorage.getItem('admin_custom_cash_entries') || '[]');
          } catch (_) {}

          // Table 2 (data: all transactions) - EXCLUDE SUBSCRIPTIONS
          const rawAllList = Array.isArray(res?.data) ? res.data : [];
          const nonSubAll = rawAllList.filter((item) => !isSubscription(item));
          const allList = [...customEntries, ...nonSubAll];
          setTxData(allList);
          const totalAll = allList.length;
          setTxTotal(totalAll);
          setTxPage(res?.page ?? targetTxPage);
          setTxTotalPages(Math.max(1, Math.ceil(totalAll / txPageSize)));

          // Table 1 (platform_cash: cash received/deducted/added) - EXCLUDE SUBSCRIPTIONS
          const rawCashList = Array.isArray(res?.platform_cash) ? res.platform_cash : [];
          const nonSubCash = rawCashList.filter((item) => !isSubscription(item));
          const cashList = [...customEntries, ...nonSubCash];
          setCashData(cashList);
          const totalCash = cashList.length;
          setCashTotal(totalCash);
          setCashPage(res?.platform_cash_page ?? targetCashPage);
          setCashTotalPages(Math.max(1, Math.ceil(totalCash / cashPageSize)));

          // Cash Totals
          if (res?.total_received !== undefined) {
            setTotalReceived(
              Number(res.total_received).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            );
          }
          if (res?.total_deducted !== undefined) {
            setTotalDeducted(
              Number(res.total_deducted).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            );
          }
        }
      } catch (err) {
        console.error('Wallet data load error:', err);
        setTableError(err.message || 'Failed to load wallet data');
      } finally {
        setTableLoading(false);
      }
    },
    [
      activeTab,
      txPage,
      cashPage,
      ledgerPage,
      withdrawalsPage,
      txPageSize,
      cashPageSize,
      ledgerPageSize,
      withdrawalsPageSize,
      txTypeFilter,
      withdrawalsStatusFilter,
    ]
  );

  // ── Pre-fetch Directory when Send Cash Modal Opens ──
  const loadRecipientsDirectory = useCallback(async () => {
    setLoadingRecipients(true);
    try {
      const [usersRes, merchantsRes] = await Promise.allSettled([
        fetchUsersList({ limit: 1000 }),
        fetchMerchantsList(),
      ]);

      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        setAllCustomers(usersRes.value);
      }
      if (merchantsRes.status === 'fulfilled' && Array.isArray(merchantsRes.value)) {
        setAllMerchants(merchantsRes.value);
      }
    } catch (err) {
      console.warn('Could not pre-fetch recipients:', err);
    } finally {
      setLoadingRecipients(false);
    }
  }, []);

  useEffect(() => {
    if (showSendModal) {
      loadRecipientsDirectory();
    }
  }, [showSendModal, loadRecipientsDirectory]);

  // ── Filtered Search Suggestions for Recipient ──
  const filteredRecipients = React.useMemo(() => {
    const list = sendRecipientType === 'merchant' ? allMerchants : allCustomers;
    if (!sendSearchQuery || !sendSearchQuery.trim()) {
      return list.slice(0, 8);
    }
    const q = sendSearchQuery.toLowerCase().trim();
    return list
      .filter((item) => {
        const name = (item.business_name || item.name || '').toLowerCase();
        const phone = (item.phone || item.phone_number || '').toLowerCase();
        const email = (item.email || '').toLowerCase();
        const loginId = (item.login_id || item.user_code || '').toLowerCase();
        const idStr = String(item.id || item.user_id || '').toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          loginId.includes(q) ||
          idStr.includes(q)
        );
      })
      .slice(0, 15);
  }, [sendRecipientType, allCustomers, allMerchants, sendSearchQuery]);

  // ── Submit: Add Capital to Added Fund ──
  const handleAddFundSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(addFundAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount greater than ₹0');
      return;
    }
    setIsAddingFund(true);
    try {
      const newBal = addedFundBalance + amt;
      setAddedFundBalance(newBal);
      localStorage.setItem('admin_added_fund_balance', String(newBal));

      const newEntry = {
        id: Date.now(),
        transaction_group_id: `ADD-${Date.now()}`,
        movement: 'ADDED_FUND',
        direction: 'CREDIT',
        user_name: 'Platform Admin',
        user_role: 'ADMIN',
        type: 'ADMIN_CAPITAL',
        amount: amt,
        description: addFundNote
          ? `Added Fund: ${addFundNote} (${addFundSource})`
          : `Added Fund: Capital injection via ${addFundSource}`,
        created_at: new Date().toISOString(),
      };

      const savedCustom = JSON.parse(localStorage.getItem('admin_custom_cash_entries') || '[]');
      savedCustom.unshift(newEntry);
      localStorage.setItem('admin_custom_cash_entries', JSON.stringify(savedCustom));

      setCashData((prev) => [newEntry, ...prev]);
      setCashTotal((prev) => prev + 1);

      setActionSuccess(
        `✓ Added ₹${amt.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })} to Admin Added Fund! (Current Balance: ₹${newBal.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })})`
      );
      setShowAddFundModal(false);
      setAddFundAmount('');
      setAddFundNote('');
    } finally {
      setIsAddingFund(false);
    }
  };

  // ── Submit: Send Cash to Merchant or Customer ──
  const handleSendFundsSubmit = async (e) => {
    e.preventDefault();
    setSendModalError('');
    setActionSuccess('');
    setActionError('');

    if (!selectedRecipient) {
      setSendModalError('Please search and select a recipient customer or merchant.');
      return;
    }

    const numericAmount = parseFloat(sendAmount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      setSendModalError('Please enter a valid amount greater than ₹0');
      return;
    }

    // Check Added Fund balance if chosen as source
    if (selectedSourceWallet === 'added_fund' && numericAmount > addedFundBalance) {
      setSendModalError(
        `Insufficient Added Fund balance. Available: ₹${addedFundBalance.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`
      );
      return;
    }

    const sourceWalletLabel =
      selectedSourceWallet === 'added_fund'
        ? 'Added Fund'
        : selectedSourceWallet === 'commission'
        ? 'Commission Fund'
        : 'Received Fund';

    setSendingFunds(true);
    try {
      const recipTargetId = selectedRecipient.user_id || selectedRecipient.id;
      const recipName = selectedRecipient.business_name || selectedRecipient.name || selectedRecipient.email;
      const recipLoginId = selectedRecipient.login_id || selectedRecipient.user_code || `ID #${recipTargetId}`;

      const payload = {
        recipient_type: sendRecipientType,
        user_id: recipTargetId,
        amount: numericAmount,
        note: sendNote.trim()
          ? `${sendNote.trim()} (Sent from Admin ${sourceWalletLabel})`
          : `Admin cash transfer from ${sourceWalletLabel}`,
      };

      if (selectedRecipient.email) {
        payload.email = selectedRecipient.email;
      }

      await adminSendFunds(payload);

      // Deduct from Added Fund if chosen
      if (selectedSourceWallet === 'added_fund') {
        const newBal = Math.max(0, addedFundBalance - numericAmount);
        setAddedFundBalance(newBal);
        localStorage.setItem('admin_added_fund_balance', String(newBal));
      }

      // Record in local cash flow ledger
      const newCashOutEntry = {
        id: Date.now(),
        transaction_group_id: `SEND-${Date.now()}`,
        movement: 'SENT',
        direction: 'DEBIT',
        user_name: recipName,
        user_role: sendRecipientType === 'merchant' ? 'MERCHANT' : 'USER',
        user_email: selectedRecipient.email || selectedRecipient.phone,
        type: 'ADMIN_SEND_FUNDS',
        amount: numericAmount,
        description: `Cash sent to ${recipName} (${recipLoginId}) from ${sourceWalletLabel}${
          sendNote ? ': ' + sendNote : ''
        }`,
        created_at: new Date().toISOString(),
      };

      const savedCustom = JSON.parse(localStorage.getItem('admin_custom_cash_entries') || '[]');
      savedCustom.unshift(newCashOutEntry);
      localStorage.setItem('admin_custom_cash_entries', JSON.stringify(savedCustom));

      setCashData((prev) => [newCashOutEntry, ...prev]);
      setCashTotal((prev) => prev + 1);

      setActionSuccess(
        `✓ Successfully sent ₹${numericAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })} to ${recipName} (${recipLoginId}) from ${sourceWalletLabel}!`
      );
      setShowSendModal(false);

      // Reset
      setSelectedRecipient(null);
      setSendSearchQuery('');
      setSendAmount('');
      setSendNote('');

      // Refresh balances
      loadSummary();
    } catch (err) {
      console.error('Send funds error:', err);
      setSendModalError(err.message || 'Failed to send funds. Please check recipient and try again.');
    } finally {
      setSendingFunds(false);
    }
  };

  // Filtered Cash Data excluding subscriptions and matching movement filter
  const filteredCashData = React.useMemo(() => {
    return cashData.filter((item) => {
      // Exclude subscriptions
      const str = `${item.transaction_type || ''} ${item.type || ''} ${item.description || ''} ${item.note || ''}`.toUpperCase();
      if (str.includes('SUBSCRIPTION') || str.includes('MEMBERSHIP')) return false;

      const m = (item.movement || '').toUpperCase();
      if (cashMovementFilter === 'RECEIVED') {
        return m === 'RECEIVED';
      }
      if (cashMovementFilter === 'SENT') {
        return m === 'SENT' || m === 'DEDUCTED' || (item.direction || '').toUpperCase() === 'DEBIT';
      }
      if (cashMovementFilter === 'ADDED_FUND') {
        return m === 'ADDED_FUND';
      }
      return true;
    });
  }, [cashData, cashMovementFilter]);

  // Extract Summary Values
  const companyBalance =
    summaryData?.total_commission !== undefined
      ? Number(summaryData.total_commission).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : summaryData?.company_balance !== undefined
      ? Number(summaryData.company_balance).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '0.00';

  const totalActiveWalletsBalance =
    (summaryData?.total_balance_across_active_wallets ?? summaryData?.total_active_wallets_balance) !== undefined
      ? Number(
          summaryData?.total_balance_across_active_wallets ?? summaryData?.total_active_wallets_balance
        ).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
        title="Admin Wallet & Platform Cash"
        subtitle="Real-time company balances, platform cash flow (top-ups received & withdrawals deducted), and detailed transaction ledgers"
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={handleRefreshAll}
            disabled={summaryLoading || tableLoading}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlineRefresh className={summaryLoading || tableLoading ? 'animate-spin' : ''} style={{ fontSize: 16 }} />
            <span>Refresh</span>
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

      {/* Summary Error */}
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
      {/* 1. ADMIN 4 WALLET & CASH ACTION CARDS                         */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Card 1: Added Fund (Indigo / Purple) with + Add Fund button */}
        <div
          style={{
            background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 50%, #6366F1 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
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
                  padding: '3px 8px',
                  borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.22)',
                  color: '#FFFFFF',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                <span>🟣 Added Fund</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#E0E7FF', fontWeight: 600 }}>
                Admin Capital &amp; Float
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 20, color: '#C7D2FE', fontWeight: 700 }}>₹</span>
                {addedFundBalance.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div style={{ fontSize: 11.5, color: '#C7D2FE', marginTop: 6 }}>
                Capital injected directly by admin
              </div>
            </div>

            {/* + Add Fund Button */}
            <button
              type="button"
              onClick={() => setShowAddFundModal(true)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.25)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 22,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              title="Add Capital / Float to Added Fund"
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.color = '#4F46E5';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
            >
              <HiOutlinePlus style={{ strokeWidth: 3 }} />
            </button>
          </div>
        </div>

        {/* Card 2: Commissions (Sky Blue) - Existing */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 50%, #38BDF8 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(14, 165, 233, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
                  padding: '3px 8px',
                  borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                <HiOutlineCash style={{ fontSize: 13 }} />
                <span>🔵 Commission Fund</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#E0F2FE', fontWeight: 600 }}>
                Total Merchant Payment Commissions
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 20, color: '#FFFFFF', fontWeight: 700 }}>₹</span>
                {summaryLoading ? '—' : companyBalance}
              </div>
              <div style={{ fontSize: 11.5, color: '#BAE6FD', marginTop: 6 }}>
                Platform fee earned when customers pay merchants
              </div>
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 22,
              }}
            >
              <HiOutlineCreditCard />
            </div>
          </div>
        </div>

        {/* Card 3: Received Funds (Emerald Green) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(4, 120, 87, 0.15)',
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
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 20,
                  background: 'rgba(52, 211, 153, 0.25)',
                  color: '#6EE7B7',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                <HiOutlineArrowDown style={{ fontSize: 13 }} />
                <span>🟢 Received Funds</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#A7F3D0', fontWeight: 500 }}>
                Total Received (Top-ups / Deposits)
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 20, color: '#34D399', fontWeight: 700 }}>₹</span>
                {tableLoading ? '—' : totalReceived}
              </div>
              <div style={{ fontSize: 11.5, color: '#A7F3D0', marginTop: 6 }}>
                Customer &amp; merchant wallet top-ups received
              </div>
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(52, 211, 153, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34D399',
                fontSize: 22,
              }}
            >
              <HiOutlineArrowDown />
            </div>
          </div>
        </div>

        {/* Card 4: Cash Send (Dark Violet / Amber Action Card) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #2E1065 50%, #4C1D95 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(76, 29, 149, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 20,
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#FCD34D',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              <HiOutlinePaperAirplane style={{ fontSize: 13, transform: 'rotate(45deg)' }} />
              <span>💸 Cash Send</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#DDD6FE', fontWeight: 600 }}>
              Send Funds to Users &amp; Merchants
            </div>
            <div style={{ fontSize: 11.5, color: '#C4B5FD', marginTop: 4 }}>
              Deduct from Added Fund, Commission, or Received Fund
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => {
                setSelectedRecipient(null);
                setSendSearchQuery('');
                setSendAmount('');
                setSendNote('');
                setShowSendModal(true);
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#1E1B4B',
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseOut={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              <HiOutlinePaperAirplane style={{ fontSize: 16, transform: 'rotate(45deg)' }} />
              <span>Send Cash Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Success Alert (Visible above tables) */}
      {actionSuccess && (
        <div
          style={{
            marginTop: 20,
            marginBottom: 10,
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

      {/* Action Error Alert (Visible above tables) */}
      {actionError && (
        <div
          style={{
            marginTop: 20,
            marginBottom: 10,
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

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 2. ADMIN WALLET TABLES (Table 1, Table 2 & Ledger)            */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginTop: 16 }}>
        <div
          className="card-header"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* Left: Total Badge */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              className="badge badge-info"
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: 8,
                background: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #DBEAFE',
              }}
            >
              Total:{' '}
              {activeTab === 'cash_flow'
                ? `${cashTotal} Cash Entries`
                : activeTab === 'all_tx'
                ? `${txTotal} Transactions`
                : `${ledgerTotal} Ledger Entries`}
            </span>
          </div>

          {/* Center: Navigation Tabs */}
          <div
            style={{
              display: 'inline-flex',
              padding: 4,
              background: 'var(--bg-light, #F1F5F9)',
              borderRadius: 12,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            {/* Tab 1: Platform Cash Flow */}
            <button
              type="button"
              onClick={() => setActiveTab('cash_flow')}
              style={{
                padding: '8px 18px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
                backgroundColor: activeTab === 'cash_flow' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'cash_flow' ? '#059669' : 'var(--text-secondary, #64748B)',
                boxShadow: activeTab === 'cash_flow' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <HiOutlineCash style={{ fontSize: 16 }} />
              <span>Platform Cash Flow</span>
              <span
                style={{
                  marginLeft: 2,
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: activeTab === 'cash_flow' ? '#DCFCE7' : '#E2E8F0',
                  color: activeTab === 'cash_flow' ? '#15803D' : '#64748B',
                  fontWeight: 700,
                }}
              >
                {cashTotal}
              </span>
            </button>

            {/* Tab 2: All Wallet Transactions */}
            <button
              type="button"
              onClick={() => setActiveTab('all_tx')}
              style={{
                padding: '8px 18px',
                borderRadius: 9,
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
              <span
                style={{
                  marginLeft: 2,
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: activeTab === 'all_tx' ? '#DBEAFE' : '#E2E8F0',
                  color: activeTab === 'all_tx' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700,
                }}
              >
                {txTotal}
              </span>
            </button>

          </div>

          {/* Right: Filter dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200, justifyContent: 'flex-end' }}>
            {activeTab === 'cash_flow' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <HiOutlineFilter style={{ fontSize: 14 }} /> Filter:
                </span>
                <select
                  value={cashMovementFilter}
                  onChange={(e) => setCashMovementFilter(e.target.value)}
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
                  <option value="ALL">All Cash Movements</option>
                  <option value="RECEIVED">🟢 Cash Received (+ Inflows)</option>
                  <option value="SENT">🔴 Cash Sent (- Outflows)</option>
                  <option value="ADDED_FUND">🟣 Added Funds (+ Capital)</option>
                </select>
              </div>
            )}

            {activeTab === 'all_tx' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <HiOutlineFilter style={{ fontSize: 14 }} /> Type:
                </span>
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
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
        {tableError && (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ color: '#DC2626', fontWeight: 600, marginBottom: 12 }}>{tableError}</div>
            <button
              onClick={() => loadWalletData(txPage, cashPage, ledgerPage)}
              className="btn btn-outline"
              style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
            >
              <HiOutlineRefresh /> Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {tableLoading && !tableError && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HiOutlineRefresh className="animate-spin" style={{ fontSize: 32, color: '#3B82F6', margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Loading wallet data...</div>
          </div>
        )}

        {/* Empty State */}
        {!tableLoading &&
          !tableError &&
          ((activeTab === 'cash_flow' && cashData.length === 0) ||
            (activeTab === 'all_tx' && txData.length === 0) ||
            (activeTab === 'ledger' && ledgerData.length === 0)) && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <HiOutlineCash style={{ fontSize: 44, color: '#CBD5E1', marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                {activeTab === 'cash_flow'
                  ? 'No platform cash flow recorded yet.'
                  : activeTab === 'all_tx'
                  ? 'No transactions found.'
                  : 'No platform commission transactions found.'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
                {activeTab === 'cash_flow'
                  ? 'When merchants add funds or users withdraw to banks, platform cash movement will appear here.'
                  : activeTab === 'all_tx'
                  ? 'Transactions performed across the platform will appear here.'
                  : 'Incoming 2% platform fees will appear here when cashback is redeemed.'}
              </div>
            </div>
          )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* TABLE 1: PLATFORM CASH FLOW (RECEIVED, SENT & ADDED FUNDS)   */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {!tableLoading && !tableError && activeTab === 'cash_flow' && filteredCashData.length > 0 && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Movement</th>
                  <th>Party / Initiator</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Description</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCashData.map((item) => {
                  const m = (item.movement || '').toUpperCase();
                  const isAddedFund = m === 'ADDED_FUND';
                  const isReceived = m === 'RECEIVED';
                  const isSent = m === 'SENT' || m === 'DEDUCTED' || (item.direction || '').toUpperCase() === 'DEBIT';

                  const dateStr = item.created_at
                    ? new Date(item.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—';
                  const formattedAmount = Number(item.amount || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  return (
                    <tr key={item.id}>
                      {/* Ref ID */}
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>#{item.id}</span>
                          <span
                            style={{
                              fontSize: 11,
                              fontFamily: 'monospace',
                              color: 'var(--text-secondary)',
                              marginTop: 2,
                              maxWidth: 130,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={item.transaction_group_id}
                          >
                            {item.transaction_group_id}
                          </span>
                        </div>
                      </td>

                      {/* Movement */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 6,
                            backgroundColor: isAddedFund ? '#EDE9FE' : isReceived ? '#DCFCE7' : '#FEE2E2',
                            color: isAddedFund ? '#6D28D9' : isReceived ? '#15803D' : '#B91C1C',
                            border: `1px solid ${isAddedFund ? '#DDD6FE' : isReceived ? '#BBF7D0' : '#FECACA'}`,
                            fontSize: 11.5,
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isAddedFund ? (
                            <HiOutlinePlus style={{ fontSize: 13, strokeWidth: 3 }} />
                          ) : isReceived ? (
                            <HiOutlineArrowDown />
                          ) : (
                            <HiOutlineArrowUp />
                          )}
                          <span>{isAddedFund ? 'ADDED FUND' : isReceived ? 'RECEIVED' : 'SENT'}</span>
                        </span>
                      </td>

                      {/* Party / Initiator */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                            {item.party_name || item.user_name || item.party_email || (isAddedFund ? 'Platform Admin' : 'System')}
                          </span>
                          {item.party_role && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '1px 6px',
                                borderRadius: 4,
                                backgroundColor:
                                  item.party_role.toUpperCase() === 'MERCHANT'
                                    ? '#EFF6FF'
                                    : item.party_role.toUpperCase() === 'ADMIN'
                                    ? '#EDE9FE'
                                    : '#F1F5F9',
                                color:
                                  item.party_role.toUpperCase() === 'MERCHANT'
                                    ? '#2563EB'
                                    : item.party_role.toUpperCase() === 'ADMIN'
                                    ? '#6D28D9'
                                    : '#475569',
                              }}
                            >
                              {item.party_role}
                            </span>
                          )}
                        </div>
                        {(item.party_phone || item.party_email || item.user_email) && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {item.party_phone || item.party_email || item.user_email}
                          </div>
                        )}
                      </td>

                      {/* Type */}
                      <td>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontFamily: 'monospace',
                            padding: '3px 7px',
                            background: '#F1F5F9',
                            color: '#334155',
                            borderRadius: 4,
                            fontWeight: 600,
                          }}
                        >
                          {item.transaction_type || item.type || (isAddedFund ? 'ADMIN_CAPITAL' : 'CASH_FLOW')}
                        </span>
                      </td>

                      {/* Amount */}
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          fontSize: 14.5,
                          color: isAddedFund ? '#6D28D9' : isReceived ? '#15803D' : '#B91C1C',
                        }}
                      >
                        {isAddedFund || isReceived ? '+' : '-'}₹{formattedAmount}
                      </td>

                      {/* Description */}
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 220 }}>
                        {item.description || '—'}
                      </td>

                      {/* Date */}
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenTxDetail(item.id)}
                          className="btn btn-outline"
                          style={{
                            padding: '4px 10px',
                            fontSize: 12,
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <HiOutlineEye style={{ fontSize: 14 }} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* TABLE 2: ALL WALLET TRANSACTIONS                              */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {!tableLoading && !tableError && activeTab === 'all_tx' && txData.length > 0 && (
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
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {txData.map((t) => {
                  const badge = getTxTypeBadge(t.transaction_type);
                  const isExpanded = expandedTxId === t.id;
                  const dateStr = t.created_at
                    ? new Date(t.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—';
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
                                maxWidth: 130,
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
                            {t.user_name || t.initiated_by_name || (t.user_email ? t.user_email.split('@')[0] : 'System')}
                          </div>
                          {(t.user_email || t.initiated_by_email) && (
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {t.user_email || t.initiated_by_email}
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
                              {t.ledger_entries.map((entry, idx) => {
                                const isCredit = (entry.direction || '').toUpperCase() === 'CREDIT';
                                const roleLabel =
                                  entry.wallet_type === 'MERCHANT'
                                    ? (entry.user_name ? `MERCHANT: ${entry.user_name}` : 'MERCHANT')
                                    : entry.wallet_type === 'COMPANY'
                                    ? 'COMPANY'
                                    : (entry.user_name ? `USER: ${entry.user_name}` : 'USER');
                                return (
                                  <span
                                    key={idx}
                                    style={{
                                      fontSize: 11,
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                      fontWeight: 600,
                                      backgroundColor: isCredit ? '#DCFCE7' : '#FEE2E2',
                                      color: isCredit ? '#15803D' : '#B91C1C',
                                    }}
                                  >
                                    {isCredit ? '+' : '-'}₹{Number(entry.amount).toFixed(2)} ({roleLabel})
                                  </span>
                                );
                              })}
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

                        {/* Action Buttons: Details Modal & Collapse Lines */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleOpenTxDetail(t.id)}
                              className="btn btn-outline"
                              style={{
                                padding: '4px 8px',
                                fontSize: 11.5,
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <HiOutlineEye />
                              <span>Details</span>
                            </button>
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
                                gap: 2,
                              }}
                              title="Toggle inline ledger rows"
                            >
                              {isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                            </button>
                          </div>
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
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                  gap: 10,
                                }}
                              >
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
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          marginBottom: 4,
                                        }}
                                      >
                                        <span style={{ fontWeight: 700, color: isCred ? '#15803D' : '#B91C1C' }}>
                                          {entry.direction} (₹{Number(entry.amount).toFixed(2)})
                                        </span>
                                        <span
                                          style={{
                                            fontSize: 10,
                                            background: '#F1F5F9',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontWeight: 700,
                                          }}
                                        >
                                          {entry.wallet_type} WALLET
                                        </span>
                                      </div>
                                      <div style={{ color: '#475569' }}>
                                        <strong>Account:</strong>{' '}
                                        {entry.user_name || entry.user_email || `Wallet #${entry.wallet_id}`}
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
                              <div style={{ color: '#94A3B8', fontSize: 12 }}>
                                No ledger lines recorded for this transaction.
                              </div>
                            )}

                            {/* Bank details if withdrawal */}
                            {(t.bank_account_holder_name || t.bank_account_last4) && (
                              <div
                                style={{
                                  marginTop: 10,
                                  padding: '8px 12px',
                                  background: '#EFF6FF',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  color: '#1E40AF',
                                }}
                              >
                                <strong>Bank Details:</strong> {t.bank_account_holder_name || '—'} | Account Last 4:{' '}
                                {t.bank_account_last4 || '—'} | IFSC: {t.bank_ifsc || '—'}
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

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* TABLE 3: PLATFORM COMMISSION LEDGER                           */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {!tableLoading && !tableError && activeTab === 'ledger' && ledgerData.length > 0 && (
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
                {ledgerData.map((t) => {
                  const isCredit = (t.direction || '').toUpperCase() === 'CREDIT';
                  const formattedAmount = Number(t.amount || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  const formattedBalanceAfter = Number(t.balance_after || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  const dateStr = t.date
                    ? new Date(t.date).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—';

                  const customerDisplay = t.customer_name || t.customer_details;
                  const merchantDisplay = t.merchant_name || t.merchant_details;

                  return (
                    <tr key={t.id}>
                      {/* Customer Details */}
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {customerDisplay ? (
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: 'var(--text)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
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
                            <div
                              style={{
                                fontWeight: 700,
                                color: 'var(--text)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
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



        {/* ── Dynamic Pagination Controls ── */}
        {!tableLoading && !tableError && (
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
            {activeTab === 'cash_flow' && cashTotal > 0 && (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing {Math.min((cashPage - 1) * cashPageSize + 1, cashTotal)} to{' '}
                  {Math.min(cashPage * cashPageSize, cashTotal)} of {cashTotal} cash entries
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => loadWalletData(txPage, cashPage - 1, ledgerPage)}
                    disabled={cashPage <= 1 || tableLoading}
                    className="btn btn-outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      fontSize: 13,
                      opacity: cashPage <= 1 ? 0.5 : 1,
                      cursor: cashPage <= 1 ? 'not-allowed' : 'pointer',
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
                    Cash Page {cashPage} of {cashTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => loadWalletData(txPage, cashPage + 1, ledgerPage)}
                    disabled={cashPage >= cashTotalPages || tableLoading}
                    className="btn btn-outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      fontSize: 13,
                      opacity: cashPage >= cashTotalPages ? 0.5 : 1,
                      cursor: cashPage >= cashTotalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span>Next</span>
                    <HiOutlineChevronRight />
                  </button>
                </div>
              </>
            )}

            {activeTab === 'all_tx' && txTotal > 0 && (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing {Math.min((txPage - 1) * txPageSize + 1, txTotal)} to{' '}
                  {Math.min(txPage * txPageSize, txTotal)} of {txTotal} transactions
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => loadWalletData(txPage - 1, cashPage, ledgerPage)}
                    disabled={txPage <= 1 || tableLoading}
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
                    onClick={() => loadWalletData(txPage + 1, cashPage, ledgerPage)}
                    disabled={txPage >= txTotalPages || tableLoading}
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
              </>
            )}

            {activeTab === 'ledger' && ledgerTotal > 0 && (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing {Math.min((ledgerPage - 1) * ledgerPageSize + 1, ledgerTotal)} to{' '}
                  {Math.min(ledgerPage * ledgerPageSize, ledgerTotal)} of {ledgerTotal} ledger entries
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => loadWalletData(txPage, cashPage, ledgerPage - 1)}
                    disabled={ledgerPage <= 1 || tableLoading}
                    className="btn btn-outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      fontSize: 13,
                      opacity: ledgerPage <= 1 ? 0.5 : 1,
                      cursor: ledgerPage <= 1 ? 'not-allowed' : 'pointer',
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
                    Ledger Page {ledgerPage} of {ledgerTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => loadWalletData(txPage, cashPage, ledgerPage + 1)}
                    disabled={ledgerPage >= ledgerTotalPages || tableLoading}
                    className="btn btn-outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      fontSize: 13,
                      opacity: ledgerPage >= ledgerTotalPages ? 0.5 : 1,
                      cursor: ledgerPage >= ledgerTotalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span>Next</span>
                    <HiOutlineChevronRight />
                  </button>
                </div>
              </>
            )}


          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 3. TRANSACTION DETAILS MODAL                                  */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={detailTx ? `Transaction #${detailTx.id} Details` : 'Transaction Details'}
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={() => setDetailModalOpen(false)}
              className="btn btn-outline"
            >
              Close
            </button>
          </div>
        }
      >
        {detailLoading && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HiOutlineRefresh className="animate-spin" style={{ fontSize: 28, color: '#3B82F6', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>Loading transaction details...</div>
          </div>
        )}

        {detailError && (
          <div
            style={{
              padding: '12px 16px',
              background: '#FEE2E2',
              borderLeft: '4px solid #EF4444',
              borderRadius: 6,
              color: '#B91C1C',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {detailError}
          </div>
        )}

        {!detailLoading && !detailError && detailTx && (
          <div>
            {/* Top Overview Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                color: '#FFFFFF',
                borderRadius: 12,
                padding: '18px 22px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60A5FA',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontWeight: 700,
                    }}
                  >
                    {detailTx.transaction_type}
                  </span>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#94A3B8', marginTop: 6 }}>
                    Group ID: {detailTx.transaction_group_id}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11.5, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Transaction Total
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF' }}>
                    <span style={{ fontSize: 18, color: '#3B82F6', fontWeight: 700 }}>₹</span>
                    {Number(detailTx.amount || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Properties Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  Initiator / User
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                  {detailTx.user_name || detailTx.user_email || 'System'}
                </div>
                {detailTx.user_role && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: '#E2E8F0',
                      color: '#334155',
                      padding: '1px 5px',
                      borderRadius: 4,
                      display: 'inline-block',
                      marginTop: 4,
                    }}
                  >
                    {detailTx.user_role}
                  </span>
                )}
                {detailTx.user_email && (
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{detailTx.user_email}</div>
                )}
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  Status & Date
                </div>
                <div style={{ marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: (detailTx.status || '').toUpperCase() === 'COMPLETED' ? '#DCFCE7' : '#FEF3C7',
                      color: (detailTx.status || '').toUpperCase() === 'COMPLETED' ? '#15803D' : '#B45309',
                    }}
                  >
                    {detailTx.status || 'COMPLETED'}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 6 }}>
                  {detailTx.created_at ? new Date(detailTx.created_at).toLocaleString('en-IN') : '—'}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  Payment Gateway
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                  {detailTx.provider || 'INTERNAL_WALLET'}
                </div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748B', marginTop: 2 }}>
                  Ref: {detailTx.provider_id || '—'}
                </div>
              </div>

              {detailTx.fee_amount > 0 && (
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                    Platform Fee
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                    ₹{Number(detailTx.fee_amount).toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* Bank Details if Withdrawal */}
            {(detailTx.bank_account_holder_name || detailTx.bank_account_last4) && (
              <div
                style={{
                  marginBottom: 20,
                  padding: '12px 16px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF', marginBottom: 4 }}>
                  Bank Withdrawal Details
                </div>
                <div style={{ fontSize: 12.5, color: '#1E3A8A' }}>
                  <strong>Account Holder:</strong> {detailTx.bank_account_holder_name || '—'} &nbsp;|&nbsp;
                  <strong> Account Last 4:</strong> {detailTx.bank_account_last4 || '—'} &nbsp;|&nbsp;
                  <strong> IFSC:</strong> {detailTx.bank_ifsc || '—'}
                </div>
              </div>
            )}

            {/* Failure Alert if Failed */}
            {detailTx.failure_reason && (
              <div
                style={{
                  marginBottom: 20,
                  padding: '12px 16px',
                  background: '#FEE2E2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  color: '#991B1B',
                  fontSize: 12.5,
                }}
              >
                <strong>Failure Reason:</strong> {detailTx.failure_reason}
              </div>
            )}

            {/* Description */}
            {detailTx.description && (
              <div style={{ marginBottom: 20, fontSize: 13, color: '#475569' }}>
                <strong>Description:</strong> {detailTx.description}
              </div>
            )}

            {/* Ledger Breakdown Lines */}
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Ledger Entries</span>
                <span
                  style={{
                    fontSize: 11,
                    background: '#E2E8F0',
                    color: '#334155',
                    padding: '1px 6px',
                    borderRadius: 10,
                  }}
                >
                  {detailTx.ledger_entries?.length || 0}
                </span>
              </div>

              {Array.isArray(detailTx.ledger_entries) && detailTx.ledger_entries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detailTx.ledger_entries.map((entry) => {
                    const isCred = (entry.direction || '').toUpperCase() === 'CREDIT';
                    return (
                      <div
                        key={entry.id}
                        style={{
                          background: '#FFFFFF',
                          border: `1px solid ${isCred ? '#BBF7D0' : '#FECACA'}`,
                          borderRadius: 8,
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: 12,
                                padding: '2px 8px',
                                borderRadius: 4,
                                backgroundColor: isCred ? '#DCFCE7' : '#FEE2E2',
                                color: isCred ? '#15803D' : '#B91C1C',
                              }}
                            >
                              {entry.direction}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                              {entry.wallet_type} WALLET
                            </span>
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B', marginTop: 4 }}>
                            {entry.user_name || entry.user_email || `Wallet #${entry.wallet_id}`}
                          </div>
                          {entry.note && (
                            <div style={{ fontSize: 11.5, color: '#64748B', fontStyle: 'italic', marginTop: 2 }}>
                              "{entry.note}"
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: isCred ? '#15803D' : '#B91C1C',
                            }}
                          >
                            {isCred ? '+' : '-'}₹{Number(entry.amount || 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                            Balance After: <strong>₹{Number(entry.balance_after || 0).toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: '#94A3B8', fontSize: 12.5, fontStyle: 'italic', padding: '10px 0' }}>
                  No ledger lines recorded for this transaction.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 4. SEND CASH TO CUSTOMER OR MERCHANT MODAL                    */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="💸 Send Cash to Customer or Merchant"
        size="lg"
      >
        <form onSubmit={handleSendFundsSubmit}>
          {/* Step 1: Select Recipient Type */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
              1. Choose Recipient Type
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setSendRecipientType('user');
                  setSelectedRecipient(null);
                  setSendSearchQuery('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: `2px solid ${sendRecipientType === 'user' ? '#2563EB' : '#E2E8F0'}`,
                  background: sendRecipientType === 'user' ? '#EFF6FF' : '#FFFFFF',
                  color: sendRecipientType === 'user' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <HiOutlineUser style={{ fontSize: 18 }} />
                <span>Customer / User</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSendRecipientType('merchant');
                  setSelectedRecipient(null);
                  setSendSearchQuery('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: `2px solid ${sendRecipientType === 'merchant' ? '#2563EB' : '#E2E8F0'}`,
                  background: sendRecipientType === 'merchant' ? '#EFF6FF' : '#FFFFFF',
                  color: sendRecipientType === 'merchant' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <HiOutlineShoppingBag style={{ fontSize: 18 }} />
                <span>Merchant / Business</span>
              </button>
            </div>
          </div>

          {/* Step 2: Search & Select Recipient */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
              2. Search &amp; Select {sendRecipientType === 'merchant' ? 'Merchant' : 'Customer'}
            </label>

            {selectedRecipient ? (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: '#16A34A',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    {(selectedRecipient.business_name || selectedRecipient.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#14532D', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{selectedRecipient.business_name || selectedRecipient.name}</span>
                      {(selectedRecipient.login_id || selectedRecipient.user_code) && (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }}>
                          ID: {selectedRecipient.login_id || selectedRecipient.user_code}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>
                      {selectedRecipient.phone || selectedRecipient.phone_number || ''} {selectedRecipient.email ? `• ${selectedRecipient.email}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecipient(null)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Change ✕
                </button>
              </div>
            ) : (
              <div>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <HiOutlineSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: 16 }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder={`Search by Name, Phone, Email, or Login ID (e.g. ${sendRecipientType === 'merchant' ? 'RAJ48291' : 'ANJ39102'})...`}
                    value={sendSearchQuery}
                    onChange={(e) => setSendSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                {/* Dropdown / Suggestion List */}
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: 'auto',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    background: '#FFFFFF',
                  }}
                >
                  {loadingRecipients ? (
                    <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
                      Loading directory...
                    </div>
                  ) : filteredRecipients.length === 0 ? (
                    <div style={{ padding: 14, textAlign: 'center', fontSize: 12.5, color: '#94A3B8' }}>
                      No {sendRecipientType === 'merchant' ? 'merchants' : 'customers'} matching "{sendSearchQuery}"
                    </div>
                  ) : (
                    filteredRecipients.map((item) => {
                      const name = item.business_name || item.name || 'Unnamed';
                      const phone = item.phone || item.phone_number || '';
                      const loginId = item.login_id || item.user_code;
                      return (
                        <div
                          key={item.id || item.user_id}
                          onClick={() => {
                            setSelectedRecipient(item);
                            setSendSearchQuery('');
                          }}
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #F1F5F9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.12s',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseOut={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>{name}</span>
                            {loginId && (
                              <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>
                                {loginId}
                              </span>
                            )}
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                              {phone} {item.email ? `• ${item.email}` : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>
                            Select →
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Choose Source Wallet to Deduct From */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
              3. Deduct From Which Admin Wallet?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {/* Option A: Added Fund */}
              <div
                onClick={() => setSelectedSourceWallet('added_fund')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `2px solid ${selectedSourceWallet === 'added_fund' ? '#4F46E5' : '#E2E8F0'}`,
                  background: selectedSourceWallet === 'added_fund' ? '#EEF2FF' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>
                  🟣 Added Fund
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#1E1B4B', marginTop: 4 }}>
                  ₹{addedFundBalance.toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: '#6366F1', marginTop: 2 }}>Admin Capital</div>
              </div>

              {/* Option B: Commission Fund */}
              <div
                onClick={() => setSelectedSourceWallet('commission')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `2px solid ${selectedSourceWallet === 'commission' ? '#0284C7' : '#E2E8F0'}`,
                  background: selectedSourceWallet === 'commission' ? '#F0F9FF' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0284C7', textTransform: 'uppercase' }}>
                  🔵 Commission
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0C4A6E', marginTop: 4 }}>
                  ₹{companyBalance}
                </div>
                <div style={{ fontSize: 10, color: '#0284C7', marginTop: 2 }}>Platform Earnings</div>
              </div>

              {/* Option C: Received Fund */}
              <div
                onClick={() => setSelectedSourceWallet('received_fund')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `2px solid ${selectedSourceWallet === 'received_fund' ? '#059669' : '#E2E8F0'}`,
                  background: selectedSourceWallet === 'received_fund' ? '#ECFDF5' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                  🟢 Received Fund
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#064E3B', marginTop: 4 }}>
                  ₹{totalReceived}
                </div>
                <div style={{ fontSize: 10, color: '#059669', marginTop: 2 }}>User Inflows</div>
              </div>
            </div>
          </div>

          {/* Step 4: Amount & Quick Chips */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              4. Amount to Send (₹)
            </label>
            <input
              type="number"
              step="any"
              min="1"
              required
              className="form-input"
              placeholder="e.g. 500"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              style={{ fontSize: 16, fontWeight: 800 }}
            />
            {/* Quick Chips */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSendAmount(String(amt))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Step 5: Optional Note */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              5. Purpose / Note (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Festival bonus, wallet credit, platform incentive"
              value={sendNote}
              onChange={(e) => setSendNote(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {sendModalError && (
            <div style={{ padding: '10px 14px', background: '#FEE2E2', borderLeft: '4px solid #EF4444', color: '#B91C1C', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
              {sendModalError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowSendModal(false)}
              disabled={sendingFunds}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendingFunds || !selectedRecipient || !sendAmount}
              style={{
                padding: '10px 22px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#1E1B4B',
                fontWeight: 800,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)',
              }}
            >
              <HiOutlinePaperAirplane style={{ transform: 'rotate(45deg)' }} />
              <span>{sendingFunds ? 'Sending...' : `Send ₹${sendAmount || '0'} Now`}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 5. ADD CAPITAL TO ADDED FUND MODAL                            */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showAddFundModal}
        onClose={() => setShowAddFundModal(false)}
        title="🟣 Add Capital to Admin Added Fund"
        size="md"
      >
        <form onSubmit={handleAddFundSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Amount to Add (₹)
            </label>
            <input
              type="number"
              step="any"
              min="1"
              required
              className="form-input"
              placeholder="e.g. 10000"
              value={addFundAmount}
              onChange={(e) => setAddFundAmount(e.target.value)}
              style={{ fontSize: 16, fontWeight: 800 }}
              autoFocus
            />
            {/* Quick Chips */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[1000, 5000, 10000, 25000, 50000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAddFundAmount(String(amt))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#4F46E5',
                    cursor: 'pointer',
                  }}
                >
                  +₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Fund Source / Method
            </label>
            <select
              className="form-input"
              value={addFundSource}
              onChange={(e) => setAddFundSource(e.target.value)}
            >
              <option value="Bank Deposit">Bank Deposit / RTGS</option>
              <option value="Owner Equity">Owner Capital Injection</option>
              <option value="Cash Float">Cash Float</option>
              <option value="UPI / Online">UPI / Corporate Account</option>
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Reference / Note (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Ref #TXN99281, Q4 platform operational float"
              value={addFundNote}
              onChange={(e) => setAddFundNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowAddFundModal(false)}
              disabled={isAddingFund}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingFund || !addFundAmount}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: '#4F46E5',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
              }}
            >
              <HiOutlinePlus style={{ strokeWidth: 3 }} />
              <span>{isAddingFund ? 'Adding...' : `Add ₹${Number(addFundAmount || 0).toLocaleString('en-IN')} to Added Fund`}</span>
            </button>
          </div>
        </form>
      </Modal>

    </motion.div>
  );
}
