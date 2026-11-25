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
  const activePanel = rawTab === 'wallet' ? 'profile' : rawTab;

  const getLiveToken = () => getAccessToken() || getCustomerToken();

  const buildCustomerHeaders = (extra = {}) => {
    const tok = getLiveToken();
    return {
      'Content-Type': 'application/json',
      ...(tok ? { Authorization: tok.startsWith('Bearer ') ? tok : `Bearer ${tok}` } : {}),
      ...extra,
    };
  };

  const [customerUser, setCustomerUser] = useState(() => user || getStoredCustomerUser() || null);
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
    const liveTok = getLiveToken();
    const storedCust = getStoredCustomerUser();
    if (liveTok && user && (getCustomerToken() !== liveTok || !storedCust || Number(storedCust.id) !== Number(user.id))) {
      setCustomerSession({ access_token: liveTok, user });
    }

    const headers = buildCustomerHeaders();
    const [profileRes, subRes] = await Promise.all([
      apiFetch('/api/v1/auth/me', { method: 'GET', headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetchMyActiveSubscriptions().catch(() => null),
    ]);

    if (profileRes) {
      const mergedUser = { ...(user || {}), ...profileRes };
      setCustomerUser(mergedUser);
      setCustomerSession({ access_token: liveTok, user: mergedUser });
      if (updateUser) updateUser(mergedUser);
      syncFormFromUser(mergedUser);
    } else if (user) {
      setCustomerUser(user);
      syncFormFromUser(user);
    }

    if (subRes) setActiveSubData(subRes);
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
    setSearchParams({ tab });
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
  const handleSubscribePlan = async (pkg) => {
    setSubscribingId(pkg.id || pkg.code);
    setErrorMsg('');
    setNoticeMsg('');
    try {
      await startCustomerRazorpaySubscription({
        packageItem: pkg,
        customerUser,
        onSuccess: async () => {
          setNoticeMsg('₹500 Seller Plan activated! Product creation & incoming orders are now unlocked.');
          await syncCustomerAuthAndOverview();
          const summary = await fetchMyActiveSubscriptions().catch(() => null);
          if (summary) setActiveSubData(summary);
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
    <div style={{ textAlign: 'center', padding: '44px 24px', background: '#f8fafc', borderRadius: 16, border: '1.5px dashed #cbd5e1' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <HiLockClosed size={26} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{title} Requires ₹500 Seller Plan</h3>
      <p style={{ margin: '0 auto 20px', maxWidth: 440, fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
        Subscribe to the official <strong>₹500 Seller Plan</strong> to unlock creating products, managing incoming buyer orders, and parcel dispatch tracking.
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

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', paddingBottom: 32 }}>
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
                  { label: '₹500 Seller Plan', value: isSellerSubscribed ? 'Active (Unlocked)' : 'Not Subscribed' },
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
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Seller Plan & Subscriptions</h2>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>
              Subscribe to the ₹500 Seller Plan using the exact same Razorpay subscription API as the mobile app.
            </p>

            {isSellerSubscribed && (
              <div style={{ padding: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>₹500 Seller Plan Active</div>
                  <div style={{ fontSize: 12, color: '#15803d' }}>You have full access to Create Products, My Products & Customer Orders.</div>
                </div>
                {(activeSubData?.user_subscriptions || []).map((sub) => (
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
                    Cancel Plan
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {(subPackages.length > 0
                ? subPackages
                : [{ id: 'default-500', code: 'USER_SELLER_500', name: '₹500 Seller Plan', price: 500, duration_days: 30, description: 'Unlock product creation & incoming customer orders on Logo Marketplace.' }]
              ).map((pkg) => {
                const pkgAmt = Number(pkg.price ?? pkg.amount ?? 500);
                return (
                  <div key={pkg.id || pkg.code} style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{pkg.name}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#2563eb', margin: '8px 0' }}>
                      ₹{pkgAmt.toLocaleString('en-IN')}
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}> / {pkg.duration_days || 30} days</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#475569', minHeight: 36 }}>{pkg.description || 'Create & sell products directly to buyers across Kerala.'}</p>
                    <button
                      type="button"
                      disabled={subscribingId === (pkg.id || pkg.code)}
                      onClick={() => handleSubscribePlan(pkg)}
                      style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}
                    >
                      {subscribingId === (pkg.id || pkg.code) ? 'Processing...' : isSellerSubscribed ? 'Extend / Renew Plan' : 'Subscribe Now via Razorpay'}
                    </button>
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
    </div>
  );
}
