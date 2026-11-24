import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // ── Tabs: 'added_fund' | 'commission' | 'received' | 'cash_send' ──
  const [activeTab, setActiveTab] = useState('added_fund');
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState('');

  // ── Table 3: Withdrawals State (Customer & Merchant Withdrawal Requests) ──
  const [withdrawalsData, setWithdrawalsData] = useState([]);
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0);
  const [withdrawalsPendingCount, setWithdrawalsPendingCount] = useState(0);
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [withdrawalsPageSize] = useState(15);
  const [withdrawalsTotalPages, setWithdrawalsTotalPages] = useState(1);
  const [withdrawalsStatusFilter, setWithdrawalsStatusFilter] = useState('ALL');
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

  // ── Table: Platform Commission Ledger State ──
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize] = useState(20);
  const [ledgerTotalPages, setLedgerTotalPages] = useState(1);
  const [selectedCommissionDetail, setSelectedCommissionDetail] = useState(null);
  const [selectedCashSendDetail, setSelectedCashSendDetail] = useState(null);

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

  // ── Sync activeTab with URL ──
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'commission' || tabParam === 'ledger') {
        setActiveTab('commission');
      } else if (tabParam === 'received' || tabParam === 'withdrawals') {
        setActiveTab('received');
      } else if (tabParam === 'cash_send' || tabParam === 'send_cash' || tabParam === 'send') {
        setActiveTab('cash_send');
      } else {
        setActiveTab('added_fund');
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
      // Also fetch pending withdrawals count for notification badge and total
      fetchAdminWithdrawals({ status: 'ALL', page: 1, pageSize: 100 })
        .then((wRes) => {
          const list = Array.isArray(wRes?.data) ? wRes.data : Array.isArray(wRes?.withdrawals) ? wRes.withdrawals : [];
          const pCount = list.filter((w) => String(w.status || '').toUpperCase() === 'PENDING').length;
          updatePendingWithdrawalsCount(pCount);
          if (list.length > 0) {
            const sum = list.reduce((acc, curr) => acc + (Number(curr.amount || curr.requested_amount) || 0), 0);
            if (sum > 0) {
              setTotalReceived(sum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            }
          }
        })
        .catch(() => {});
    } catch (err) {
      console.error('Wallet summary load error:', err);
      setSummaryError(err.message || 'Failed to load wallet summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [updatePendingWithdrawalsCount]);

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
        if (activeTab === 'received') {
          const res = await fetchAdminWithdrawals({
            status: withdrawalsStatusFilter === 'ALL' ? undefined : withdrawalsStatusFilter,
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
          const pCount = list.filter((w) => String(w.status || '').toUpperCase() === 'PENDING').length;
          updatePendingWithdrawalsCount(pCount);
        } else if (activeTab === 'commission') {
          const res = await fetchPlatformLedgerTransactions(targetLedgerPage, ledgerPageSize);
          const list = Array.isArray(res?.data)
            ? res.data
            : (Array.isArray(res?.transactions) ? res.transactions : []);
          setLedgerData(list);
          const totalCount = res?.meta?.total_items ?? res?.total ?? list.length;
          setLedgerTotal(totalCount);
          setLedgerPage(targetLedgerPage);
          setLedgerTotalPages(Math.max(1, Math.ceil(totalCount / ledgerPageSize)));
        } else {
          // activeTab === 'added_fund'
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

          if (res?.total_received !== undefined && !totalReceived) {
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
      updatePendingWithdrawalsCount,
      totalReceived,
    ]
  );

  // ── Approve and Reject Withdrawal Handlers ──
  const handleApproveWithdrawal = async (txnGroupId, amount) => {
    if (!txnGroupId) return;
    setSendingTxGroupId(txnGroupId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await sendAdminWithdrawal(txnGroupId);
      setActionSuccess(res?.message || `✓ Withdrawal of ₹${Number(amount || 0).toFixed(2)} approved successfully!`);
      loadWalletData(txPage, cashPage, ledgerPage, withdrawalsPage);
    } catch (err) {
      console.error('Approve withdrawal error:', err);
      setActionError(err.message || 'Failed to approve withdrawal.');
    } finally {
      setSendingTxGroupId(null);
    }
  };

  const handleRejectWithdrawal = async (txnGroupId, amount) => {
    if (!txnGroupId) return;
    const reason = window.prompt(
      `Please enter reason for rejecting this ₹${Number(amount || 0).toFixed(2)} withdrawal request:`,
      'Bank details mismatch'
    );
    if (reason === null) return;
    setRejectingTxGroupId(txnGroupId);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await rejectAdminWithdrawal(txnGroupId, reason.trim() || 'Rejected by admin');
      setActionSuccess(res?.message || `✓ Withdrawal request rejected and ₹${Number(amount || 0).toFixed(2)} refunded to wallet.`);
      loadWalletData(txPage, cashPage, ledgerPage, withdrawalsPage);
    } catch (err) {
      console.error('Reject withdrawal error:', err);
      setActionError(err.message || 'Failed to reject withdrawal request.');
    } finally {
      setRejectingTxGroupId(null);
    }
  };

  // ── Initial and reactive load ──
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadWalletData(1, 1, 1, 1);
  }, [activeTab, txTypeFilter, withdrawalsStatusFilter]);

  // ── Refresh all ──
  const handleRefreshAll = useCallback(() => {
    setActionSuccess('');
    setActionError('');
    loadSummary();
    loadWalletData(txPage, cashPage, ledgerPage, withdrawalsPage);
  }, [loadSummary, loadWalletData, txPage, cashPage, ledgerPage, withdrawalsPage]);

  // ── Open Transaction Detail Modal ──
  const handleOpenTxDetail = async (txId) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError('');
    setDetailTx(null);
    try {
      const detail = await fetchAdminTransactionDetail(txId);
      setDetailTx(detail);
    } catch (err) {
      console.error('Failed to load transaction detail:', err);
      setDetailError(err.message || 'Failed to load transaction details');
    } finally {
      setDetailLoading(false);
    }
  };

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
    const rawList = sendRecipientType === 'merchant' ? allMerchants : allCustomers;
    const list = Array.isArray(rawList) ? rawList : [];
    if (!sendSearchQuery || !sendSearchQuery.trim()) {
      return list.slice(0, 8);
    }
    const q = sendSearchQuery.toLowerCase().trim();
    return list
      .filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const name = String(item.business_name || item.name || '').toLowerCase();
        const phone = String(item.phone || item.phone_number || '').toLowerCase();
        const email = String(item.email || '').toLowerCase();
        const loginId = String(item.login_id || item.user_code || '').toLowerCase();
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

  // Added Fund Entries (Admin Capital Added + Cash Sent from Added Fund)
  const addedFundEntries = React.useMemo(() => {
    let customEntries = [];
    try {
      customEntries = JSON.parse(localStorage.getItem('admin_custom_cash_entries') || '[]');
    } catch (_) {}

    const allEntries = [...customEntries, ...(Array.isArray(cashData) ? cashData : [])];
    const seen = new Set();
    const result = [];
    for (const item of allEntries) {
      if (!item || typeof item !== 'object') continue;
      const key = item.id || item.transaction_group_id || JSON.stringify(item);
      if (seen.has(key)) continue;
      seen.add(key);

      const m = String(item.movement || '').toUpperCase();
      const t = String(item.type || item.transaction_type || '').toUpperCase();
      const desc = String(item.description || item.note || '').toUpperCase();

      if (desc.includes('SUBSCRIPTION') || desc.includes('MEMBERSHIP')) continue;

      if (
        m === 'ADDED_FUND' ||
        t === 'ADMIN_CAPITAL' ||
        desc.includes('ADDED FUND') ||
        (m === 'SENT' && desc.includes('ADDED FUND')) ||
        (m === 'SENT' && desc.includes('ADMIN ADDED'))
      ) {
        result.push(item);
      }
    }
    // If no explicit added fund tag found, fallback to any ADDED_FUND or non-sub cash entries
    if (result.length === 0 && Array.isArray(cashData)) {
      return cashData.filter((item) => {
        const desc = String(item?.description || item?.note || '').toUpperCase();
        return !desc.includes('SUBSCRIPTION') && !desc.includes('MEMBERSHIP');
      });
    }
    return result;
  }, [cashData]);

  // Cash Send Entries (Admin sent funds to customers and merchants)
  const cashSendEntries = React.useMemo(() => {
    let customEntries = [];
    try {
      customEntries = JSON.parse(localStorage.getItem('admin_custom_cash_entries') || '[]');
    } catch (_) {}

    const allSource = [
      ...customEntries,
      ...(Array.isArray(cashData) ? cashData : []),
      ...(Array.isArray(txData) ? txData : []),
    ];

    const seen = new Set();
    const result = [];

    for (const item of allSource) {
      if (!item || typeof item !== 'object') continue;
      const key = item.id || item.transaction_group_id || JSON.stringify(item);
      if (seen.has(key)) continue;
      seen.add(key);

      const m = String(item.movement || '').toUpperCase();
      const t = String(item.type || item.transaction_type || '').toUpperCase();
      const desc = String(item.description || item.note || '').toUpperCase();

      if (desc.includes('SUBSCRIPTION') || desc.includes('MEMBERSHIP') || desc.includes('SELLER PLAN')) continue;

      const isSent =
        m === 'SENT' ||
        t === 'ADMIN_SEND_FUNDS' ||
        t === 'ADMIN_CREDIT' ||
        desc.includes('ADMIN CASH TRANSFER') ||
        desc.includes('CASH SENT') ||
        desc.includes('ADMIN FUNDS TRANSFER') ||
        desc.includes('SENT FROM ADMIN') ||
        (desc.includes('ADDED FUND') && m === 'SENT');

      if (isSent) {
        result.push(item);
      }
    }

    return result;
  }, [cashData, txData]);

  // Total Cash Sent by Admin across all wallets
  const totalCashSent = React.useMemo(() => {
    const sum = cashSendEntries.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return sum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [cashSendEntries]);

  // Total Received for Withdrawal Payouts
  const totalReceivedForWithdrawals = React.useMemo(() => {
    if (Array.isArray(withdrawalsData) && withdrawalsData.length > 0) {
      const sum = withdrawalsData.reduce(
        (acc, curr) => acc + (Number(curr.amount || curr.requested_amount) || 0),
        0
      );
      if (sum > 0) {
        return sum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    return totalReceived || '0.00';
  }, [withdrawalsData, totalReceived]);

  // Filtered Cash Data excluding subscriptions and matching movement filter
  const filteredCashData = React.useMemo(() => {
    if (!Array.isArray(cashData)) return [];
    return cashData.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      // Exclude subscriptions
      const str = `${item.transaction_type || ''} ${item.type || ''} ${item.description || ''} ${item.note || ''}`.toUpperCase();
      if (str.includes('SUBSCRIPTION') || str.includes('MEMBERSHIP')) return false;

      const m = String(item.movement || '').toUpperCase();
      if (cashMovementFilter === 'RECEIVED') {
        return m === 'RECEIVED';
      }
      if (cashMovementFilter === 'SENT') {
        return m === 'SENT' || m === 'DEDUCTED' || String(item.direction || '').toUpperCase() === 'DEBIT';
      }
      if (cashMovementFilter === 'ADDED_FUND') {
        return m === 'ADDED_FUND';
      }
      return true;
    });
  }, [cashData, cashMovementFilter]);

  // Filter out any topup or subscription rows from platform commission ledger
  const commissionRows = useMemo(() => {
    return (ledgerData || []).filter((t) => {
      if (!t) return false;
      const type = String(t.transaction_type || '').toUpperCase();
      const desc = String(t.note || t.description || '').toUpperCase();
      // Exclude subscriptions and wallet topups
      if (type === 'WALLET_TOPUP' || desc.includes('RAZORPAY') || desc.includes('TOP-UP') || desc.includes('TOPUP')) return false;
      if (desc.includes('SUBSCRIPTION') || desc.includes('MEMBERSHIP') || desc.includes('SELLER PLAN')) return false;
      return true;
    });
  }, [ledgerData]);

  // Extract Summary Values - Total percentage cash commission earned by platform
  const companyCommissionTotal = useMemo(() => {
    if (summaryData?.total_commission !== undefined && Number(summaryData.total_commission) > 0) {
      return Number(summaryData.total_commission).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    if (commissionRows && commissionRows.length > 0) {
      const sum = commissionRows.reduce(
        (acc, curr) => acc + (Number(curr?.company_fee || curr?.amount) || 0),
        0
      );
      return sum.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return '0.00';
  }, [summaryData, commissionRows]);

  const companyBalance = companyCommissionTotal;

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
          onClick={() => setActiveTab('added_fund')}
          style={{
            background: 'linear-gradient(135deg, #3730A3 0%, #4F46E5 50%, #6366F1 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow:
              activeTab === 'added_fund'
                ? '0 0 0 3px #FFFFFF, 0 10px 28px rgba(79, 70, 229, 0.5)'
                : '0 8px 24px rgba(79, 70, 229, 0.25)',
            border: activeTab === 'added_fund' ? '2px solid #C7D2FE' : '1px solid rgba(255, 255, 255, 0.18)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transform: activeTab === 'added_fund' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease',
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
                {activeTab === 'added_fund' && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: '#FFFFFF',
                      color: '#4F46E5',
                      padding: '1px 7px',
                      borderRadius: 10,
                    }}
                  >
                    Viewing History ↓
                  </span>
                )}
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
                {Number(addedFundBalance || 0).toLocaleString('en-IN', {
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
              onClick={(e) => {
                e.stopPropagation();
                setShowAddFundModal(true);
              }}
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
          onClick={() => setActiveTab('commission')}
          style={{
            background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 50%, #38BDF8 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow:
              activeTab === 'commission'
                ? '0 0 0 3px #FFFFFF, 0 10px 28px rgba(14, 165, 233, 0.5)'
                : '0 8px 24px rgba(14, 165, 233, 0.25)',
            border: activeTab === 'commission' ? '2px solid #BAE6FD' : '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transform: activeTab === 'commission' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease',
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
                {activeTab === 'commission' && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: '#FFFFFF',
                      color: '#0284C7',
                      padding: '1px 7px',
                      borderRadius: 10,
                    }}
                  >
                    Viewing History ↓
                  </span>
                )}
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
          onClick={() => setActiveTab('received')}
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow:
              activeTab === 'received'
                ? '0 0 0 3px #FFFFFF, 0 10px 28px rgba(4, 120, 87, 0.5)'
                : '0 8px 24px rgba(4, 120, 87, 0.15)',
            border: activeTab === 'received' ? '2px solid #6EE7B7' : '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transform: activeTab === 'received' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease',
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
                {activeTab === 'received' && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: '#34D399',
                      color: '#064E3B',
                      padding: '1px 7px',
                      borderRadius: 10,
                    }}
                  >
                    Viewing History ↓
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: '#A7F3D0', fontWeight: 500 }}>
                Withdrawal Requests (For Payout)
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
                {tableLoading ? '—' : totalReceivedForWithdrawals}
              </div>
              <div style={{ fontSize: 11.5, color: '#A7F3D0', marginTop: 6 }}>
                Customer &amp; merchant funds received for withdrawal payout
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
          onClick={() => setActiveTab('cash_send')}
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #2E1065 50%, #4C1D95 100%)',
            borderRadius: 16,
            padding: '20px 22px',
            color: '#FFFFFF',
            boxShadow:
              activeTab === 'cash_send'
                ? '0 0 0 3px #FFFFFF, 0 10px 28px rgba(76, 29, 149, 0.6)'
                : '0 8px 24px rgba(76, 29, 149, 0.25)',
            border: activeTab === 'cash_send' ? '2px solid #DDD6FE' : '1px solid rgba(255, 255, 255, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transform: activeTab === 'cash_send' ? 'translateY(-2px)' : 'none',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                {activeTab === 'cash_send' && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: '#F59E0B',
                      color: '#1E1B4B',
                      padding: '1px 7px',
                      borderRadius: 10,
                    }}
                  >
                    Viewing History ↓
                  </span>
                )}
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FCD34D',
                  fontSize: 18,
                }}
              >
                <HiOutlinePaperAirplane style={{ transform: 'rotate(45deg)' }} />
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: '#DDD6FE', fontWeight: 600 }}>
              Send Funds to Users &amp; Merchants
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
              <span style={{ fontSize: 20, color: '#FCD34D', fontWeight: 700 }}>₹</span>
              {tableLoading ? '—' : totalCashSent}
            </div>
            <div style={{ fontSize: 11.5, color: '#C4B5FD', marginTop: 4 }}>
              Deduct from Added Fund, Commission, or Received Fund
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
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
      {/* 2. ADMIN WALLET TABLES (Driven by Selected Top Card)          */}
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
          {/* Left: Dynamic Header Badge & Subtitle */}
          <div>
            {activeTab === 'added_fund' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    border: '1px solid #C7D2FE',
                  }}
                >
                  🟣 Admin Added Fund Ledger ({addedFundEntries.length} entries)
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary, #64748B)' }}>
                  Capital float injections &amp; cash sent from Admin Added Fund
                </span>
              </div>
            )}
            {activeTab === 'commission' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: '#F0F9FF',
                    color: '#0284C7',
                    border: '1px solid #BAE6FD',
                  }}
                >
                  🔵 Platform Commission Ledger ({commissionRows.length} entries)
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary, #64748B)' }}>
                  Percentage platform fee commissions earned from customer purchases at merchants
                </span>
              </div>
            )}
            {activeTab === 'received' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                  }}
                >
                  🟢 Received for Withdrawal Payout ({withdrawalsTotal} requests)
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary, #64748B)' }}>
                  Withdrawal requests sent by customers &amp; merchants to admin for payout
                </span>
              </div>
            )}
            {activeTab === 'cash_send' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: '#FAF5FF',
                    color: '#7C3AED',
                    border: '1px solid #DDD6FE',
                  }}
                >
                  💸 Admin Cash Send Ledger ({cashSendEntries.length} transfers)
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary, #64748B)' }}>
                  All direct cash transfers sent by admin to customers and merchants with source wallet details
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions / Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeTab === 'added_fund' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAddFundModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                }}
              >
                <HiOutlinePlus style={{ strokeWidth: 3 }} /> Add Capital
              </button>
            )}

            {activeTab === 'cash_send' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedRecipient(null);
                  setSendSearchQuery('');
                  setSendAmount('');
                  setSendNote('');
                  setShowSendModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                }}
              >
                <HiOutlinePaperAirplane style={{ transform: 'rotate(45deg)' }} /> Send Cash Now
              </button>
            )}

            {activeTab === 'received' && (
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
                  <HiOutlineFilter style={{ fontSize: 14 }} /> Status:
                </span>
                <select
                  value={withdrawalsStatusFilter}
                  onChange={(e) => setWithdrawalsStatusFilter(e.target.value)}
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
                  <option value="ALL">All Withdrawals</option>
                  <option value="PENDING">Pending Payout</option>
                  <option value="SENT">Completed / Sent</option>
                  <option value="REJECTED">Rejected</option>
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
              onClick={() => loadWalletData(txPage, cashPage, ledgerPage, withdrawalsPage)}
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

        {/* Empty States */}
        {!tableLoading &&
          !tableError &&
          ((activeTab === 'added_fund' && addedFundEntries.length === 0) ||
            (activeTab === 'commission' && commissionRows.length === 0) ||
            (activeTab === 'received' && withdrawalsData.length === 0) ||
            (activeTab === 'cash_send' && cashSendEntries.length === 0)) && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <HiOutlineCash style={{ fontSize: 44, color: '#CBD5E1', marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #0F172A)' }}>
                {activeTab === 'added_fund'
                  ? 'No Added Fund transactions recorded yet.'
                  : activeTab === 'commission'
                  ? 'No platform commission entries recorded yet.'
                  : activeTab === 'received'
                  ? 'No withdrawal requests found for this filter.'
                  : 'No cash transfers sent by admin recorded yet.'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-light, #64748B)', marginTop: 4 }}>
                {activeTab === 'added_fund'
                  ? 'Click "+ Add Capital" above to inject funds or send money from Added Fund.'
                  : activeTab === 'commission'
                  ? 'Platform fee percentage commissions will appear here when customer purchases occur at registered merchants.'
                  : activeTab === 'received'
                  ? 'Customer and merchant withdrawal requests for admin payout will appear here.'
                  : 'Click "Send Cash Now" on the card above or top right to transfer funds directly to customers or merchants.'}
              </div>
            </div>
          )}

        {/* ── TABLE 1: ADDED FUND LEDGER ── */}
        {!tableLoading && !tableError && activeTab === 'added_fund' && addedFundEntries.length > 0 && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Movement</th>
                  <th>Party / Initiator</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Description / Note</th>
                  <th>Date &amp; Time</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {addedFundEntries.map((item) => {
                  const m = (item.movement || '').toUpperCase();
                  const isAddedFund = m === 'ADDED_FUND';

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
                    <tr key={item.id || item.transaction_group_id}>
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

                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 6,
                            backgroundColor: isAddedFund ? '#EDE9FE' : '#FEE2E2',
                            color: isAddedFund ? '#6D28D9' : '#B91C1C',
                            border: `1px solid ${isAddedFund ? '#DDD6FE' : '#FECACA'}`,
                            fontSize: 11.5,
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isAddedFund ? (
                            <HiOutlinePlus style={{ fontSize: 13, strokeWidth: 3 }} />
                          ) : (
                            <HiOutlineArrowUp />
                          )}
                          <span>{isAddedFund ? 'ADDED FUND' : 'CASH SENT'}</span>
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                            {item.party_name || item.user_name || (isAddedFund ? 'Platform Admin' : 'Recipient')}
                          </span>
                          {item.user_role && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '1px 6px',
                                borderRadius: 4,
                                backgroundColor:
                                  String(item.user_role).toUpperCase() === 'MERCHANT' ? '#EFF6FF' : '#EDE9FE',
                                color:
                                  String(item.user_role).toUpperCase() === 'MERCHANT' ? '#2563EB' : '#6D28D9',
                              }}
                            >
                              {String(item.user_role)}
                            </span>
                          )}
                        </div>
                        {(item.party_email || item.user_email) && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {item.party_email || item.user_email}
                          </div>
                        )}
                      </td>

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
                          {item.transaction_type || item.type || (isAddedFund ? 'ADMIN_CAPITAL' : 'ADMIN_SEND_FUNDS')}
                        </span>
                      </td>

                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          fontSize: 14.5,
                          color: isAddedFund ? '#6D28D9' : '#B91C1C',
                        }}
                      >
                        {isAddedFund ? '+' : '-'}₹{formattedAmount}
                      </td>

                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 260 }}>
                        {item.description || '—'}
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

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

        {/* ── TABLE 2: PLATFORM COMMISSION LEDGER ── */}
        {!tableLoading && !tableError && activeTab === 'commission' && commissionRows.length > 0 && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Merchant / Store</th>
                  <th style={{ textAlign: 'right' }}>Sale Amount</th>
                  <th style={{ textAlign: 'center' }}>Merchant Debited</th>
                  <th style={{ textAlign: 'center' }}>Customer Cashback</th>
                  <th style={{ textAlign: 'center' }}>Admin Commission</th>
                  <th>Date &amp; Time</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {commissionRows.map((t) => {
                  const saleAmt = Number(t.sale_amount || t.amount || 0);
                  const mDebit = Number(t.merchant_debit || (t.sale_amount && t.merchant_deduction_percent ? (t.sale_amount * t.merchant_deduction_percent / 100) : 0));
                  const cCashback = Number(t.customer_cashback || (t.sale_amount && t.customer_cashback_percent ? (t.sale_amount * t.customer_cashback_percent / 100) : 0));
                  const adminFee = Number(t.company_fee || t.amount || 0);

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
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                            {t.customer_name || customerDisplay || 'Customer'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span>{t.customer_phone || t.customer_email || '—'}</span>
                            {t.customer_user_code && (
                              <span style={{ fontFamily: 'monospace', background: '#F1F5F9', color: '#475569', padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>
                                {t.customer_user_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                            {t.merchant_name || merchantDisplay || 'Merchant'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
                            {t.merchant_city && <span>📍 {t.merchant_city}</span>}
                            {t.merchant_login_id && (
                              <span style={{ fontFamily: 'monospace', background: '#EFF6FF', color: '#1D4ED8', padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                                {t.merchant_login_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text)' }}>
                        ₹{saleAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#E11D48' }}>
                            -₹{mDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {t.merchant_deduction_percent !== null && t.merchant_deduction_percent !== undefined && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#BE123C', background: '#FFE4E6', padding: '1px 6px', borderRadius: 6, marginTop: 2 }}>
                              {t.merchant_deduction_percent}% split
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: '#059669' }}>
                            +₹{cCashback.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {t.customer_cashback_percent !== null && t.customer_cashback_percent !== undefined && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#047857', background: '#D1FAE5', padding: '1px 6px', borderRadius: 6, marginTop: 2 }}>
                              {t.customer_cashback_percent}% cashback
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: '#0284C7' }}>
                            +₹{adminFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {t.company_fee_percent !== null && t.company_fee_percent !== undefined && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '1px 6px', borderRadius: 6, marginTop: 2 }}>
                              {t.company_fee_percent}% fee
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCommissionDetail(t)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1px solid #BAE6FD',
                            background: '#F0F9FF',
                            color: '#0284C7',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#0284C7';
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#F0F9FF';
                            e.currentTarget.style.color = '#0284C7';
                          }}
                        >
                          <HiOutlineEye style={{ fontSize: 15 }} />
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

        {/* ── TABLE 3: RECEIVED WITHDRAWAL PAYOUT REQUESTS ── */}
        {!tableLoading && !tableError && activeTab === 'received' && withdrawalsData.length > 0 && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beneficiary User / Merchant</th>
                  <th style={{ textAlign: 'right' }}>Requested Amount</th>
                  <th>Bank / Payment Details</th>
                  <th>Mode</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th>Requested Date</th>
                  <th style={{ textAlign: 'center' }}>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalsData.map((w) => {
                  const statusUpper = (w.status || '').toUpperCase();
                  const isPending = statusUpper === 'PENDING';
                  const isCompleted = statusUpper === 'COMPLETED' || statusUpper === 'SENT';
                  const isRejected = statusUpper === 'REJECTED' || statusUpper === 'FAILED';
                  const isSendingThis = sendingTxGroupId === (w.transaction_group_id || w.id);
                  const isRejectingThis = rejectingTxGroupId === (w.transaction_group_id || w.id);

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
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text, #0F172A)' }}>
                            {w.account_holder_name || w.user_name || w.name || 'User'}
                          </span>
                          {w.role && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '1px 6px',
                                borderRadius: 4,
                                backgroundColor: String(w.role).toUpperCase() === 'MERCHANT' ? '#EFF6FF' : '#F1F5F9',
                                color: String(w.role).toUpperCase() === 'MERCHANT' ? '#2563EB' : '#475569',
                              }}
                            >
                              {String(w.role)}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary, #64748B)', marginTop: 2 }}>
                          {w.user_phone ? `📞 ${w.user_phone}` : ''}
                          {w.user_email ? ` • ${w.user_email}` : ''}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 800, fontSize: 14.5, color: '#059669' }}>
                          ₹{Number(w.amount || w.requested_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td>
                        {w.upi_id ? (
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                            UPI: <span style={{ fontFamily: 'monospace', color: '#1D4ED8' }}>{w.upi_id}</span>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                              A/C: <span style={{ fontFamily: 'monospace', color: '#1E293B', background: '#F8FAFC', padding: '1px 6px', borderRadius: 4, border: '1px solid #E2E8F0' }}>{w.account_number || w.account_number_masked || '—'}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                              Bank: <strong>{w.bank_name || 'Bank'}</strong> | IFSC: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>{w.ifsc || w.ifsc_code || '—'}</span>
                            </div>
                          </>
                        )}
                      </td>

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

                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: 12,
                            display: 'inline-block',
                            backgroundColor: isCompleted ? '#DCFCE7' : isPending ? '#FEF3C7' : '#FEE2E2',
                            color: isCompleted ? '#15803D' : isPending ? '#B45309' : '#B91C1C',
                          }}
                        >
                          {isCompleted ? '✓ SENT' : isPending ? '⏳ PENDING' : '✕ REJECTED'}
                        </span>
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleApproveWithdrawal(w.transaction_group_id || w.id, w.amount)}
                              disabled={isSendingThis || isRejectingThis}
                              className="btn btn-primary"
                              style={{
                                padding: '4px 10px',
                                fontSize: 11.5,
                                fontWeight: 700,
                                background: '#059669',
                                borderColor: '#059669',
                              }}
                            >
                              {isSendingThis ? 'Sending...' : 'Approve & Pay'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectWithdrawal(w.transaction_group_id || w.id, w.amount)}
                              disabled={isSendingThis || isRejectingThis}
                              className="btn btn-outline"
                              style={{
                                padding: '4px 8px',
                                fontSize: 11.5,
                                color: '#DC2626',
                                borderColor: '#FCA5A5',
                              }}
                            >
                              {isRejectingThis ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        ) : isCompleted ? (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>Paid ✓</span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#B91C1C' }}>Rejected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TABLE 4: CASH SEND LEDGER ── */}
        {!tableLoading && !tableError && activeTab === 'cash_send' && cashSendEntries.length > 0 && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recipient (Customer / Merchant)</th>
                  <th>Recipient Role</th>
                  <th>Deducted From</th>
                  <th style={{ textAlign: 'right' }}>Amount Sent</th>
                  <th>Purpose / Note</th>
                  <th>Date &amp; Time</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cashSendEntries.map((item) => {
                  const desc = item.description || item.note || '';
                  const rawName =
                    item.user_name ||
                    item.recipient_name ||
                    item.name ||
                    (desc.includes('Cash sent to ')
                      ? desc.split('Cash sent to ')[1].split(' (')[0]
                      : desc.includes('transfer to ')
                      ? desc.split('transfer to ')[1].split(' from')[0]
                      : 'Recipient');

                  const isMerchant =
                    item.user_role === 'MERCHANT' ||
                    String(item.recipient_type || '').toUpperCase() === 'MERCHANT' ||
                    desc.toUpperCase().includes('MERCHANT');

                  let deductedFrom = 'Admin Added Fund';
                  let deductedBadgeBg = '#EDE9FE';
                  let deductedBadgeColor = '#6D28D9';
                  let deductedBadgeBorder = '#DDD6FE';

                  if (desc.toUpperCase().includes('COMMISSION')) {
                    deductedFrom = 'Commission Fund';
                    deductedBadgeBg = '#E0F2FE';
                    deductedBadgeColor = '#0284C7';
                    deductedBadgeBorder = '#BAE6FD';
                  } else if (desc.toUpperCase().includes('RECEIVED')) {
                    deductedFrom = 'Received Fund';
                    deductedBadgeBg = '#ECFDF5';
                    deductedBadgeColor = '#059669';
                    deductedBadgeBorder = '#A7F3D0';
                  }

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

                  const loginCode =
                    item.user_email ||
                    item.phone ||
                    item.user_code ||
                    item.reference_id ||
                    (desc.includes('(') && desc.includes(')') ? desc.split('(')[1].split(')')[0] : `ID #${item.user_id || item.id}`);

                  return (
                    <tr key={item.id || item.transaction_group_id || Math.random()}>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              backgroundColor: isMerchant ? '#FEF3C7' : '#EEF2FF',
                              color: isMerchant ? '#B45309' : '#4F46E5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                              flexShrink: 0,
                            }}
                          >
                            {isMerchant ? <HiOutlineShoppingBag /> : <HiOutlineUser />}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                              {rawName}
                            </span>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748B', marginTop: 1 }}>
                              {loginCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            backgroundColor: isMerchant ? '#FFFBEB' : '#F5F3FF',
                            color: isMerchant ? '#B45309' : '#6D28D9',
                            border: `1px solid ${isMerchant ? '#FDE68A' : '#DDD6FE'}`,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isMerchant ? 'MERCHANT' : 'CUSTOMER'}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 9px',
                            borderRadius: 6,
                            backgroundColor: deductedBadgeBg,
                            color: deductedBadgeColor,
                            border: `1px solid ${deductedBadgeBorder}`,
                            fontSize: 11.5,
                            fontWeight: 700,
                          }}
                        >
                          {deductedFrom}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: 14.5, fontWeight: 900, color: '#DC2626' }}>
                            -₹{formattedAmount}
                          </span>
                          <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, marginTop: 1 }}>
                            ● CREDITED TO WALLET
                          </span>
                        </div>
                      </td>

                      <td style={{ maxWidth: 220 }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: '#475569',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                          title={desc}
                        >
                          {desc || 'Direct admin wallet credit'}
                        </span>
                      </td>

                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() =>
                            setSelectedCashSendDetail({
                              ...item,
                              recipientName: rawName,
                              recipientRole: isMerchant ? 'MERCHANT' : 'CUSTOMER',
                              recipientCode: loginCode,
                              deductedFrom,
                              formattedAmount,
                              dateStr,
                              description: desc,
                            })
                          }
                          style={{
                            padding: '5px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            borderColor: '#DDD6FE',
                            color: '#6D28D9',
                            background: '#FAF5FF',
                          }}
                        >
                          Details
                        </button>
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
            {activeTab === 'added_fund' && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Showing all {addedFundEntries.length} Added Fund entries
              </div>
            )}

            {activeTab === 'cash_send' && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Showing all {cashSendEntries.length} admin cash transfers
              </div>
            )}

            {activeTab === 'commission' && ledgerTotal > 0 && (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing {Math.min((ledgerPage - 1) * ledgerPageSize + 1, ledgerTotal)} to{' '}
                  {Math.min(ledgerPage * ledgerPageSize, ledgerTotal)} of {ledgerTotal} commission entries
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => loadWalletData(txPage, cashPage, ledgerPage - 1, withdrawalsPage)}
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
                    Page {ledgerPage} of {ledgerTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => loadWalletData(txPage, cashPage, ledgerPage + 1, withdrawalsPage)}
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

            {activeTab === 'received' && withdrawalsTotal > 0 && (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Showing {Math.min((withdrawalsPage - 1) * withdrawalsPageSize + 1, withdrawalsTotal)} to{' '}
                  {Math.min(withdrawalsPage * withdrawalsPageSize, withdrawalsTotal)} of {withdrawalsTotal} requests
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => loadWalletData(txPage, cashPage, ledgerPage, withdrawalsPage - 1)}
                    disabled={withdrawalsPage <= 1 || tableLoading}
                    className="btn btn-outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      fontSize: 13,
                      opacity: withdrawalsPage <= 1 ? 0.5 : 1,
                      cursor: withdrawalsPage <= 1 ? 'not-allowed' : 'pointer',
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
                    Page {withdrawalsPage} of {withdrawalsTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => loadWalletData(txPage, cashPage, ledgerPage, withdrawalsPage + 1)}
                    disabled={withdrawalsPage >= withdrawalsTotalPages || tableLoading}
                    className="btn btn-outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      fontSize: 13,
                      opacity: withdrawalsPage >= withdrawalsTotalPages ? 0.5 : 1,
                      cursor: withdrawalsPage >= withdrawalsTotalPages ? 'not-allowed' : 'pointer',
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
                    {String(selectedRecipient.business_name || selectedRecipient.name || 'U').charAt(0).toUpperCase()}
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
                  ₹{Number(addedFundBalance || 0).toFixed(2)}
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

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 6. COMMISSION BREAKDOWN DETAILS MODAL                        */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!selectedCommissionDetail}
        onClose={() => setSelectedCommissionDetail(null)}
        title="Merchant Payment & Commission Breakdown"
        size="lg"
      >
        {selectedCommissionDetail && (
          <div style={{ padding: '4px 0' }}>
            {/* Top Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #0369A1 0%, #0284C7 100%)',
                borderRadius: 12,
                color: '#FFFFFF',
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#BAE6FD', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Transaction Reference / Group ID
                </div>
                <div style={{ fontSize: 13.5, fontFamily: 'monospace', fontWeight: 800, marginTop: 2, wordBreak: 'break-all' }}>
                  {selectedCommissionDetail.reference_id || selectedCommissionDetail.transaction_group_id || `#${selectedCommissionDetail.id}`}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: '#D1FAE5',
                    color: '#065F46',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  ● COMPLETED
                </span>
                <div style={{ fontSize: 11, color: '#BAE6FD', marginTop: 4 }}>
                  {selectedCommissionDetail.date ? new Date(selectedCommissionDetail.date).toLocaleString('en-IN') : '—'}
                </div>
              </div>
            </div>

            {/* 3-Way Percentage Split Card */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '18px 20px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Cashback &amp; Platform Fee Distribution
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>
                    Total Sale Amount: ₹{Number(selectedCommissionDetail.sale_amount || selectedCommissionDetail.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {/* Merchant Deduction */}
                <div
                  style={{
                    background: '#FFF1F2',
                    border: '1px solid #FECDD3',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#E11D48', textTransform: 'uppercase' }}>
                    Merchant Debited
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#BE123C', marginTop: 4 }}>
                    -₹{Number(selectedCommissionDetail.merchant_debit || (selectedCommissionDetail.sale_amount && selectedCommissionDetail.merchant_deduction_percent ? (selectedCommissionDetail.sale_amount * selectedCommissionDetail.merchant_deduction_percent / 100) : 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9F1239', marginTop: 4 }}>
                    {selectedCommissionDetail.merchant_deduction_percent !== null && selectedCommissionDetail.merchant_deduction_percent !== undefined
                      ? `${selectedCommissionDetail.merchant_deduction_percent}% total deduction`
                      : 'Split rate'}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#881337', marginTop: 6 }}>
                    Deducted from merchant wallet balance on sale
                  </div>
                </div>

                {/* Customer Cashback */}
                <div
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                    Customer Cashback
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#047857', marginTop: 4 }}>
                    +₹{Number(selectedCommissionDetail.customer_cashback || (selectedCommissionDetail.sale_amount && selectedCommissionDetail.customer_cashback_percent ? (selectedCommissionDetail.sale_amount * selectedCommissionDetail.customer_cashback_percent / 100) : 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginTop: 4 }}>
                    {selectedCommissionDetail.customer_cashback_percent !== null && selectedCommissionDetail.customer_cashback_percent !== undefined
                      ? `${selectedCommissionDetail.customer_cashback_percent}% cashback reward`
                      : 'Reward rate'}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#064E3B', marginTop: 6 }}>
                    Directly credited into customer wallet
                  </div>
                </div>

                {/* Admin Platform Commission */}
                <div
                  style={{
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0284C7', textTransform: 'uppercase' }}>
                    Admin Commission
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0369A1', marginTop: 4 }}>
                    +₹{Number(selectedCommissionDetail.company_fee || selectedCommissionDetail.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#075985', marginTop: 4 }}>
                    {selectedCommissionDetail.company_fee_percent !== null && selectedCommissionDetail.company_fee_percent !== undefined
                      ? `${selectedCommissionDetail.company_fee_percent}% platform fee`
                      : 'Company fee'}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#0C4A6E', marginTop: 6 }}>
                    Credited into Platform Company Wallet
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Merchant Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Customer Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <HiOutlineUser style={{ fontSize: 18, color: '#0284C7' }} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                    Customer Details
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Customer Name:</span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedCommissionDetail.customer_name || 'Customer'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Customer ID / Code:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284C7' }}>{selectedCommissionDetail.customer_user_code || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Phone:</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedCommissionDetail.customer_phone || '—'}</span>
                  </div>
                  {selectedCommissionDetail.customer_email && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Email:</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedCommissionDetail.customer_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Merchant Card */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                  <HiOutlineShoppingBag style={{ fontSize: 18, color: '#10B981' }} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                    Merchant Store Details
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Store / Business Name:</span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{selectedCommissionDetail.merchant_name || 'Merchant'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Login ID:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#1D4ED8' }}>{selectedCommissionDetail.merchant_login_id || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>City / Location:</span>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedCommissionDetail.merchant_city || '—'}</span>
                  </div>
                  {selectedCommissionDetail.merchant_category && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Category:</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedCommissionDetail.merchant_category}</span>
                    </div>
                  )}
                  {selectedCommissionDetail.merchant_owner_name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Owner Name:</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{selectedCommissionDetail.merchant_owner_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedCommissionDetail(null)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 7. CASH SEND DETAILS MODAL                                   */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={!!selectedCashSendDetail}
        onClose={() => setSelectedCashSendDetail(null)}
        title="Admin Cash Transfer Details"
        size="md"
      >
        {selectedCashSendDetail && (
          <div style={{ padding: '4px 0' }}>
            {/* Top Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #1E1B4B 0%, #3B0764 50%, #4C1D95 100%)',
                borderRadius: 14,
                color: '#FFFFFF',
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#DDD6FE', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Transfer Reference / Group ID
                </div>
                <div style={{ fontSize: 13.5, fontFamily: 'monospace', fontWeight: 800, marginTop: 3, wordBreak: 'break-all' }}>
                  {selectedCashSendDetail.transaction_group_id || selectedCashSendDetail.reference_id || `#${selectedCashSendDetail.id}`}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: '#D1FAE5',
                    color: '#065F46',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  ● COMPLETED
                </span>
                <div style={{ fontSize: 11, color: '#DDD6FE', marginTop: 4 }}>
                  {selectedCashSendDetail.dateStr || '—'}
                </div>
              </div>
            </div>

            {/* Transfer Amount Card */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Amount Sent by Admin
                </span>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#DC2626', marginTop: 2 }}>
                  -₹{selectedCashSendDetail.formattedAmount}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Deducted From Wallet
                </span>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#4F46E5', marginTop: 2 }}>
                  {selectedCashSendDetail.deductedFrom}
                </div>
              </div>
            </div>

            {/* Recipient Profile Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 12 }}>
                Recipient Profile Information
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Recipient Name:</span>
                  <strong style={{ color: '#0F172A' }}>{selectedCashSendDetail.recipientName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Recipient Role:</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: selectedCashSendDetail.recipientRole === 'MERCHANT' ? '#FEF3C7' : '#EEF2FF',
                      color: selectedCashSendDetail.recipientRole === 'MERCHANT' ? '#B45309' : '#4F46E5',
                    }}
                  >
                    {selectedCashSendDetail.recipientRole}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Login / Phone ID:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F172A' }}>
                    {selectedCashSendDetail.recipientCode}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Admin Transfer Purpose:</span>
                  <span style={{ color: '#334155', maxWidth: 280, textAlign: 'right', fontWeight: 500 }}>
                    {selectedCashSendDetail.description || 'Admin direct fund credit'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Credit Status:</span>
                  <strong style={{ color: '#16A34A' }}>Instant Wallet Balance Credit</strong>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
              <button
                type="button"
                onClick={() => setSelectedCashSendDetail(null)}
                style={{
                  padding: '9px 22px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

    </motion.div>
  );
}
