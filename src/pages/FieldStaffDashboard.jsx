import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  HiLogout,
  HiChevronRight,
  HiRefresh,
  HiPlus,
  HiTrash,
  HiEye,
  HiCheckCircle,
  HiLockClosed,
  HiArrowUp,
  HiArrowDown,
  HiExternalLink,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { apiFetch, getAccessToken } from '../api/apiClient';
import {
  getCustomerToken,
  setCustomerSession,
  fetchCustomerProfile,
  logoutCustomerSession,
  getStoredCustomerUser,
  getCustomerHeaders,
} from '../api/customerApi';
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

const ORDER_STATUS_CHOICES = ['PLACED', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function FieldStaffDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [customerUser, setCustomerUser] = useState(() => getStoredCustomerUser() || user || null);
  const [activeSubData, setActiveSubData] = useState(null);
  const [activePanel, setActivePanel] = useState('profile');
  // 'profile' | 'wallet' | 'saved' | 'buyer-orders' | 'seller-orders' | 'dispatched' | 'my-products' | 'subscriptions' | 'grievance' | 'help'

  const [loadingPanel, setLoadingPanel] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Data States (exact same mobile APIs)
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [walletTxns, setWalletTxns] = useState([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [toppingUp, setToppingUp] = useState(false);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [myProducts, setMyProducts] = useState([]);

  const [subPackages, setSubPackages] = useState([]);
  const [subscribingId, setSubscribingId] = useState(null);

  const [complaints, setComplaints] = useState([]);
  const [complaintForm, setComplaintForm] = useState({ subject: '', category: 'Order / Delivery Issue', description: '' });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({ courier_partner: '', tracking_number: '', tracking_url: '' });

  const isSellerSubscribed = hasActiveSellerSubscription(customerUser, activeSubData);

  const loadAccountOverview = async () => {
    setLoadingPanel(true);
    try {
      const adminTok = getAccessToken();
      if (!getCustomerToken() && adminTok && user) {
        setCustomerSession({ access_token: adminTok, user });
      }

      const [profile, subSummary, balRes] = await Promise.all([
        fetchCustomerProfile().catch(() => null),
        fetchMyActiveSubscriptions().catch(() => null),
        apiFetch('/api/v1/wallet/me', { method: 'GET', headers: getCustomerHeaders() })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      if (profile) setCustomerUser(profile);
      if (subSummary) setActiveSubData(subSummary);

      const bal = balRes?.wallet?.balance ?? balRes?.balance ?? balRes?.data?.balance;
      if (bal !== undefined && bal !== null) {
        setWalletBalance(Number(bal).toFixed(2));
      }
    } catch (_) {
    } finally {
      setLoadingPanel(false);
    }
  };

  useEffect(() => {
    loadAccountOverview();
  }, []);

  const loadWalletData = async () => {
    setLoadingPanel(true);
    setErrorMsg('');
    try {
      const [meRes, txRes] = await Promise.all([
        apiFetch('/api/v1/wallet/me', { method: 'GET', headers: getCustomerHeaders() }).then((r) =>
          r.ok ? r.json() : null
        ),
        apiFetch('/api/v1/wallet/transactions?page=1&page_size=20', {
          method: 'GET',
          headers: getCustomerHeaders(),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);
      const bal = meRes?.wallet?.balance ?? meRes?.balance ?? meRes?.data?.balance ?? 0;
      setWalletBalance(Number(bal).toFixed(2));
      const txList =
        txRes?.transactions || txRes?.items || txRes?.data?.transactions || (Array.isArray(txRes) ? txRes : []);
      setWalletTxns(txList);
    } catch (err) {
      setErrorMsg(err.message || 'Could not load wallet details');
    } finally {
      setLoadingPanel(false);
    }
  };

  const loadPanelData = async (panel) => {
    setActivePanel(panel);
    setErrorMsg('');
    setNoticeMsg('');
    setLoadingPanel(true);
    try {
      if (panel === 'wallet') {
        await loadWalletData();
        return;
      }
      if (panel === 'saved') {
        const res = await getMarketplaceWishlist();
        setWishlistItems(Array.isArray(res?.items) ? res.items : []);
      } else if (panel === 'buyer-orders') {
        const ords = await getBuyerOrders();
        setBuyerOrders(Array.isArray(ords) ? ords : []);
      } else if (panel === 'seller-orders' || panel === 'dispatched') {
        if (!isSellerSubscribed) {
          setSellerOrders([]);
        } else {
          const ords = await fetchMyOrders();
          setSellerOrders(Array.isArray(ords) ? ords : []);
        }
      } else if (panel === 'my-products') {
        if (!isSellerSubscribed) {
          setMyProducts([]);
        } else {
          const prods = await fetchMyProducts();
          setMyProducts(Array.isArray(prods) ? prods : []);
        }
      } else if (panel === 'subscriptions') {
        const [pkgs, summary] = await Promise.all([
          fetchAdminSubscriptionPackages({ audience: 'USER', include_inactive: false }).catch(() => []),
          fetchMyActiveSubscriptions().catch(() => null),
        ]);
        setSubPackages(Array.isArray(pkgs) ? pkgs : []);
        if (summary) setActiveSubData(summary);
      } else if (panel === 'grievance') {
        const res = await apiFetch('/api/v1/complaints', { method: 'GET', headers: getCustomerHeaders() });
        const json = await res.json().catch(() => ({}));
        const list = json?.data || json?.complaints || json?.items || (Array.isArray(json) ? json : []);
        setComplaints(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load section');
    } finally {
      setLoadingPanel(false);
    }
  };

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

      const orderRes = await apiFetch('/api/v1/wallet/topup/razorpay/order', {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify({ amount: num }),
      });
      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        throw new Error(orderData.detail || orderData.message || 'Failed to initiate wallet top-up');
      }

      const options = {
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
              headers: getCustomerHeaders(),
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              }),
            });
            if (!vRes.ok) throw new Error('Verification failed');
            setNoticeMsg(`₹${num} added to your wallet!`);
            setTopupAmount('');
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
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setErrorMsg(err.message || 'Wallet top-up failed');
      setToppingUp(false);
    }
  };

  const handleSubscribePlan = async (pkg) => {
    setSubscribingId(pkg.id || pkg.code);
    setErrorMsg('');
    setNoticeMsg('');
    try {
      await startCustomerRazorpaySubscription({ packageObj: pkg, customerUser });
      setNoticeMsg('₹500 Seller Plan activated! You can now create products and manage incoming orders.');
      await loadAccountOverview();
      await loadPanelData('subscriptions');
    } catch (err) {
      setErrorMsg(err.message || 'Subscription activation failed');
    } finally {
      setSubscribingId(null);
    }
  };

  const handleToggleProductLive = async (prod) => {
    try {
      const res = await apiFetch(`/api/v1/customer/products/${prod.id}`, {
        method: 'PUT',
        headers: getCustomerHeaders(),
        body: JSON.stringify({ is_active: !prod.is_active }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMyProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, is_active: updated.is_active } : p))
        );
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not toggle product');
    }
  };

  const handleDeleteMyProduct = async (productId) => {
    if (!window.confirm('Delete this product listing?')) return;
    try {
      const res = await apiFetch(`/api/v1/customer/products/${productId}`, {
        method: 'DELETE',
        headers: getCustomerHeaders(),
      });
      if (res.ok) {
        setMyProducts((prev) => prev.filter((p) => p.id !== productId));
        setNoticeMsg('Product deleted.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete product');
    }
  };

  const handleUpdateSellerOrderStatus = async (orderId, nextStatus) => {
    try {
      const res = await apiFetch(`/api/v1/customer/products/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getCustomerHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setSellerOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus, delivery_status: nextStatus } : o))
        );
        setNoticeMsg(`Order status updated to ${nextStatus}`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update order status');
    }
  };

  const handleDispatchOrder = async (e) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;
    try {
      const res = await apiFetch(`/api/v1/customer/products/orders/${dispatchModalOrder.id}/dispatch`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify(dispatchForm),
      });
      if (!res.ok) throw new Error('Dispatch update failed');
      setNoticeMsg(`Order #${dispatchModalOrder.order_code || dispatchModalOrder.id} marked as Shipped!`);
      setDispatchModalOrder(null);
      setDispatchForm({ courier_partner: '', tracking_number: '', tracking_url: '' });
      await loadPanelData('seller-orders');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch order');
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
        headers: getCustomerHeaders(),
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
      await loadPanelData('grievance');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit grievance');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleFullLogout = async () => {
    await logoutCustomerSession().catch(() => {});
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = customerUser?.name || user?.name || 'Customer';
  const displayEmail = customerUser?.email || user?.email || '';
  const initialChar = displayName.charAt(0).toUpperCase();

  const dispatchedOrders = sellerOrders.filter((o) => {
    const st = String(o.status || o.delivery_status || '').toUpperCase();
    return ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(st) || Boolean(o.tracking_number);
  });

  const menuRows = [
    {
      section: 'CUSTOMER ACCOUNT',
      items: [
        {
          id: 'profile',
          title: 'Customer Profile',
          sub: `Signed in as ${displayName}`,
          icon: HiUser,
          color: '#2563eb',
          bg: '#eff6ff',
        },
        {
          id: 'wallet',
          title: 'My Wallet',
          sub: `Balance: ₹${walletBalance} • Transactions & Add Money`,
          icon: HiCreditCard,
          color: '#0284c7',
          bg: '#e0f2fe',
        },
        {
          id: 'seller-orders',
          title: 'Customer Orders',
          sub: 'Manage incoming buyer orders (Requires ₹500 Plan)',
          badge: '₹500 PLAN',
          badgeColor: '#0369a1',
          badgeBg: '#e0f2fe',
          icon: HiShoppingBag,
          color: '#0369a1',
          bg: '#e0f2fe',
        },
        {
          id: 'dispatched',
          title: 'Dispatched & In Transit',
          sub: 'Live parcel & courier tracking (Requires ₹500 Plan)',
          badge: '₹500 PLAN',
          badgeColor: '#0369a1',
          badgeBg: '#e0f2fe',
          icon: HiOutlineTruck,
          color: '#059669',
          bg: '#d1fae5',
        },
        {
          id: 'my-products',
          title: 'My Products',
          sub: 'Add, manage & showcase items (Requires ₹500 Plan)',
          badge: '₹500 PLAN',
          badgeColor: '#0369a1',
          badgeBg: '#e0f2fe',
          icon: HiCube,
          color: '#0284c7',
          bg: '#e0f2fe',
        },
        {
          id: 'sell-ad',
          title: 'Sell / Post an Ad',
          sub: 'List your items for Kerala buyers',
          badge: '₹500 PLAN',
          badgeColor: '#0369a1',
          badgeBg: '#e0f2fe',
          icon: HiTag,
          color: '#059669',
          bg: '#d1fae5',
        },
        {
          id: 'subscriptions',
          title: 'Seller Plan & Subscriptions',
          sub: 'Unlock Marketplace selling & verified badge',
          badge: isSellerSubscribed ? 'ACTIVE' : 'UPGRADE',
          badgeColor: isSellerSubscribed ? '#15803d' : '#7e22ce',
          badgeBg: isSellerSubscribed ? '#dcfce7' : '#f3e8ff',
          icon: HiSparkles,
          color: '#7e22ce',
          bg: '#f3e8ff',
        },
      ],
    },
    {
      section: 'SUPPORT & GRIEVANCE',
      items: [
        {
          id: 'grievance',
          title: 'Report an Issue / Grievance',
          sub: 'Direct redressal with Logo App administration',
          icon: HiExclamationCircle,
          color: '#dc2626',
          bg: '#fee2e2',
        },
        {
          id: 'help',
          title: 'Help & Customer Support',
          sub: 'Explore company info, terms & privacy',
          icon: HiQuestionMarkCircle,
          color: '#2563eb',
          bg: '#eff6ff',
        },
      ],
    },
  ];

  const renderPlanLockCard = (title) => (
    <div style={{ textAlign: 'center', padding: '40px 24px', background: '#f8fafc', borderRadius: 16, border: '1.5px dashed #cbd5e1' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <HiLockClosed size={26} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{title} Requires ₹500 Seller Plan</h3>
      <p style={{ margin: '0 auto 20px', maxWidth: 420, fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
        Only customers subscribed to the active <strong>₹500 Seller Plan</strong> can create products, view Seller Products & Customer Orders, and dispatch parcels.
      </p>
      <button
        type="button"
        onClick={() => loadPanelData('subscriptions')}
        style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}
      >
        Unlock with ₹500 Seller Plan →
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 40 }}>
      {/* Blue Gradient Customer Hero Card (Exact Mobile App Parity) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 60%, #1e40af 100%)',
          borderRadius: 20,
          padding: '24px 26px',
          color: '#ffffff',
          boxShadow: '0 12px 32px rgba(37, 99, 235, 0.25)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              {initialChar}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ background: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em' }}>
                  CUSTOMER ACCOUNT
                </span>
                {isSellerSubscribed && (
                  <span style={{ background: '#fbbf24', color: '#78350f', padding: '3px 10px', borderRadius: 6, fontSize: 10.5, fontWeight: 800 }}>
                    ⭐ ₹500 SELLER ACTIVE
                  </span>
                )}
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{displayName}</h1>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{displayEmail}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/marketplace')}
            style={{
              background: '#ffffff',
              color: '#1d4ed8',
              border: 'none',
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <HiShoppingBag size={16} />
            <span>Open Marketplace</span>
          </button>
        </div>

        {/* 5 Quick Action Buttons inside Hero (Saved, Wallet, Orders, Sell, Log Out) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 10,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 14,
            padding: 12,
          }}
        >
          {[
            { label: 'Saved', icon: HiHeart, onClick: () => loadPanelData('saved'), active: activePanel === 'saved' },
            { label: 'Wallet', icon: HiCreditCard, onClick: () => loadPanelData('wallet'), active: activePanel === 'wallet' },
            { label: 'Orders', icon: HiShoppingBag, onClick: () => loadPanelData('buyer-orders'), active: activePanel === 'buyer-orders' },
            {
              label: 'Sell',
              icon: HiTag,
              onClick: () => {
                if (isSellerSubscribed) {
                  setIsAddProductOpen(true);
                } else {
                  loadPanelData('subscriptions');
                }
              },
              active: activePanel === 'my-products',
            },
            { label: 'Log Out', icon: HiLogout, onClick: handleFullLogout, active: false },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              style={{
                background: btn.active ? '#ffffff' : 'rgba(255,255,255,0.12)',
                color: btn.active ? '#1d4ed8' : '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <btn.icon size={18} />
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Responsive Mobile-App Account Layout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        {/* Left Navigation Menu matching Screenshot 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: '1 1 310px', maxWidth: 380, width: '100%' }}>
          {menuRows.map((group) => (
            <div key={group.section} style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>
                {group.section}
              </div>
              <div>
                {group.items.map((item, idx) => {
                  const isActive = activePanel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.id === 'sell-ad') {
                          if (isSellerSubscribed) {
                            setIsAddProductOpen(true);
                          } else {
                            loadPanelData('subscriptions');
                          }
                          return;
                        }
                        loadPanelData(item.id);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '13px 16px',
                        border: 'none',
                        borderBottom: idx < group.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: isActive ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <item.icon size={19} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{item.title}</span>
                          {item.badge && (
                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: item.badgeBg, color: item.badgeColor }}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.sub}
                        </div>
                      </div>
                      <HiChevronRight size={17} color="#94a3b8" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Workspace Panel */}
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, minHeight: 420, flex: '2 1 420px', minWidth: 0, width: '100%' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Customer Profile</h2>
                <button
                  type="button"
                  onClick={loadAccountOverview}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <HiRefresh size={14} />
                  Refresh
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                {[
                  { label: 'Full Name', value: customerUser?.name || '-' },
                  { label: 'Email Address', value: customerUser?.email || '-' },
                  { label: 'Mobile Phone', value: customerUser?.phone || '-' },
                  { label: 'Customer Code', value: customerUser?.user_code || '-' },
                  { label: 'Login ID', value: customerUser?.login_id || '-' },
                  { label: 'District / City', value: [customerUser?.city, customerUser?.district].filter(Boolean).join(', ') || 'Not set' },
                  { label: 'Wallet Balance', value: `₹${walletBalance}` },
                  { label: '₹500 Seller Plan', value: isSellerSubscribed ? 'Active (Unlocked)' : 'Not Subscribed' },
                ].map((field) => (
                  <div key={field.label} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 3 }}>{field.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{field.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : activePanel === 'wallet' ? (
            <div>
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>My Wallet</h2>
              <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', color: '#fff', borderRadius: 16, padding: 22, marginBottom: 20 }}>
                <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 700 }}>AVAILABLE WALLET BALANCE</div>
                <div style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 16px' }}>₹{walletBalance}</div>
                <form onSubmit={handleWalletRazorpayTopup} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    min="10"
                    placeholder="Enter amount (₹)"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    style={{ flex: 1, minWidth: 160, padding: '10px 12px', borderRadius: 8, border: 'none', color: '#0f172a', fontWeight: 700 }}
                  />
                  <button
                    type="submit"
                    disabled={toppingUp}
                    style={{ background: '#ffffff', color: '#1d4ed8', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {toppingUp ? 'Opening Razorpay...' : '+ Add Money (Razorpay)'}
                  </button>
                </form>
              </div>

              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#334155' }}>Recent Transactions</h4>
              {walletTxns.length === 0 ? (
                <p style={{ fontSize: 13, color: '#64748b' }}>No wallet transactions yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {walletTxns.map((tx, idx) => {
                    const isCredit = String(tx.transaction_type || tx.type || '').toUpperCase().includes('CREDIT') || Number(tx.amount) > 0;
                    return (
                      <div key={tx.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isCredit ? <HiArrowDown size={18} color="#16a34a" /> : <HiArrowUp size={18} color="#dc2626" />}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{tx.description || tx.note || tx.transaction_type || 'Wallet Transaction'}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN') : ''}</div>
                          </div>
                        </div>
                        <strong style={{ fontSize: 14, color: isCredit ? '#16a34a' : '#dc2626' }}>
                          {isCredit ? '+' : ''}₹{Math.abs(Number(tx.amount || 0)).toLocaleString('en-IN')}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activePanel === 'saved' ? (
            <div>
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>My Saved Products</h2>
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
                              loadPanelData('saved');
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
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>My Orders & Live Tracking</h2>
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
            !isSellerSubscribed ? (
              renderPlanLockCard(activePanel === 'dispatched' ? 'Dispatched & In Transit' : 'Customer Orders')
            ) : (
              <div>
                <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {activePanel === 'dispatched' ? 'Dispatched & In Transit Parcels' : 'Incoming Customer Orders'}
                </h2>
                {(activePanel === 'dispatched' ? dispatchedOrders : sellerOrders).length === 0 ? (
                  <p style={{ fontSize: 13, color: '#64748b' }}>No orders in this category yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(activePanel === 'dispatched' ? dispatchedOrders : sellerOrders).map((ord) => (
                      <div key={ord.id} style={{ padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                              #{ord.order_code || ord.id} — {ord.product_name}
                            </div>
                            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                              Buyer: {ord.buyer_name} ({ord.buyer_phone}) • ₹{Number(ord.total_price ?? ord.total_amount ?? 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b' }}>
                              {ord.buyer_address}, {ord.buyer_city}, {ord.buyer_district} - {ord.buyer_pincode}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <select
                              value={String(ord.status || ord.delivery_status || 'PLACED').toUpperCase()}
                              onChange={(e) => handleUpdateSellerOrderStatus(ord.id, e.target.value)}
                              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
                            >
                              {ORDER_STATUS_CHOICES.map((st) => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setDispatchModalOrder(ord);
                                setDispatchForm({
                                  courier_partner: ord.courier_partner || '',
                                  tracking_number: ord.tracking_number || '',
                                  tracking_url: ord.tracking_url || '',
                                });
                              }}
                              style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Dispatch Info
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : activePanel === 'my-products' ? (
            !isSellerSubscribed ? (
              renderPlanLockCard('My Products')
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>My Products ({myProducts.length})</h2>
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <HiPlus size={16} />
                    Create Product
                  </button>
                </div>
                {myProducts.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#64748b' }}>No products created yet. Click "+ Create Product" to list items.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                    {myProducts.map((p) => (
                      <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{p.category}</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#2563eb', marginBottom: 10 }}>₹{Number(p.price || 0).toLocaleString('en-IN')}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={() => handleToggleProductLive(p)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid #e2e8f0', background: p.is_active ? '#ecfdf5' : '#f8fafc', color: p.is_active ? '#15803d' : '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            <HiEye size={13} style={{ verticalAlign: 'middle' }} /> {p.is_active ? 'Live' : 'Hidden'}
                          </button>
                          <button type="button" onClick={() => handleDeleteMyProduct(p.id)} style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            <HiTrash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : activePanel === 'subscriptions' ? (
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Seller Plan & Subscriptions</h2>
              <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748b' }}>
                Subscribe to the ₹500 Seller Plan using the same Razorpay checkout as the mobile app to create products and manage incoming orders.
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
                        await loadAccountOverview();
                        await loadPanelData('subscriptions');
                      }}
                      style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Cancel Plan
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {(subPackages.length > 0 ? subPackages : [{ id: 'default-500', code: 'USER_SELLER_500', name: '₹500 Seller Plan', amount: 500, duration_days: 30, description: 'Unlock product creation & incoming customer orders on Logo Marketplace.' }]).map((pkg) => (
                  <div key={pkg.id || pkg.code} style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{pkg.name}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#2563eb', margin: '8px 0' }}>
                      ₹{Number(pkg.amount || 500).toLocaleString('en-IN')}
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
                ))}
              </div>
            </div>
          ) : activePanel === 'grievance' ? (
            <div>
              <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Report an Issue / Grievance</h2>
              <form onSubmit={handleSubmitComplaint} style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <input
                    type="text"
                    required
                    placeholder="Issue Subject *"
                    value={complaintForm.subject}
                    onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                    style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  >
                    <option value="Order / Delivery Issue">Order / Delivery Issue</option>
                    <option value="Payment / Wallet Issue">Payment / Wallet Issue</option>
                    <option value="Product / Seller Report">Product / Seller Report</option>
                    <option value="App / Account Support">App / Account Support</option>
                  </select>
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your grievance in detail..."
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, marginBottom: 12 }}
                />
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
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
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#e0f2fe', color: '#0369a1' }}>
                          {c.status || 'OPEN'}
                        </span>
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
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Min order ₹150. Free delivery above ₹499. Instant online payment via Razorpay or Cash on Delivery (+₹40 below ₹500).</p>
                </div>
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: 13, color: '#0f172a' }}>Need Direct Administration Help?</strong>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Use "Report an Issue / Grievance" on the left to file a ticket with Logo App Admin.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Modal for ₹500 Subscribed Seller */}
      {dispatchModalOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form onSubmit={handleDispatchOrder} style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Dispatch Order #{dispatchModalOrder.order_code || dispatchModalOrder.id}</h3>
            <input
              type="text"
              required
              placeholder="Courier Partner (e.g. DTDC / Speed Post)"
              value={dispatchForm.courier_partner}
              onChange={(e) => setDispatchForm({ ...dispatchForm, courier_partner: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 10 }}
            />
            <input
              type="text"
              required
              placeholder="Tracking Number / AWB"
              value={dispatchForm.tracking_number}
              onChange={(e) => setDispatchForm({ ...dispatchForm, tracking_number: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 10 }}
            />
            <input
              type="url"
              placeholder="Tracking URL (Optional)"
              value={dispatchForm.tracking_url}
              onChange={(e) => setDispatchForm({ ...dispatchForm, tracking_url: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setDispatchModalOrder(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700 }}>Cancel</button>
              <button type="submit" style={{ flex: 1.4, padding: 10, borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 800 }}>Mark Dispatched</button>
            </div>
          </form>
        </div>
      )}

      {/* ₹500 Subscribed Customer Create Product Modal */}
      <CustomerAddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        customerUser={customerUser}
        onProductCreated={() => {
          setNoticeMsg('Product created successfully!');
          loadPanelData('my-products');
        }}
      />
    </div>
  );
}
