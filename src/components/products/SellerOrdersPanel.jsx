import React, { useEffect, useMemo, useState } from 'react';
import {
  HiSearch,
  HiOutlineTruck,
  HiCheckCircle,
  HiCash,
  HiShieldCheck,
  HiCube,
  HiPhone,
  HiExternalLink,
  HiClipboardCopy,
  HiXCircle,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import {
  fetchSellerAnalytics,
  dispatchSellerOrder,
  updateSellerOrderStatus,
  formatMediaUrl,
} from '../../api/productApi';

const COURIER_PARTNERS = [
  { name: 'India Post (Speed Post)', defaultUrl: 'https://www.indiapost.gov.in' },
  { name: 'DTDC Express', defaultUrl: 'https://www.dtdc.in/tracking.asp' },
  { name: 'Delhivery', defaultUrl: 'https://www.delhivery.com/tracking' },
  { name: 'The Professional Couriers', defaultUrl: 'https://www.tpcindia.com' },
  { name: 'ST Courier', defaultUrl: 'https://stcourier.com/track' },
  { name: 'Blue Dart', defaultUrl: 'https://www.bluedart.com/tracking' },
  { name: 'Trackon Couriers', defaultUrl: 'https://trackon.in' },
  { name: 'Self / Local Handover', defaultUrl: '' },
];

const CANCELLATION_REASONS = [
  { id: 'out_of_stock', label: 'Out of Stock / Damaged', text: 'Item is out of stock or damaged and cannot be fulfilled at this time.' },
  { id: 'unserviceable', label: 'Location Unserviceable', text: 'Delivery address/location is unserviceable by our courier partners.' },
  { id: 'customer_request', label: 'Customer Requested', text: 'Order cancelled per customer request.' },
  { id: 'pricing_error', label: 'Price / Listing Error', text: 'Order cancelled due to an accidental pricing or listing error.' },
  { id: 'dispatch_delay', label: 'Unable to Dispatch in Time', text: 'Unable to dispatch within expected timeframe due to supply delay.' },
  { id: 'other', label: 'Other Reason', text: '' },
];

function getStatusBadge(status = 'PLACED') {
  const st = String(status || 'PLACED').toUpperCase();
  if (st === 'PLACED' || st === 'NEW' || st === 'PENDING') {
    return { label: 'New Order', bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
  }
  if (st === 'CONFIRMED' || st === 'CONTACTED' || st === 'PACKED') {
    return { label: 'Confirmed', bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' };
  }
  if (st === 'SHIPPED' || st === 'IN_TRANSIT' || st === 'OUT_FOR_DELIVERY') {
    return { label: st === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 'Shipped', bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' };
  }
  if (st === 'DELIVERED') {
    return { label: 'Delivered', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
  }
  if (st === 'CANCELLED') {
    return { label: 'Cancelled', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
  }
  return { label: st, bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
}

function getPaymentMeta(order) {
  const pStatus = String(order?.payment_status || '').toUpperCase();
  const pMethod = String(order?.payment_method || '').toUpperCase();
  const isOnline = pStatus === 'PAID' || pMethod === 'ONLINE' || pMethod === 'RAZORPAY' || pMethod === 'UPI';
  if (isOnline) {
    return {
      isOnline: true,
      label: pStatus === 'PAID' ? 'PAID ONLINE (Prepaid)' : 'ONLINE (Razorpay)',
      bg: '#dcfce7',
      color: '#15803d',
      border: '#86efac',
      hint: pStatus === 'PAID' ? 'Prepaid · Do Not Collect Cash' : 'Online Payment Selected',
    };
  }
  return {
    isOnline: false,
    label: 'CASH ON DELIVERY (COD)',
    bg: '#fef3c7',
    color: '#b45309',
    border: '#fde68a',
    hint: `Collect ₹${Number(order?.total_price ?? order?.total_amount ?? 0).toFixed(2)} Cash`,
  };
}

export default function SellerOrdersPanel({
  mode = 'orders', // 'orders' | 'dispatched'
  sellerOrders = [],
  setSellerOrders,
  buyerOrders = [],
  ordersSubTab = 'seller',
  setOrdersSubTab,
  isSellerSubscribed = false,
  renderPlanLockCard,
  navigate,
  onReload,
  setNoticeMsg,
  setErrorMsg,
}) {
  const [analyticsPeriod, setAnalyticsPeriod] = useState('all');
  const [serverAnalytics, setServerAnalytics] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // For orders: ALL/NEW/CONTACTED/SHIPPED/DELIVERED/CANCELLED; dispatched: ALL/IN_TRANSIT/DELIVERED
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // ALL | ONLINE | COD
  const [searchQuery, setSearchQuery] = useState('');

  // Dispatch Modal
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({
    courier_partner: COURIER_PARTNERS[0].name,
    tracking_number: '',
    tracking_url: COURIER_PARTNERS[0].defaultUrl,
    note: '',
  });
  const [dispatching, setDispatching] = useState(false);

  // Cancel Reason Modal
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReasonId, setCancelReasonId] = useState(CANCELLATION_REASONS[0].id);
  const [cancelReasonText, setCancelReasonText] = useState(CANCELLATION_REASONS[0].text);
  const [cancelling, setCancelling] = useState(false);

  const loadAnalytics = async (period = analyticsPeriod) => {
    const data = await fetchSellerAnalytics(period);
    if (data) setServerAnalytics(data);
  };

  useEffect(() => {
    if (isSellerSubscribed && mode === 'orders') {
      loadAnalytics(analyticsPeriod);
    }
  }, [isSellerSubscribed, mode, analyticsPeriod, sellerOrders.length]);

  useEffect(() => {
    setStatusFilter('ALL');
    setPaymentFilter('ALL');
    setSearchQuery('');
  }, [mode]);

  // Analytics numbers (exact SellerOrdersModal parity + Online/COD counts)
  const analytics = useMemo(() => {
    let onlineCount = 0;
    let codCount = 0;
    let totalSales = 0;
    let onlinePaid = 0;
    let codPending = 0;
    let newO = 0;
    let contactedO = 0;
    let shippedO = 0;
    let deliveredO = 0;
    let cancelledO = 0;

    (sellerOrders || []).forEach((o) => {
      const st = String(o.status || o.delivery_status || 'PLACED').toUpperCase();
      const amt = Number(o.total_price ?? o.total_amount ?? 0);
      const pm = getPaymentMeta(o);

      if (st === 'CANCELLED') cancelledO += 1;
      else if (st === 'DELIVERED') deliveredO += 1;
      else if (['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(st)) shippedO += 1;
      else if (['CONFIRMED', 'CONTACTED', 'PACKED'].includes(st)) contactedO += 1;
      else newO += 1;

      if (st !== 'CANCELLED') {
        totalSales += amt;
        if (pm.isOnline) {
          onlineCount += 1;
          onlinePaid += amt;
        } else {
          codCount += 1;
          if (st !== 'DELIVERED') codPending += amt;
        }
      }
    });

    if (serverAnalytics) {
      return {
        totalSales: Number(serverAnalytics.total_sales ?? totalSales),
        onlinePaid: Number(serverAnalytics.online_paid ?? onlinePaid),
        codPending: Number(serverAnalytics.cod_to_collect ?? codPending),
        totalOrders: Number(serverAnalytics.total_orders ?? sellerOrders.length),
        onlineCount: Number(serverAnalytics.online_orders_count ?? onlineCount),
        codCount: Number(serverAnalytics.cod_orders_count ?? codCount),
        newO: Number(serverAnalytics.pipeline?.new_orders ?? newO),
        contactedO: Number(serverAnalytics.pipeline?.contacted_orders ?? contactedO),
        shippedO: Number(serverAnalytics.pipeline?.shipped_orders ?? shippedO),
        deliveredO: Number(serverAnalytics.pipeline?.delivered_orders ?? deliveredO),
        cancelledO: Number(serverAnalytics.pipeline?.cancelled_orders ?? cancelledO),
      };
    }

    return {
      totalSales,
      onlinePaid,
      codPending,
      totalOrders: sellerOrders.length,
      onlineCount,
      codCount,
      newO,
      contactedO,
      shippedO,
      deliveredO,
      cancelledO,
    };
  }, [sellerOrders, serverAnalytics]);

  const dispatchedOrders = useMemo(
    () =>
      (sellerOrders || []).filter((o) => {
        const st = String(o.status || o.delivery_status || '').toUpperCase();
        return ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(st) || Boolean(o.tracking_number);
      }),
    [sellerOrders]
  );

  const dispatchedCounts = useMemo(() => {
    let inTransit = 0;
    let delivered = 0;
    dispatchedOrders.forEach((o) => {
      const st = String(o.status || '').toUpperCase();
      if (st === 'DELIVERED') delivered += 1;
      else inTransit += 1;
    });
    return { all: dispatchedOrders.length, inTransit, delivered };
  }, [dispatchedOrders]);

  const filteredList = useMemo(() => {
    let list = mode === 'dispatched' ? [...dispatchedOrders] : [...(sellerOrders || [])];

    if (mode === 'dispatched') {
      if (statusFilter === 'IN_TRANSIT') {
        list = list.filter((o) => String(o.status || '').toUpperCase() !== 'DELIVERED');
      } else if (statusFilter === 'DELIVERED') {
        list = list.filter((o) => String(o.status || '').toUpperCase() === 'DELIVERED');
      }
    } else {
      if (statusFilter === 'NEW') {
        list = list.filter((o) => ['PLACED', 'NEW', 'PENDING'].includes(String(o.status || '').toUpperCase()));
      } else if (statusFilter === 'CONTACTED') {
        list = list.filter((o) => ['CONFIRMED', 'CONTACTED', 'PACKED'].includes(String(o.status || '').toUpperCase()));
      } else if (statusFilter === 'SHIPPED') {
        list = list.filter((o) => ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(String(o.status || '').toUpperCase()));
      } else if (statusFilter === 'DELIVERED') {
        list = list.filter((o) => String(o.status || '').toUpperCase() === 'DELIVERED');
      } else if (statusFilter === 'CANCELLED') {
        list = list.filter((o) => String(o.status || '').toUpperCase() === 'CANCELLED');
      }

      if (paymentFilter === 'ONLINE') {
        list = list.filter((o) => getPaymentMeta(o).isOnline);
      } else if (paymentFilter === 'COD') {
        list = list.filter((o) => !getPaymentMeta(o).isOnline);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          (o.order_code || '').toLowerCase().includes(q) ||
          (o.product_name || '').toLowerCase().includes(q) ||
          (o.buyer_name || '').toLowerCase().includes(q) ||
          (o.buyer_phone || '').toLowerCase().includes(q) ||
          (o.tracking_number || '').toLowerCase().includes(q) ||
          (o.courier_partner || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [mode, sellerOrders, dispatchedOrders, statusFilter, paymentFilter, searchQuery]);

  const handleStatusChange = async (orderId, nextStatus, notes = '') => {
    setErrorMsg('');
    try {
      const updated = await updateSellerOrderStatus(orderId, nextStatus, notes, notes);
      setSellerOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...(updated || {}), status: nextStatus } : o))
      );
      setNoticeMsg(`Order updated to ${nextStatus}.`);
      loadAnalytics(analyticsPeriod);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update order status.');
    }
  };

  const openDispatchModal = (ord) => {
    const partner = ord.courier_partner || COURIER_PARTNERS[0].name;
    const matched = COURIER_PARTNERS.find((c) => c.name === partner);
    setDispatchModalOrder(ord);
    setDispatchForm({
      courier_partner: partner,
      tracking_number: ord.tracking_number || '',
      tracking_url: ord.tracking_url || matched?.defaultUrl || COURIER_PARTNERS[0].defaultUrl,
      note: '',
    });
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;
    setDispatching(true);
    setErrorMsg('');
    try {
      const updated = await dispatchSellerOrder(dispatchModalOrder.id, {
        courier_partner: dispatchForm.courier_partner.trim() || COURIER_PARTNERS[0].name,
        tracking_number: dispatchForm.tracking_number.trim(),
        tracking_url: dispatchForm.tracking_url.trim() || undefined,
        event: 'IN_TRANSIT',
        note: dispatchForm.note.trim() || `Dispatched via ${dispatchForm.courier_partner}`,
      });
      setSellerOrders((prev) =>
        prev.map((o) =>
          o.id === dispatchModalOrder.id
            ? {
                ...o,
                ...(updated || {}),
                courier_partner: dispatchForm.courier_partner.trim(),
                tracking_number: dispatchForm.tracking_number.trim(),
                tracking_url: dispatchForm.tracking_url.trim(),
                status: 'SHIPPED',
              }
            : o
        )
      );
      setNoticeMsg(`Order #${dispatchModalOrder.order_code || dispatchModalOrder.id} dispatched via ${dispatchForm.courier_partner}!`);
      setDispatchModalOrder(null);
      if (onReload) onReload();
    } catch (err) {
      setErrorMsg(err.message || 'Dispatch update failed.');
    } finally {
      setDispatching(false);
    }
  };

  const handleCancelOrderSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    setCancelling(true);
    const reasonText = cancelReasonText.trim() || 'Cancelled by seller';
    await handleStatusChange(cancelModalOrder.id, 'CANCELLED', reasonText);
    setCancelling(false);
    setCancelModalOrder(null);
  };

  const openWhatsAppTracking = (ord) => {
    const cleanPhone = String(ord.buyer_phone || '').replace(/[^0-9]/g, '');
    const withCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Hello ${ord.buyer_name || 'Customer'},\n\nYour order #${ord.order_code} for "${ord.product_name}" has been DISPATCHED!\nCourier: ${ord.courier_partner || 'Courier Partner'}\nAWB Tracking: ${ord.tracking_number || 'Pending'}${ord.tracking_url ? `\nTrack: ${ord.tracking_url}` : ''}\n\nThank you for shopping on Logo App!`;
    window.open(withCountry ? `https://wa.me/${withCountry}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div>
      {mode === 'orders' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setOrdersSubTab('seller')}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              background: ordersSubTab === 'seller' ? '#2563eb' : '#f1f5f9',
              color: ordersSubTab === 'seller' ? '#fff' : '#334155',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Incoming Customer Orders ({sellerOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setOrdersSubTab('buyer')}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              background: ordersSubTab === 'buyer' ? '#2563eb' : '#f1f5f9',
              color: ordersSubTab === 'buyer' ? '#fff' : '#334155',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            My Placed Purchases ({buyerOrders.length})
          </button>
        </div>
      )}

      {mode === 'orders' && ordersSubTab === 'buyer' ? (
        buyerOrders.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748b' }}>You have not placed any marketplace orders yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {buyerOrders.map((ord) => {
              const amt = Number(ord.total_price ?? ord.total_amount ?? ord.unit_price ?? ord.price ?? 0);
              return (
                <div key={ord.id || ord.order_code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>#{ord.order_code || ord.id} — {ord.product_name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      Qty: {ord.quantity || 1} · ₹{amt.toLocaleString('en-IN')} · Status: <strong>{ord.status || ord.delivery_status}</strong>
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate(`/order/${ord.id || ord.order_code}`)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Track Order →
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : !isSellerSubscribed ? (
        renderPlanLockCard(mode === 'dispatched' ? 'Dispatched & In Transit' : 'Customer Orders')
      ) : (
        <div>
          {/* Header & Period Analytics Overview */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0f172a' }}>
                {mode === 'dispatched' ? `Dispatched & In Transit (${dispatchedOrders.length})` : `Customer Orders (${sellerOrders.length})`}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
                {mode === 'dispatched'
                  ? 'Live parcel tracking numbers, courier partners & delivery completion'
                  : 'Incoming buyer orders, Online vs COD breakdown & fulfillment status'}
              </p>
            </div>

            {mode === 'orders' && (
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'all', label: 'All Time' },
                  { key: 'this_month', label: 'This Month' },
                  { key: 'this_year', label: 'This Year' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setAnalyticsPeriod(p.key)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 999,
                      border: 'none',
                      background: analyticsPeriod === p.key ? '#1e40af' : '#f1f5f9',
                      color: analyticsPeriod === p.key ? '#fff' : '#475569',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile SellerOrdersModal Exact 4 Analytics Cards */}
          {mode === 'orders' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 18 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #bfdbfe', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#1e3a8a' }}>Total Lifetime Sales</span>
                  <HiCube size={16} color="#2563eb" />
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
                  ₹{analytics.totalSales.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Across {analytics.totalOrders} total orders</div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#166534' }}>Online Paid (Prepaid)</span>
                  <HiShieldCheck size={16} color="#15803d" />
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#15803d', margin: '4px 0' }}>
                  ₹{analytics.onlinePaid.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: '#15803d', fontWeight: 700 }}>
                  {analytics.onlineCount} Online Order{analytics.onlineCount === 1 ? '' : 's'}
                </div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#92400e' }}>COD Cash to Collect</span>
                  <HiCash size={16} color="#b45309" />
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#b45309', margin: '4px 0' }}>
                  ₹{analytics.codPending.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: '#b45309', fontWeight: 700 }}>
                  {analytics.codCount} COD Order{analytics.codCount === 1 ? '' : 's'}
                </div>
              </div>

              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#6b21a8' }}>Order Pipeline</span>
                  <HiOutlineTruck size={16} color="#7e22ce" />
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#7e22ce', margin: '4px 0' }}>
                  {analytics.totalOrders} Orders
                </div>
                <div style={{ fontSize: 11, color: '#7e22ce' }}>
                  {analytics.newO} New · {analytics.contactedO} Confirmed · {analytics.shippedO} Shipped · {analytics.deliveredO} Delivered
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs + Search Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(mode === 'dispatched'
                ? [
                    { key: 'ALL', label: `All Dispatched (${dispatchedCounts.all})` },
                    { key: 'IN_TRANSIT', label: `In Transit (${dispatchedCounts.inTransit})` },
                    { key: 'DELIVERED', label: `Delivered (${dispatchedCounts.delivered})` },
                  ]
                : [
                    { key: 'ALL', label: `All (${analytics.totalOrders})` },
                    { key: 'NEW', label: `New (${analytics.newO})` },
                    { key: 'CONTACTED', label: `Confirmed (${analytics.contactedO})` },
                    { key: 'SHIPPED', label: `Shipped (${analytics.shippedO})` },
                    { key: 'DELIVERED', label: `Delivered (${analytics.deliveredO})` },
                    { key: 'CANCELLED', label: `Cancelled (${analytics.cancelledO})` },
                  ]
              ).map((tab) => {
                const active = statusFilter === tab.key;
                const isRed = tab.key === 'CANCELLED';
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: active ? 'none' : `1px solid ${isRed ? '#fecaca' : '#e2e8f0'}`,
                      background: active ? (isRed ? '#dc2626' : '#2563eb') : '#ffffff',
                      color: active ? '#ffffff' : isRed ? '#dc2626' : '#475569',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {mode === 'orders' && (
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, color: '#334155' }}
                >
                  <option value="ALL">All Payments</option>
                  <option value="ONLINE">Online Paid ({analytics.onlineCount})</option>
                  <option value="COD">COD ({analytics.codCount})</option>
                </select>
              )}

              <div style={{ position: 'relative', minWidth: 210 }}>
                <HiSearch size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 10 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={mode === 'dispatched' ? 'Search AWB, buyer, code...' : 'Search buyer, phone, code...'}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 30px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 12.5 }}
                />
              </div>
            </div>
          </div>

          {/* Order Cards List */}
          {filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 14, border: '1px dashed #cbd5e1' }}>
              <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#334155' }}>
                {mode === 'dispatched' ? 'No Dispatched Parcels Yet' : 'No Matching Orders'}
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
                {mode === 'dispatched'
                  ? 'When you dispatch an order with a courier partner and AWB tracking number, it appears here.'
                  : 'Incoming buyer orders for your listed products will appear here automatically.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredList.map((ord) => {
                const stBadge = getStatusBadge(ord.status || ord.delivery_status);
                const pMeta = getPaymentMeta(ord);
                const normStatus = String(ord.status || ord.delivery_status || 'PLACED').toUpperCase();
                const isCancelled = normStatus === 'CANCELLED';
                const isDelivered = normStatus === 'DELIVERED';
                const totalAmt = Number(ord.total_price ?? ord.total_amount ?? 0);

                return (
                  <div
                    key={ord.id}
                    style={{
                      padding: 16,
                      background: isCancelled ? '#fef2f2' : '#ffffff',
                      borderRadius: 14,
                      border: `1px solid ${isCancelled ? '#fecaca' : '#e2e8f0'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {/* Header: Code, Date & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 900, color: '#0f172a' }}>
                          #{ord.order_code || ord.id}
                        </span>
                        <span style={{ fontSize: 11.5, color: '#64748b' }}>
                          {ord.created_at ? new Date(ord.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: stBadge.bg,
                          color: stBadge.color,
                          border: `1px solid ${stBadge.border}`,
                        }}
                      >
                        {stBadge.label}
                      </span>
                    </div>

                    {/* Payment Badge Strip */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 12px', borderRadius: 10, background: pMeta.bg, border: `1px solid ${pMeta.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: pMeta.color }}>
                        {pMeta.isOnline ? <HiShieldCheck size={16} /> : <HiCash size={16} />}
                        <span>{pMeta.label}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: pMeta.color }}>{pMeta.hint}</span>
                    </div>

                    {/* Product Thumbnail + Details + Buyer */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, background: '#f8fafc', borderRadius: 10 }}>
                        <img
                          src={ord.product_image ? formatMediaUrl(ord.product_image) : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                          alt={ord.product_name}
                          style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#e2e8f0' }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{ord.product_name || 'Product'}</div>
                          <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                            {ord.selected_size ? `Size: ${ord.selected_size} · ` : ''}
                            Qty: {ord.quantity || 1}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#2563eb', marginTop: 2 }}>
                            ₹{totalAmt.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: 10, background: '#f8fafc', borderRadius: 10, fontSize: 12.5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <strong style={{ color: '#0f172a' }}>{ord.buyer_name || 'Customer'}</strong>
                          {ord.buyer_phone && (
                            <a href={`tel:${ord.buyer_phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
                              <HiPhone size={13} />
                              {ord.buyer_phone}
                            </a>
                          )}
                        </div>
                        <div style={{ color: '#475569', lineHeight: 1.5 }}>
                          {[ord.buyer_address, ord.buyer_city, ord.buyer_district, ord.buyer_pincode ? `PIN: ${ord.buyer_pincode}` : '']
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Courier Tracking Strip if set */}
                    {(ord.courier_partner || ord.tracking_number) && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '8px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, fontSize: 12 }}>
                        <div>
                          <strong style={{ color: '#5b21b6' }}>{ord.courier_partner || 'Courier'}</strong>
                          {ord.tracking_number && (
                            <span style={{ marginLeft: 8, fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>
                              AWB: {ord.tracking_number}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {ord.tracking_number && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(ord.tracking_number);
                                setNoticeMsg(`AWB #${ord.tracking_number} copied!`);
                              }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid #c4b5fd', background: '#fff', color: '#6d28d9', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              <HiClipboardCopy size={13} /> Copy AWB
                            </button>
                          )}
                          {ord.tracking_url && (
                            <a
                              href={ord.tracking_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}
                            >
                              Track Link <HiExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cancellation Note if Cancelled */}
                    {isCancelled && ord.cancellation_reason && (
                      <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                        Cancellation Reason: {ord.cancellation_reason}
                      </div>
                    )}

                    {/* Action Buttons Strip */}
                    {!isCancelled && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
                        {normStatus === 'PLACED' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(ord.id, 'CONFIRMED')}
                            style={{ padding: '7px 13px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                          >
                            Confirm Order
                          </button>
                        )}
                        {!isDelivered && (
                          <button
                            type="button"
                            onClick={() => openDispatchModal(ord)}
                            style={{ padding: '7px 13px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <HiOutlineTruck size={14} />
                            {ord.tracking_number ? 'Edit Courier / AWB' : 'Dispatch Order'}
                          </button>
                        )}
                        {(normStatus === 'SHIPPED' || normStatus === 'OUT_FOR_DELIVERY') && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(ord.id, 'DELIVERED')}
                            style={{ padding: '7px 13px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <HiCheckCircle size={14} /> Mark Delivered
                          </button>
                        )}
                        {mode === 'dispatched' && (
                          <button
                            type="button"
                            onClick={() => openWhatsAppTracking(ord)}
                            style={{ padding: '7px 13px', borderRadius: 8, border: 'none', background: '#15803d', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            <FaWhatsapp size={14} /> WhatsApp Tracking
                          </button>
                        )}
                        {!isDelivered && normStatus !== 'SHIPPED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancelModalOrder(ord);
                              setCancelReasonId(CANCELLATION_REASONS[0].id);
                              setCancelReasonText(CANCELLATION_REASONS[0].text);
                            }}
                            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <HiXCircle size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Courier Dispatch Modal */}
      {dispatchModalOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form onSubmit={handleDispatchSubmit} style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 460, width: '100%' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
              Dispatch Order #{dispatchModalOrder.order_code || dispatchModalOrder.id}
            </h3>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Courier Partner *</label>
            <select
              value={dispatchForm.courier_partner}
              onChange={(e) => {
                const chosen = e.target.value;
                const matched = COURIER_PARTNERS.find((c) => c.name === chosen);
                setDispatchForm((prev) => ({
                  ...prev,
                  courier_partner: chosen,
                  tracking_url: matched?.defaultUrl || prev.tracking_url,
                }));
              }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 10 }}
            >
              {COURIER_PARTNERS.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Tracking Number / AWB *</label>
            <input
              type="text"
              required
              minLength={3}
              placeholder="e.g. EK123456789IN"
              value={dispatchForm.tracking_number}
              onChange={(e) => setDispatchForm({ ...dispatchForm, tracking_number: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 10 }}
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Live Tracking URL (Optional)</label>
            <input
              type="url"
              placeholder="https://..."
              value={dispatchForm.tracking_url}
              onChange={(e) => setDispatchForm({ ...dispatchForm, tracking_url: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 10 }}
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Note for Buyer (Optional)</label>
            <input
              type="text"
              placeholder="Dispatched via courier..."
              value={dispatchForm.note}
              onChange={(e) => setDispatchForm({ ...dispatchForm, note: e.target.value })}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: 16 }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setDispatchModalOrder(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button type="submit" disabled={dispatching} style={{ flex: 1.4, padding: 10, borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                {dispatching ? 'Saving...' : 'Mark Dispatched →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel Order Reason Modal */}
      {cancelModalOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form onSubmit={handleCancelOrderSubmit} style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 460, width: '100%' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 900, color: '#dc2626' }}>
              Cancel Order #{cancelModalOrder.order_code || cancelModalOrder.id}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {CANCELLATION_REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setCancelReasonId(r.id);
                    setCancelReasonText(r.text);
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: `1px solid ${cancelReasonId === r.id ? '#dc2626' : '#cbd5e1'}`,
                    background: cancelReasonId === r.id ? '#fef2f2' : '#fff',
                    color: cancelReasonId === r.id ? '#dc2626' : '#334155',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              required
              rows={3}
              value={cancelReasonText}
              onChange={(e) => setCancelReasonText(e.target.value)}
              placeholder="Reason for cancelling order (restores product stock)..."
              style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, marginBottom: 14 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setCancelModalOrder(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Keep Order
              </button>
              <button type="submit" disabled={cancelling} style={{ flex: 1.4, padding: 10, borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                {cancelling ? 'Cancelling...' : 'Confirm Cancel & Restore Stock'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
