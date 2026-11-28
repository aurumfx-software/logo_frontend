import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiUser,
  HiCreditCard,
  HiShoppingBag,
  HiOutlineTruck,
  HiCube,
  HiTag,
  HiSparkles,
  HiExclamationCircle,
  HiQuestionMarkCircle,
  HiHeart,
  HiRefresh,
  HiPlus,
  HiTrash,
  HiEye,
  HiCheckCircle,
  HiLockClosed,
  HiArrowUp,
  HiArrowDown,
  HiExternalLink,
  HiPencil,
  HiPhotograph,
  HiGift,
  HiCash,
  HiX,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { apiFetch, getAccessToken } from '../api/apiClient';
import {
  getCustomerToken,
  setCustomerSession,
  fetchCustomerProfile,
  getStoredCustomerUser,
  updateCustomerProfile,
  updateCustomerLocation,
  uploadCustomerAvatar,
  customerForgotPassword,
  customerResetPassword,
} from '../api/customerApi';
import ChangePasswordCard from '../components/UI/ChangePasswordCard';
import { formatMediaUrl } from '../api/merchantApi';
import {
  fetchAdminSubscriptionPackages,
  fetchMyActiveSubscriptions,
  hasActiveSellerSubscription,
  startCustomerRazorpaySubscription,
  cancelMySubscription,
  computeDaysRemaining,
} from '../api/subscriptionApi';
import {
  getBuyerOrders,
  fetchMyProducts,
  fetchMyOrders,
  getMarketplaceWishlist,
  removeFromMarketplaceWishlist,
} from '../api/productApi';
import CustomerAddProductModal from '../components/products/CustomerAddProductModal';
import MyProductsPanel from '../components/products/MyProductsPanel';
import SellerOrdersPanel from '../components/products/SellerOrdersPanel';

const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
];

function formatTxnType(type, dir) {
  const t = String(type || '').toUpperCase();
  if (t === 'WALLET_TOPUP' || t.includes('TOPUP')) return 'Wallet Top-Up';
  if (t === 'CASHBACK_REDEMPTION' || t.includes('CASHBACK')) return 'Cashback Earned';
  if (t === 'ADMIN_CREDIT') return 'Bonus / Admin Credit';
  if (t === 'ADMIN_DEBIT') return 'Adjustment';
  if (t === 'P2P_TRANSFER' || t.includes('TRANSFER')) {
    return dir === 'CREDIT' ? 'Money Received' : 'Money Sent';
  }
  if (t === 'SALE_QR' || t.includes('SALE') || t.includes('QR')) return 'QR Merchant Pay';
  return t ? t.replace(/_/g, ' ') : 'Wallet Transaction';
}

export default function FieldStaffDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab') || 'profile';
  const activePanel = rawTab;

  const getLiveToken = () => getCustomerToken() || getAccessToken();

  const buildCustomerHeaders = (extra = {}) => {
    const tok = getLiveToken();
    return {
      'Content-Type': 'application/json',
      ...(tok ? { Authorization: tok.startsWith('Bearer ') ? tok : `Bearer ${tok}` } : {}),
      ...extra,
    };
  };

  const [customerUser, setCustomerUser] = useState(() => getStoredCustomerUser() || user || null);
  const [activeSubData, setActiveSubData] = useState(null);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Profile Edit State (exact mobile CustomerProfileModal.js parity)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    district: '',
    city: '',
    profile_picture: '',
  });

  // Wallet State (exact mobile CustomerWalletModal.js parity)
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [walletTxns, setWalletTxns] = useState([]);
  const [pendingRewards, setPendingRewards] = useState([]);
  const [walletView, setWalletView] = useState('DASHBOARD'); // 'DASHBOARD' | 'TOPUP' | 'SEND' | 'WITHDRAW'
  const [topupAmount, setTopupAmount] = useState('');
  const [toppingUp, setToppingUp] = useState(false);
  const [transferForm, setTransferForm] = useState({ target: '', amount: '', note: '' });
  const [transferring, setTransferring] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    payout_mode: 'IMPS',
  });
  const [withdrawing, setWithdrawing] = useState(false);

  // Orders, Wishlist & Products State
  const [ordersSubTab, setOrdersSubTab] = useState('seller'); // 'seller' | 'buyer'
  const [wishlistItems, setWishlistItems] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [myProducts, setMyProducts] = useState([]);

  // Subscriptions State
  const [subPackages, setSubPackages] = useState([]);
  const [subscribingId, setSubscribingId] = useState(null);
  const [planActionModal, setPlanActionModal] = useState(null); // null | 'upgrade' | 'renew'

  // Grievance / Support State
  const [complaints, setComplaints] = useState([]);
  const [complaintForm, setComplaintForm] = useState({
    subject: '',
    category: 'Order / Delivery Issue',
    description: '',
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const isSellerSubscribed = hasActiveSellerSubscription(customerUser, activeSubData);

  const syncFormFromUser = (u) => {
    if (!u) return;
    const rawEmail = u.email || '';
    setProfileForm({
      name: u.name || '',
      email: rawEmail.includes('@customer.logoapp.local') ? '' : rawEmail,
      phone: u.phone || '',
      address: u.address || '',
      district: u.district || '',
      city: u.city || '',
      profile_picture: u.profile_picture || u.avatar || '',
    });
  };

  const syncCustomerAuthAndOverview = async () => {
    const custTok = getCustomerToken();
    const adminTok = getAccessToken();
    const liveTok = custTok || adminTok;
    const storedCust = getStoredCustomerUser();
    if (!custTok && liveTok && user && !storedCust) {
      setCustomerSession({ access_token: liveTok, user });
    }

    const headers = buildCustomerHeaders();
    const [profileRes, subRes, pkgsRes] = await Promise.all([
      apiFetch('/api/v1/auth/me', { method: 'GET', headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetchMyActiveSubscriptions().catch(() => null),
      fetchAdminSubscriptionPackages({ audience: 'USER', activeOnly: true }).catch(() => []),
    ]);

    if (profileRes) {
      const mergedUser = { ...(storedCust || user || {}), ...profileRes };
      setCustomerUser(mergedUser);
      setCustomerSession({ access_token: liveTok, user: mergedUser });
      if (updateUser && !custTok) updateUser(mergedUser);
      syncFormFromUser(mergedUser);
    } else if (storedCust || user) {
      const fallback = storedCust || user;
      setCustomerUser(fallback);
      syncFormFromUser(fallback);
    }

    if (subRes) setActiveSubData(subRes);
    if (Array.isArray(pkgsRes) && pkgsRes.length > 0) setSubPackages(pkgsRes);
  };

  const loadWalletData = async () => {
    const headers = buildCustomerHeaders();
    const [meRes, txRes, rewRes] = await Promise.all([
      apiFetch('/api/v1/wallet/me', { method: 'GET', headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      apiFetch('/api/v1/wallet/transactions?page=1&page_size=20', { method: 'GET', headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      apiFetch('/api/v1/wallet/rewards/pending', { method: 'GET', headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    const bal = meRes?.wallet?.balance ?? meRes?.balance ?? meRes?.data?.balance ?? 0;
    setWalletBalance(Number(bal).toFixed(2));

    const txList = Array.isArray(txRes?.data)
      ? txRes.data
      : Array.isArray(txRes?.transactions)
      ? txRes.transactions
      : Array.isArray(txRes?.items)
      ? txRes.items
      : Array.isArray(txRes?.data?.transactions)
      ? txRes.data.transactions
      : Array.isArray(txRes)
      ? txRes
      : [];
    setWalletTxns(txList);

    const rewList = Array.isArray(rewRes?.data) ? rewRes.data : Array.isArray(rewRes) ? rewRes : [];
    setPendingRewards(rewList);
  };

  const loadPanel = async (panel) => {
    setErrorMsg('');
    setNoticeMsg('');
    setLoadingPanel(true);
    try {
      await syncCustomerAuthAndOverview();

      if (panel === 'saved') {
        const res = await getMarketplaceWishlist();
        setWishlistItems(Array.isArray(res?.items) ? res.items : []);
      } else if (panel === 'wallet') {
        await loadWalletData();
      } else if (panel === 'seller-orders' || panel === 'dispatched') {
        const [sOrders, bOrders] = await Promise.all([
          fetchMyOrders().catch(() => []),
          getBuyerOrders().catch(() => []),
        ]);
        setSellerOrders(Array.isArray(sOrders) ? sOrders : []);
        setBuyerOrders(Array.isArray(bOrders) ? bOrders : []);
      } else if (panel === 'buyer-orders') {
        const bOrders = await getBuyerOrders().catch(() => []);
        setBuyerOrders(Array.isArray(bOrders) ? bOrders : []);
      } else if (panel === 'my-products') {
        const prods = await fetchMyProducts().catch(() => []);
        setMyProducts(Array.isArray(prods) ? prods : []);
      } else if (panel === 'subscriptions') {
        const [pkgs, summary] = await Promise.all([
          fetchAdminSubscriptionPackages({ audience: 'USER', activeOnly: true }).catch(() => []),
          fetchMyActiveSubscriptions().catch(() => null),
        ]);
        setSubPackages(Array.isArray(pkgs) ? pkgs : []);
        if (summary) setActiveSubData(summary);
      } else if (panel === 'grievance') {
        const res = await apiFetch('/api/v1/complaints', { method: 'GET', headers: buildCustomerHeaders() });
        const json = await res.json().catch(() => ({}));
        const list = json?.data || json?.complaints || json?.items || (Array.isArray(json) ? json : []);
        setComplaints(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load data');
    } finally {
      setLoadingPanel(false);
    }
  };

  useEffect(() => {
    loadPanel(activePanel);
  }, [activePanel]);

  const setTab = (tab) => {
    setIsEditingProfile(false);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
  };

  // Profile Edit Handlers
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setErrorMsg('');
    try {
      const res = await uploadCustomerAvatar(file);
      const url = res?.profile_picture_url || '';
      setProfileForm((prev) => ({ ...prev, profile_picture: url }));
      const nextUser = { ...(customerUser || {}), profile_picture: url, avatar: url };
      setCustomerUser(nextUser);
      if (updateUser) updateUser(nextUser);
      setNoticeMsg('Profile photo updated!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setNoticeMsg('');
    if (!profileForm.name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    setSavingProfile(true);
    try {
      const updatedProf = await updateCustomerProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        email: profileForm.email,
        address: profileForm.address,
        profile_picture: profileForm.profile_picture || undefined,
      });
      const updatedLoc = await updateCustomerLocation({
        district: profileForm.district,
        city: profileForm.city,
        location: [profileForm.city, profileForm.district].filter(Boolean).join(', '),
      });
      const finalUser = { ...(customerUser || {}), ...(updatedProf || {}), ...(updatedLoc || {}) };
      setCustomerUser(finalUser);
      if (updateUser) updateUser(finalUser);
      setIsEditingProfile(false);
      setNoticeMsg('Profile updated successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Wallet Handlers
  const handleWalletRazorpayTopup = async (e) => {
    e.preventDefault();
    const num = Number(topupAmount);
    if (!num || num < 10) {
      setErrorMsg('Please enter an amount of at least ₹10.');
      return;
    }
    setToppingUp(true);
    setErrorMsg('');
    setNoticeMsg('');
    try {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(script);
        });
      }
      const headers = buildCustomerHeaders();
      const orderRes = await apiFetch('/api/v1/wallet/topup/razorpay/order', {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount: num }),
      });
      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) throw new Error(orderData.detail || orderData.message || 'Failed to start Razorpay top-up');

      if (orderData.razorpay_order_id && orderData.razorpay_order_id.startsWith('order_dev_')) {
        await apiFetch('/api/v1/wallet/topup/razorpay/verify', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            razorpay_order_id: orderData.razorpay_order_id,
            razorpay_payment_id: `pay_dev_topup_${Date.now()}`,
            razorpay_signature: 'dev_signature_ok',
          }),
        });
        setNoticeMsg(`₹${num} added to your wallet!`);
        setTopupAmount('');
        setWalletView('DASHBOARD');
        await loadWalletData();
        setToppingUp(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: orderData.razorpay_key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || 'INR',
        name: 'Logo Kerala Wallet',
        description: `Add ₹${num} to My Wallet`,
        order_id: orderData.razorpay_order_id,
        handler: async (resp) => {
          try {
            const vRes = await apiFetch('/api/v1/wallet/topup/razorpay/verify', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              }),
            });
            if (!vRes.ok) throw new Error('Payment verification failed');
            setNoticeMsg(`₹${num} added to your wallet!`);
            setTopupAmount('');
            setWalletView('DASHBOARD');
            await loadWalletData();
          } catch (vErr) {
            setErrorMsg(vErr.message || 'Wallet top-up verification failed');
          } finally {
            setToppingUp(false);
          }
        },
        modal: { ondismiss: () => setToppingUp(false) },
        prefill: {
          name: customerUser?.name || '',
          email: customerUser?.email || '',
          contact: String(customerUser?.phone || '').replace(/[^0-9]/g, '').slice(-10),
        },
        theme: { color: '#2563eb' },
      });
      rzp.open();
    } catch (err) {
      setErrorMsg(err.message || 'Wallet top-up failed');
      setToppingUp(false);
    }
  };

  const handleWalletTransfer = async (e) => {
    e.preventDefault();
    const amt = Number(transferForm.amount);
    if (!transferForm.target.trim() || !amt || amt <= 0) {
      setErrorMsg('Please enter recipient ID/email/phone and valid amount.');
      return;
    }
    setTransferring(true);
    setErrorMsg('');
    setNoticeMsg('');
    try {
      const target = transferForm.target.trim();
      const body = { amount: amt, note: transferForm.note.trim() || undefined };
      if (target.includes('@')) body.to_email = target.toLowerCase();
      else if (/^\d{10,}$/.test(target.replace(/[^0-9]/g, ''))) body.to_phone = target;
      else body.to_user_code = target.toUpperCase();

      const res = await apiFetch('/api/v1/wallet/transfer', {
        method: 'POST',
        headers: buildCustomerHeaders(),
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || 'Transfer failed');
      setNoticeMsg(`Transferred ₹${amt} successfully!`);
      setTransferForm({ target: '', amount: '', note: '' });
      setWalletView('DASHBOARD');
      await loadWalletData();
    } catch (err) {
      setErrorMsg(err.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const handleWalletWithdraw = async (e) => {
    e.preventDefault();
    const amt = Number(withdrawForm.amount);
    if (!amt || amt < 100) {
      setErrorMsg('Minimum withdrawal amount is ₹100.');
      return;
    }
    if (!withdrawForm.account_holder_name.trim() || !withdrawForm.account_number.trim() || !withdrawForm.ifsc_code.trim()) {
      setErrorMsg('Please fill bank holder name, account number, and IFSC code.');
      return;
    }
    setWithdrawing(true);
    setErrorMsg('');
    setNoticeMsg('');
    try {
      const res = await apiFetch('/api/v1/wallet/withdrawals', {
        method: 'POST',
        headers: buildCustomerHeaders(),
        body: JSON.stringify({
          amount: amt,
          account_holder_name: withdrawForm.account_holder_name.trim(),
          account_number: withdrawForm.account_number.trim(),
          ifsc_code: withdrawForm.ifsc_code.trim().toUpperCase(),
          payout_mode: withdrawForm.payout_mode,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || 'Withdrawal request failed');
      setNoticeMsg(`Withdrawal request for ₹${amt} submitted!`);
      setWithdrawForm({ amount: '', account_holder_name: '', account_number: '', ifsc_code: '', payout_mode: 'IMPS' });
      setWalletView('DASHBOARD');
      await loadWalletData();
    } catch (err) {
      setErrorMsg(err.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  // Subscriptions Handler
  const handleSubscribePlan = async (pkg, { renew = false } = {}) => {
    setSubscribingId(pkg.id || pkg.code);
    setErrorMsg('');
    setNoticeMsg('');
    try {
      await startCustomerRazorpaySubscription({
        packageItem: pkg,
        customerUser,
        renew: Boolean(renew),
        onSuccess: async (subRes) => {
          if (subRes?.cancelled) return;
          setNoticeMsg(
            renew
              ? `"${pkg.name}" renewed & validity extended!`
              : `${pkg.name || 'Subscription Plan'} activated! Features are now unlocked.`
          );
          await syncCustomerAuthAndOverview();
          const summary = await fetchMyActiveSubscriptions().catch(() => null);
          if (summary) setActiveSubData(summary);
          await loadPanel(activePanel);
        },
        onError: (payErr) => setErrorMsg(payErr?.message || 'Subscription activation failed'),
      });
    } catch (err) {
      setErrorMsg(err.message || 'Subscription activation failed');
    } finally {
      setSubscribingId(null);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.subject.trim() || !complaintForm.description.trim()) {
      setErrorMsg('Please enter both subject and details.');
      return;
    }
    setSubmittingComplaint(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/v1/complaints', {
        method: 'POST',
        headers: buildCustomerHeaders(),
        body: JSON.stringify({
          subject: complaintForm.subject.trim(),
          category: complaintForm.category,
          description: complaintForm.description.trim(),
          customer_name: customerUser?.name || '',
          customer_email: customerUser?.email || '',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.detail || json.message || 'Failed to submit complaint');
      setNoticeMsg('Grievance submitted! Administration will review it shortly.');
      setComplaintForm({ subject: '', category: 'Order / Delivery Issue', description: '' });
      await loadPanel('grievance');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit grievance');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const renderPlanLockCard = (title) => (
    <div style={{ textAlign: 'center', padding: '44px 24px', background: '#fffbeb', borderRadius: 16, border: '1.5px dashed #f59e0b' }}>
      <div className="logo-lock-badge-anim" style={{ width: 64, height: 64, margin: '0 auto 14px' }}>
        <HiLockClosed size={30} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{title} Requires ₹500 Seller Plan</h3>
      <p style={{ margin: '0 auto 20px', maxWidth: 440, fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
        Subscribe to the official <strong>₹500 Seller Plan</strong> to unlock creating products, managing incoming buyer orders, parcel dispatch tracking, and the <strong>Wallet &amp; Cashback Section</strong>.
      </p>
      <button
        type="button"
        onClick={() => setTab('subscriptions')}
        style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}
      >
        Unlock with ₹500 Seller Plan →
      </button>
    </div>
  );

  const customerPlanList =
    subPackages.length > 0
      ? subPackages
      : [
          {
            id: 'default-500',
            code: 'USER_SELLER_500',
            name: '₹500 Seller Plan',
            price: 500,
            duration_days: 30,
            description: 'Unlock product creation & incoming customer orders on Logo Marketplace.',
          },
        ];
  const activeCustomerSubs = (activeSubData?.user_subscriptions || activeSubData?.subscriptions || []).filter((s) => {
    const st = String(s.status || 'ACTIVE').toUpperCase();
    if (st !== 'ACTIVE') return false;
    if (s.expires_at && new Date(s.expires_at).getTime() < Date.now()) return false;
    return true;
  });
  const isCustPkgSubscribed = (pkg) =>
    activeCustomerSubs.some(
      (s) =>
        String(s.package_id || '') === String(pkg?.id || '') ||
        (pkg?.code && String(s.package_code || '').toUpperCase() === String(pkg.code).toUpperCase())
    );
  const maxCustSubPrice = activeCustomerSubs.reduce((mx, s) => {
    const matched = customerPlanList.find(
      (p) =>
        String(p.id) === String(s.package_id) ||
        (s.package_code && String(p.code || '').toUpperCase() === String(s.package_code).toUpperCase())
    );
    const val = Number(matched?.price ?? s.price ?? s.amount_paid ?? 0);
    return val > mx ? val : mx;
  }, 0);
  const custUpgradePackages = customerPlanList.filter((pkg) => {
    if (isCustPkgSubscribed(pkg)) return false;
    return Number(pkg.price ?? pkg.amount ?? 0) > maxCustSubPrice;
  });
  const activeCustSubSummaries = activeCustomerSubs.map((s) => {
    const matched = customerPlanList.find(
      (p) =>
        String(p.id) === String(s.package_id) ||
        (s.package_code && String(p.code || '').toUpperCase() === String(s.package_code).toUpperCase())
    );
    return {
      ...s,
      pkg: matched || {
        id: s.package_id,
        code: s.package_code,
        name: s.package_name || 'Seller Plan',
        price: s.price ?? s.amount_paid ?? 500,
        duration_days: s.duration_days || 30,
      },
      planName: s.package_name || matched?.name || s.package_code || 'Seller Plan',
      daysLeft: computeDaysRemaining(s),
    };
  });
  const primaryCustPlanLabel =
    activeCustSubSummaries.length > 0
      ? activeCustSubSummaries.map((s) => s.planName).join(', ')
      : isSellerSubscribed
      ? '₹500 Seller Plan'
      : '';
  const minCustDaysLeft = activeCustSubSummaries.reduce((mn, s) => {
    if (s.daysLeft === null || s.daysLeft === undefined) return mn;
    return mn === null ? s.daysLeft : Math.min(mn, s.daysLeft);
  }, null);

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', paddingBottom: 32 }}>
      {/* Top Active Plan Summary Strip across Customer Profile & Workspace */}
      <div
        style={{
          background: primaryCustPlanLabel ? 'linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)' : '#ffffff',
          borderRadius: 14,
          border: primaryCustPlanLabel ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
          padding: '12px 18px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: primaryCustPlanLabel ? '#065f46' : '#475569' }}>
            {primaryCustPlanLabel ? `👑 Subscribed Plan: ${primaryCustPlanLabel}` : '🔒 Current Plan: Free (No Active Paid Plan)'}
          </span>
          {minCustDaysLeft !== null && (
            <span style={{ padding: '2px 9px', borderRadius: 999, background: '#16a34a', color: '#fff', fontSize: 11.5, fontWeight: 800 }}>
              {minCustDaysLeft} Days Left
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setPlanActionModal('upgrade')}
            className="logo-upgrade-btn"
          >
            <HiSparkles size={14} />
            <span>Upgrade Plan</span>
          </button>
          <button
            type="button"
            onClick={() => setPlanActionModal('renew')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 13px',
              borderRadius: 9,
              border: '1.5px solid #059669',
              background: '#ffffff',
              color: '#047857',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <HiRefresh size={14} />
            <span>Renew</span>
          </button>
        </div>
      </div>

      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, minHeight: 460 }}>
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}
        {noticeMsg && (
          <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#166534', fontSize: 13, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiCheckCircle size={18} />
            <span>{noticeMsg}</span>
          </div>
        )}

        {loadingPanel ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
            Loading live account data...
          </div>
        ) : activePanel === 'profile' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {profileForm.profile_picture ? (
                  <img
                    src={formatMediaUrl(profileForm.profile_picture)}
                    alt={customerUser?.name}
                    style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', border: '2px solid #bfdbfe' }}
                  />
                ) : (
                  <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #bfdbfe' }}>
                    {(customerUser?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{customerUser?.name || 'Customer Profile'}</h2>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {customerUser?.email || '-'} • {customerUser?.user_code || ''} ({customerUser?.login_id || ''})
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate('/marketplace')}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
                >
                  Open Marketplace
                </button>
                <button
                  type="button"
                  onClick={() => setTab('saved')}
                  style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#e11d48', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <HiHeart size={14} /> Saved Items
                </button>
                <button
                  type="button"
                  onClick={() => setTab('buyer-orders')}
                  style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#2563eb', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <HiShoppingBag size={14} /> My Placed Orders
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  style={{ background: '#2563eb', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 800, color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <HiPencil size={14} /> {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => loadPanel('profile')}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <HiRefresh size={14} />
                </button>
              </div>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} style={{ background: '#f8fafc', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                    <HiPhotograph size={16} />
                    <span>{uploadingAvatar ? 'Uploading Photo...' : 'Change Profile Photo'}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Full Name *</label>
                    <input type="text" required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Email Address</label>
                    <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Mobile Phone</label>
                    <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Kerala District</label>
                    <select value={profileForm.district} onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, background: '#fff' }}>
                      <option value="">-- Select District --</option>
                      {KERALA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>City / Town</label>
                    <input type="text" value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Street Address</label>
                    <input type="text" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5 }} />
                  </div>
                </div>
                <button type="submit" disabled={savingProfile} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {[
                  { label: 'Full Name', value: customerUser?.name || '-' },
                  { label: 'Email Address', value: customerUser?.email || '-' },
                  { label: 'Mobile Phone', value: customerUser?.phone || '-' },
                  { label: 'Customer Code', value: customerUser?.user_code || '-' },
                  { label: 'Login ID', value: customerUser?.login_id || '-' },
                  { label: 'District / City', value: [customerUser?.city, customerUser?.district].filter(Boolean).join(', ') || 'Not set' },
                  { label: 'Address', value: customerUser?.address || 'Not set' },
                  { label: 'Active Subscription', value: primaryCustPlanLabel ? `${primaryCustPlanLabel}${minCustDaysLeft !== null ? ` (${minCustDaysLeft}d left)` : ' (Unlocked)'}` : 'Not Subscribed' },
                ].map((field) => (
                  <div key={field.label} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>{field.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{field.value}</div>
                  </div>
                ))}
              </div>
            )}

            <ChangePasswordCard
              defaultEmail={customerUser?.email || ''}
              title="Reset / Change Customer Password"
              subtitle="Verify with a 6-digit email OTP to set a new password across Mobile App & Web."
              onSendOtp={customerForgotPassword}
              onResetPassword={customerResetPassword}
            />
          </div>
        ) : activePanel === 'wallet' ? (
          !isSellerSubscribed ? (
            renderPlanLockCard('Wallet & Cashback Section')
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>Wallet &amp; Cashback Section</h2>
                  <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
                    Add money via Razorpay, claim sales cashback rewards, transfer or withdraw funds.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadWalletData()}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <HiRefresh size={14} /> Refresh Wallet
                </button>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', borderRadius: 16, padding: '22px 24px', color: '#fff', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Available Wallet Balance</div>
                  <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4 }}>₹{Number(walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { id: 'DASHBOARD', label: 'Overview' },
                    { id: 'TOPUP', label: '+ Add Money' },
                    { id: 'SEND', label: 'Transfer' },
                    { id: 'WITHDRAW', label: 'Withdraw Bank' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setWalletView(v.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 9,
                        border: walletView === v.id ? '1.5px solid #fff' : '1px solid rgba(255,255,255,0.3)',
                        background: walletView === v.id ? '#2563eb' : 'rgba(255,255,255,0.12)',
                        color: '#fff',
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {walletView === 'TOPUP' ? (
                <form onSubmit={handleWalletRazorpayTopup} style={{ background: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 18 }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800 }}>Add Money via Razorpay</h3>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter amount in ₹"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      style={{ flex: 1, minWidth: 180, padding: '10px 12px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13.5 }}
                    />
                    <button type="submit" disabled={toppingUp} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>
                      {toppingUp ? 'Opening Razorpay...' : 'Pay & Add Money'}
                    </button>
                  </div>
                </form>
              ) : walletView === 'SEND' ? (
                <form onSubmit={handleWalletTransfer} style={{ background: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 18 }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800 }}>Transfer Money to User</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="Recipient User Code / ID *"
                      value={transferForm.target}
                      onChange={(e) => setTransferForm({ ...transferForm, target: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Amount in ₹ *"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={transferForm.note}
                      onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                      style={{ padding: '10px 12px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                  <button type="submit" disabled={transferring} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>
                    {transferring ? 'Transferring...' : 'Send Money'}
                  </button>
                </form>
              ) : walletView === 'WITHDRAW' ? (
                <form onSubmit={handleWalletWithdraw} style={{ background: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: 18 }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800 }}>Withdraw to Bank Account</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 12 }}>
                    <input type="number" min="1" placeholder="Amount ₹ *" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} style={{ padding: '10px 12px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13 }} />
                    <input type="text" placeholder="Account Holder Name *" value={withdrawForm.account_holder_name} onChange={(e) => setWithdrawForm({ ...withdrawForm, account_holder_name: e.target.value })} style={{ padding: '10px 12px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13 }} />
                    <input type="text" placeholder="Account Number *" value={withdrawForm.account_number} onChange={(e) => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })} style={{ padding: '10px 12px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13 }} />
                    <input type="text" placeholder="IFSC Code *" value={withdrawForm.ifsc_code} onChange={(e) => setWithdrawForm({ ...withdrawForm, ifsc_code: e.target.value })} style={{ padding: '10px 12px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13 }} />
                  </div>
                  <button type="submit" disabled={withdrawing} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 20px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>
                    {withdrawing ? 'Submitting...' : 'Submit Withdrawal Request'}
                  </button>
                </form>
              ) : null}

              {pendingRewards.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Pending Cashback &amp; Reward Claims</h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {pendingRewards.map((rw) => (
                      <div key={rw.id} style={{ padding: '12px 16px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#92400e' }}>{rw.title || 'Cashback Reward'} — ₹{Number(rw.amount || 0).toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: 12, color: '#b45309' }}>{rw.description || 'Tap claim to credit directly to your wallet.'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const headers = buildCustomerHeaders();
                              const res = await apiFetch(`/api/v1/wallet/rewards/${rw.id}/redeem`, { method: 'POST', headers });
                              const json = await res.json().catch(() => ({}));
                              if (!res.ok) throw new Error(json.detail || json.message || 'Failed to claim cashback');
                              setNoticeMsg(json.message || 'Cashback credited to your wallet!');
                              await loadWalletData();
                            } catch (err) {
                              setErrorMsg(err.message || 'Failed to redeem reward');
                            }
                          }}
                          style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Claim ₹{Number(rw.amount || 0)}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Wallet &amp; Cashback Transactions</h3>
                {walletTxns.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#64748b' }}>No wallet transactions recorded yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {walletTxns.map((tx, idx) => {
                      const amt = Number(tx.amount || 0);
                      const isCredit = amt > 0 || ['CREDIT', 'WALLET_TOPUP', 'CASHBACK', 'REWARD'].some((k) => String(tx.transaction_type || tx.type || '').toUpperCase().includes(k));
                      return (
                        <div key={tx.id || idx} style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{tx.description || formatTxnType(tx.transaction_type || tx.type, tx.direction)}</div>
                            <div style={{ fontSize: 11.5, color: '#64748b' }}>{tx.created_at ? new Date(tx.created_at).toLocaleString() : ''}</div>
                          </div>
                          <div style={{ fontSize: 14.5, fontWeight: 900, color: isCredit ? '#16a34a' : '#dc2626' }}>
                            {isCredit ? '+' : '-'}₹{Math.abs(amt).toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        ) : activePanel === 'saved' ? (
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>My Saved Products ({wishlistItems.length})</h2>
            {wishlistItems.length === 0 ? (
              <p style={{ fontSize: 13, color: '#64748b' }}>No saved products yet. Browse the Marketplace to save favorites.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                {wishlistItems.map((item) => {
                  const p = item.product || item;
                  return (
                    <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{p.name || p.title}</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#2563eb', marginBottom: 10 }}>₹{Number(p.price || 0).toLocaleString('en-IN')}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => navigate(`/product/${p.id}`)} style={{ flex: 1, padding: '7px 10px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          View
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeFromMarketplaceWishlist(p.id);
                            loadPanel('saved');
                          }}
                          style={{ padding: '7px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activePanel === 'buyer-orders' ? (
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>My Placed Orders ({buyerOrders.length})</h2>
            {buyerOrders.length === 0 ? (
              <p style={{ fontSize: 13, color: '#64748b' }}>You have not placed any marketplace orders yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {buyerOrders.map((ord) => {
                  const amt = Number(ord.total_price ?? ord.total_amount ?? ord.unit_price ?? ord.price ?? 0);
                  return (
                    <div key={ord.id || ord.order_code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                          #{ord.order_code || ord.id} — {ord.product_name || 'Marketplace Item'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          Qty: {ord.quantity || 1} • ₹{amt.toLocaleString('en-IN')} • Status: <strong>{ord.status || ord.delivery_status}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/order/${ord.id || ord.order_code}`)}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <span>Track Order</span>
                        <HiExternalLink size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activePanel === 'seller-orders' || activePanel === 'dispatched' ? (
          <SellerOrdersPanel
            mode={activePanel === 'dispatched' ? 'dispatched' : 'orders'}
            sellerOrders={sellerOrders}
            setSellerOrders={setSellerOrders}
            buyerOrders={buyerOrders}
            ordersSubTab={ordersSubTab}
            setOrdersSubTab={setOrdersSubTab}
            isSellerSubscribed={isSellerSubscribed}
            renderPlanLockCard={renderPlanLockCard}
            navigate={navigate}
            onReload={() => loadPanel(activePanel)}
            setNoticeMsg={setNoticeMsg}
            setErrorMsg={setErrorMsg}
          />
        ) : activePanel === 'my-products' || activePanel === 'sell-ad' ? (
          !isSellerSubscribed ? (
            renderPlanLockCard(activePanel === 'sell-ad' ? 'Sell / Post an Ad' : 'My Products')
          ) : activePanel === 'sell-ad' ? (
            <CustomerAddProductModal
              isOpen={true}
              embedded={true}
              onClose={() => setTab('my-products')}
              customerUser={customerUser}
              onProductCreated={() => {
                setNoticeMsg('Product created successfully!');
                setTab('my-products');
              }}
            />
          ) : (
            <MyProductsPanel
              products={myProducts}
              setProducts={setMyProducts}
              customerUser={customerUser}
              onReload={() => loadPanel('my-products')}
              setNoticeMsg={setNoticeMsg}
              setErrorMsg={setErrorMsg}
            />
          )
        ) : activePanel === 'subscriptions' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Seller Plan &amp; Subscriptions</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  Subscribe to Admin-configured Customer / Seller Plans using Razorpay.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setPlanActionModal('upgrade')}
                  className="logo-upgrade-btn"
                >
                  <HiSparkles size={14} />
                  <span>Upgrade Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlanActionModal('renew')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '7px 13px',
                    borderRadius: 9,
                    border: '1.5px solid #059669',
                    background: '#ffffff',
                    color: '#047857',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <HiRefresh size={14} />
                  <span>Renew</span>
                </button>
              </div>
            </div>

            {(isSellerSubscribed || activeCustSubSummaries.length > 0) && (
              <div style={{ padding: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>
                    {primaryCustPlanLabel || 'Active Seller Plan'}
                    {minCustDaysLeft !== null ? ` • ${minCustDaysLeft} Days Left` : ''}
                  </div>
                  <div style={{ fontSize: 12, color: '#15803d' }}>You have active access according to your subscribed plan permissions.</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activeCustSubSummaries.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('Cancel active subscription?')) return;
                        await cancelMySubscription(sub.id);
                        await loadPanel('subscriptions');
                      }}
                      style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Cancel {sub.planName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {customerPlanList.map((pkg) => {
                const pkgAmt = Number(pkg.price ?? pkg.amount ?? 500);
                const subscribed = isCustPkgSubscribed(pkg);
                const matchedSub = activeCustSubSummaries.find(
                  (s) =>
                    String(s.package_id || '') === String(pkg.id || '') ||
                    (pkg.code && String(s.package_code || '').toUpperCase() === String(pkg.code).toUpperCase())
                );
                return (
                  <div key={pkg.id || pkg.code} style={{ border: subscribed ? '2px solid #16a34a' : '1.5px solid #e2e8f0', background: subscribed ? '#f0fdf4' : '#ffffff', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{pkg.name}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: subscribed ? '#16a34a' : '#2563eb', margin: '8px 0' }}>
                      ₹{pkgAmt.toLocaleString('en-IN')}
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                        {' '}/ {pkg.duration_days || 30} days
                        {subscribed && matchedSub?.daysLeft !== null && matchedSub?.daysLeft !== undefined ? ` • ${matchedSub.daysLeft}d left` : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#475569', minHeight: 36 }}>{pkg.description || 'Create & sell products directly to buyers across Kerala.'}</p>
                    {subscribed ? (
                      <button
                        type="button"
                        disabled
                        style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <HiCheckCircle size={17} />
                        <span>Subscribed</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={subscribingId === (pkg.id || pkg.code)}
                        onClick={() => handleSubscribePlan(pkg)}
                        style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}
                      >
                        {subscribingId === (pkg.id || pkg.code) ? 'Processing...' : 'Subscribe Now via Razorpay'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : activePanel === 'grievance' ? (
          <div>
            <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Report an Issue / Grievance</h2>
            <form onSubmit={handleSubmitComplaint} style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <input type="text" required placeholder="Issue Subject *" value={complaintForm.subject} onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                <select value={complaintForm.category} onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="Order / Delivery Issue">Order / Delivery Issue</option>
                  <option value="Payment / Wallet Issue">Payment / Wallet Issue</option>
                  <option value="Product / Seller Report">Product / Seller Report</option>
                  <option value="App / Account Support">App / Account Support</option>
                </select>
              </div>
              <textarea required rows={3} placeholder="Describe your grievance in detail..." value={complaintForm.description} onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, marginBottom: 12 }} />
              <button type="submit" disabled={submittingComplaint} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                {submittingComplaint ? 'Submitting...' : 'Submit Grievance'}
              </button>
            </form>

            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#334155' }}>Previous Grievances</h4>
            {complaints.length === 0 ? (
              <p style={{ fontSize: 13, color: '#64748b' }}>No complaints submitted.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {complaints.map((c, i) => (
                  <div key={c.id || i} style={{ padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13.5, color: '#0f172a' }}>{c.subject || c.category}</strong>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#e0f2fe', color: '#0369a1' }}>{c.status || 'OPEN'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: '#475569' }}>{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Help & Customer Support</h2>
            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.7 }}>
              Logo App connects Kerala customers with verified local merchants and ₹500 verified community sellers.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>Order & Payment Rules</strong>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Min order ₹150. Free delivery above ₹499. Online payment via Razorpay or Cash on Delivery (+₹40 below ₹500).</p>
              </div>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: 13, color: '#0f172a' }}>Direct Support</strong>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Select "Report an Issue / Grievance" in the sidebar to submit a support request to administration.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Upgrade Plan / Renew & All Plans Modal */}
      {planActionModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPlanActionModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.58)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 780,
              maxHeight: '86vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 18,
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)',
              border: '1px solid #e2e8f0',
              padding: 22,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {planActionModal === 'upgrade' ? (
                    <>
                      <HiSparkles size={20} color="#7c3aed" />
                      <span>Upgrade Your Plan</span>
                    </>
                  ) : (
                    <>
                      <HiRefresh size={20} color="#059669" />
                      <span>Renew Plan &amp; All Plans</span>
                    </>
                  )}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  {planActionModal === 'upgrade'
                    ? 'Showing only plans above your current active plan (current & lower plans are hidden).'
                    : 'View your active plan remaining validity days, extend your active plan, or browse all available plans.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlanActionModal(null)}
                style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <HiX size={18} />
              </button>
            </div>

            {planActionModal === 'upgrade' ? (
              <div>
                {primaryCustPlanLabel && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14, fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                    Current Plan: <strong style={{ color: '#0f172a' }}>{primaryCustPlanLabel}</strong> (₹{maxCustSubPrice.toLocaleString('en-IN')})
                  </div>
                )}

                {custUpgradePackages.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', borderRadius: 14, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#166534', marginBottom: 6 }}>
                      You are already on our highest plan tier!
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: '#15803d' }}>
                      No higher plans are available right now above ₹{maxCustSubPrice.toLocaleString('en-IN')}.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPlanActionModal('renew')}
                      style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Open Renew &amp; All Plans
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    {custUpgradePackages.map((pkg) => (
                      <div key={pkg.id || pkg.code} style={{ padding: 16, borderRadius: 14, border: '1.5px solid #c4b5fd', background: '#faf5ff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 15.5, fontWeight: 800, color: '#0f172a' }}>{pkg.name}</div>
                          <div style={{ fontSize: 22, fontWeight: 900, color: '#6d28d9', margin: '6px 0' }}>
                            ₹{Number(pkg.price ?? pkg.amount ?? 0).toLocaleString('en-IN')}
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}> / {pkg.duration_days || 30} days</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12.5, color: '#475569' }}>{pkg.description}</p>
                        </div>
                        <button
                          type="button"
                          disabled={subscribingId === (pkg.id || pkg.code)}
                          onClick={() => handleSubscribePlan(pkg)}
                          className="logo-upgrade-btn"
                          style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                        >
                          {subscribingId === (pkg.id || pkg.code)
                            ? 'Processing...'
                            : `Upgrade to ${pkg.name} (₹${Number(pkg.price ?? pkg.amount ?? 0).toLocaleString('en-IN')})`}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ padding: 14, borderRadius: 14, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#065f46', marginBottom: 10 }}>
                    Current Active Subscription(s) &amp; Remaining Days
                  </div>
                  {activeCustSubSummaries.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#047857', fontWeight: 600 }}>
                      No active paid subscription yet. Select a plan below!
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10 }}>
                      {activeCustSubSummaries.map((sub) => (
                        <div key={sub.id || sub.package_id} style={{ padding: 12, borderRadius: 12, background: '#ffffff', border: '1px solid #6ee7b7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{sub.planName}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginTop: 2 }}>
                              {sub.daysLeft !== null ? `⏳ ${sub.daysLeft} Days Remaining` : 'Active Validity'}
                              {sub.expires_at ? ` • Expires ${new Date(sub.expires_at).toLocaleDateString('en-IN')}` : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={subscribingId === (sub.pkg?.id || sub.package_id)}
                            onClick={() => handleSubscribePlan(sub.pkg, { renew: true })}
                            style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                          >
                            {subscribingId === (sub.pkg?.id || sub.package_id) ? 'Extending...' : 'Renew Now'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                    All Available Plans
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    {customerPlanList.map((pkg) => {
                      const subscribed = isCustPkgSubscribed(pkg);
                      const pkgAmt = Number(pkg.price ?? pkg.amount ?? 500);
                      return (
                        <div key={pkg.id || pkg.code} style={{ padding: 15, borderRadius: 12, border: subscribed ? '2px solid #16a34a' : '1px solid #cbd5e1', background: subscribed ? '#f0fdf4' : '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{pkg.name}</span>
                              <span style={{ fontSize: 16, fontWeight: 900, color: subscribed ? '#16a34a' : '#2563eb' }}>₹{pkgAmt.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Duration: {pkg.duration_days || 30} Days</div>
                            <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>{pkg.description}</p>
                          </div>
                          {subscribed ? (
                            <button
                              type="button"
                              disabled
                              style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                            >
                              <HiCheckCircle size={16} />
                              <span>Subscribed</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={subscribingId === (pkg.id || pkg.code)}
                              onClick={() => handleSubscribePlan(pkg)}
                              style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                            >
                              {subscribingId === (pkg.id || pkg.code) ? 'Processing...' : 'Subscribe Now via Razorpay'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
