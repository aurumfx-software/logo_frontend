import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiChevronLeft,
  HiCheckCircle,
  HiOutlineTruck,
  HiLocationMarker,
  HiStar,
  HiExclamationCircle,
  HiExternalLink,
  HiOutlineCreditCard,
  HiOutlineShoppingBag,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import {
  getBuyerOrderById,
  cancelBuyerOrder,
  fetchPublicProducts,
  getSavedDeliveryAddress,
  submitOrderReview,
} from '../api/productApi';
import ProductCard from '../components/market/ProductCard';
import '../components/market/market-web.css';

const TRACKING_STEPS = [
  { key: 'ORDERED', label: 'Ordered', offsetDays: 0 },
  { key: 'SHIPPED', label: 'Shipped', offsetDays: 1 },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', offsetDays: 3 },
  { key: 'DELIVERED', label: 'Delivered', offsetDays: 4 },
];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);

  // Review State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ord, addr, recs] = await Promise.all([
        getBuyerOrderById(id),
        getSavedDeliveryAddress(),
        fetchPublicProducts({ limit: 10 }),
      ]);
      setOrder(ord);
      setDeliveryAddress(addr);
      setRecommendedProducts(recs || []);
    } catch (err) {
      console.warn('Failed to load order details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleCancelOrder = async () => {
    const reason = window.prompt(
      'Are you sure you want to cancel this order? Please enter a reason:',
      'Changed my mind'
    );
    if (!reason) return;

    setCancelling(true);
    try {
      await cancelBuyerOrder(id, reason);
      const updated = await getBuyerOrderById(id);
      setOrder(updated);
      alert('Order cancelled successfully.');
    } catch (err) {
      alert(err?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewTitle.trim() && !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      await submitOrderReview(id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      setReviewSubmitted(true);
      alert('Review submitted successfully! Thank you.');
    } catch (err) {
      alert(err?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDateWithOffset = (isoDate, offsetDays) => {
    const base = isoDate ? new Date(isoDate) : new Date();
    const d = new Date(base.getTime() + offsetDays * 86400000);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="mkt-page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid rgba(37, 99, 235, 0.2)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>Loading live tracking details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mkt-page-wrapper" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>Order Not Found</h2>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '360px', margin: '0 auto 20px' }}>
          We could not find order details for #{id}.
        </p>
        <button
          type="button"
          onClick={() => navigate('/market')}
          style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 800, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const status = (order.delivery_status || order.status || 'ORDERED').toUpperCase();
  const isCancelled = order.is_cancelled || status === 'CANCELLED';
  const isDelivered = status === 'DELIVERED';

  const stepKeys = ['ORDERED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  let currentStepIdx = stepKeys.indexOf(status);
  if (currentStepIdx < 0) currentStepIdx = 0;

  const placedDateStr = order.placed_at || order.created_at
    ? new Date(order.placed_at || order.created_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const unitPrice =
    Number(order.unit_price) ||
    Number(order.price) ||
    (order.quantity && (Number(order.total_price) || Number(order.total_amount))
      ? (Number(order.total_price) || Number(order.total_amount)) / Number(order.quantity)
      : 0);

  const totalAmount =
    Number(order.total_price) ||
    Number(order.total_amount) ||
    Number(order.amount_paid) ||
    unitPrice * Number(order.quantity || 1) ||
    0;

  const paymentMethodLabel =
    String(order.payment_method || '').toUpperCase() === 'RAZORPAY' ||
    String(order.payment_method || '').toLowerCase() === 'online'
      ? 'Online (Razorpay)'
      : 'Cash on Delivery (COD)';

  return (
    <div className="mkt-page-wrapper">
      {/* ── Top Header ── */}
      <header className="mkt-navbar">
        <div className="mkt-container">
          <div className="mkt-navbar-inner">
            <div className="mkt-nav-left">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mkt-nav-back-btn"
                title="Back"
              >
                <HiChevronLeft size={20} />
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                  Order #{order.order_code || id}
                </h1>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Placed on {placedDateStr}</p>
              </div>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                padding: '5px 12px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                background: isCancelled ? '#fee2e2' : isDelivered ? '#d1fae5' : '#dbeafe',
                color: isCancelled ? '#dc2626' : isDelivered ? '#059669' : '#2563eb',
                letterSpacing: '0.04em',
              }}
            >
              {status}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Tracking Body (2-Column Responsive Layout) ── */}
      <main className="mkt-checkout-wrap">
        <div className="mkt-checkout-grid">
          {/* ── LEFT COLUMN: Stepper + Item Info + Customer Reviews ── */}
          <div className="mkt-checkout-main">
            {/* If Cancelled Alert */}
            {isCancelled && (
              <div style={{ padding: '16px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#dc2626', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Order Cancelled
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: '#991b1b', lineHeight: 1.5 }}>
                  Reason: {order.cancellation_reason || 'Cancelled by buyer'}
                </p>
                <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '12px', color: '#065f46', fontWeight: 600 }}>
                  If paid online, refund is processed directly to your source account within 24–48 hours.
                </div>
              </div>
            )}

            {/* Live Tracking Timeline Stepper */}
            {!isCancelled && (
              <div className="mkt-checkout-card">
                <div className="mkt-checkout-card-header">
                  <h3 className="mkt-checkout-card-title">
                    <HiOutlineTruck size={18} color="#2563eb" />
                    <span>Live Delivery Tracking</span>
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    Est. Delivery: <strong style={{ color: '#2563eb' }}>{formatDateWithOffset(order.placed_at || order.created_at, 4)}</strong>
                  </span>
                </div>

                {/* Stepper Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '26px', padding: '16px 0 16px 28px', position: 'relative' }}>
                  {TRACKING_STEPS.map((st, idx) => {
                    const isPassed = currentStepIdx >= idx;
                    const isCurrent = currentStepIdx === idx;

                    return (
                      <div key={st.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
                        {/* Connecting Line */}
                        {idx < TRACKING_STEPS.length - 1 && (
                          <div
                            style={{
                              position: 'absolute',
                              left: '-17px',
                              top: '22px',
                              bottom: '-28px',
                              width: '2px',
                              background: currentStepIdx > idx ? '#2563eb' : '#e2e8f0',
                            }}
                          />
                        )}

                        {/* Circle Indicator */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '-26px',
                            top: '0',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: isPassed ? '#2563eb' : '#ffffff',
                            color: isPassed ? '#ffffff' : '#94a3b8',
                            border: isPassed ? 'none' : '2px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 900,
                            boxShadow: isCurrent ? '0 0 0 4px #dbeafe' : 'none',
                            zIndex: 2,
                          }}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: isCurrent ? '#2563eb' : isPassed ? '#0f172a' : '#94a3b8' }}>
                              {st.label}
                            </h4>
                            <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>
                              {formatDateWithOffset(order.placed_at || order.created_at, st.offsetDays)}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                            {idx === 0 && 'Order placed & confirmed with local merchant'}
                            {idx === 1 && 'Package packed & dispatched with courier partner'}
                            {idx === 2 && 'Package arrived at local delivery hub'}
                            {idx === 3 && 'Package handed over to customer'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ordered Product Card */}
            <div className="mkt-checkout-card">
              <div className="mkt-checkout-card-header">
                <h3 className="mkt-checkout-card-title">
                  <HiOutlineShoppingBag size={18} color="#2563eb" />
                  <span>Package Contents</span>
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  Item #{order.product_id || 1}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img
                  src={order.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                  alt={order.product_name}
                  style={{ width: '84px', height: '84px', borderRadius: '12px', objectFit: 'cover', background: '#f8fafc', border: '1px solid #e2e8f0', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '14.5px', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                    {order.product_name || 'Kerala Marketplace Item'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11.5px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', color: '#475569', fontWeight: 700 }}>
                      Size: <strong style={{ color: '#0f172a' }}>{order.selected_size || 'Standard'}</strong>
                    </span>
                    <span style={{ fontSize: '11.5px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', color: '#475569', fontWeight: 700 }}>
                      Qty: <strong style={{ color: '#0f172a' }}>{order.quantity || 1}</strong>
                    </span>
                    {unitPrice > 0 && (
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        (₹{unitPrice.toLocaleString('en-IN')} each)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Rating & Review Card */}
            {!isCancelled && (
              <div className="mkt-checkout-card">
                <div className="mkt-checkout-card-header">
                  <h3 className="mkt-checkout-card-title">
                    <HiStar size={18} color="#f59e0b" />
                    <span>Rate Your Experience</span>
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>Verified Buyer</span>
                </div>

                {reviewSubmitted ? (
                  <div style={{ padding: '14px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiCheckCircle size={20} color="#059669" />
                    <span>Thank you! Your feedback has been recorded for this product.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="mkt-form-label">Overall Rating</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '24px', color: star <= reviewRating ? '#f59e0b' : '#cbd5e1', transition: 'color 0.15s ease' }}
                          >
                            ★
                          </button>
                        ))}
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155', marginLeft: '8px' }}>
                          {reviewRating} of 5 stars
                        </span>
                      </div>
                    </div>

                    <div className="mkt-form-group" style={{ margin: 0 }}>
                      <label className="mkt-form-label">Review Headline</label>
                      <input
                        type="text"
                        placeholder="e.g. Excellent quality, fast dispatch!"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        className="mkt-form-input"
                      />
                    </div>

                    <div className="mkt-form-group" style={{ margin: 0 }}>
                      <label className="mkt-form-label">Detailed Comments</label>
                      <textarea
                        rows={3}
                        placeholder="Share your thoughts about product quality, freshness, and packaging..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="mkt-form-textarea"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="mkt-btn-buy-now"
                      style={{ alignSelf: 'flex-start', flex: 'unset', padding: '10px 24px', fontSize: '13px' }}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN (Sidebar): Summary + Shipping Address + Seller Support + Courier ── */}
          <div className="mkt-checkout-sidebar">
            {/* Order Summary & Actions */}
            <div className="mkt-checkout-card">
              <div className="mkt-checkout-card-header">
                <h3 className="mkt-checkout-card-title">
                  <HiOutlineCreditCard size={18} color="#2563eb" />
                  <span>Order Summary</span>
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Order Reference</span>
                  <strong style={{ color: '#0f172a' }}>#{order.order_code || id}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Order Date</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{placedDateStr}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Payment Mode</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{paymentMethodLabel}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Payment Status</span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: String(order.payment_status || '').toUpperCase() === 'PAID' ? '#dcfce7' : '#fef9c3',
                      color: String(order.payment_status || '').toUpperCase() === 'PAID' ? '#15803d' : '#854d0e',
                    }}
                  >
                    {String(order.payment_status || 'PENDING').toUpperCase()}
                  </span>
                </div>

                <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    {String(order.payment_status || '').toUpperCase() === 'PAID' ? 'Total Paid' : 'Total Payable'}
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#2563eb' }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Cancel Button if eligible */}
                {!isCancelled && !isDelivered && (
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1.5px solid #fecaca',
                      color: '#dc2626',
                      borderRadius: '10px',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#fef2f2')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>
            </div>

            {/* Courier Dispatch Card */}
            {order.courier_partner && (
              <div className="mkt-checkout-card">
                <div className="mkt-checkout-card-header">
                  <h3 className="mkt-checkout-card-title">
                    <HiOutlineTruck size={18} color="#2563eb" />
                    <span>Courier Partner</span>
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                    {order.courier_partner}
                  </div>
                  {order.tracking_number && (
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Waybill / AWB: <strong style={{ color: '#0f172a' }}>{order.tracking_number}</strong>
                    </div>
                  )}
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '4px',
                        padding: '8px 14px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      <span>Track on Carrier Website</span>
                      <HiExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Address Card */}
            <div className="mkt-checkout-card">
              <div className="mkt-checkout-card-header">
                <h3 className="mkt-checkout-card-title">
                  <HiLocationMarker size={18} color="#2563eb" />
                  <span>Delivery Address</span>
                </h3>
              </div>
              <div style={{ fontSize: '13px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#0f172a' }}>
                  {order.buyer_name || deliveryAddress?.name || 'Customer'}{' '}
                  <span style={{ color: '#64748b', fontWeight: 600 }}>({order.buyer_phone || deliveryAddress?.phone})</span>
                </p>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.5 }}>
                  {order.buyer_address || deliveryAddress?.address},{' '}
                  {order.buyer_city || order.buyer_district || deliveryAddress?.district}, Kerala -{' '}
                  {order.buyer_pincode || deliveryAddress?.pincode}
                </p>
              </div>
            </div>

            {/* Seller Contact & Support Card */}
            <div className="mkt-checkout-card">
              <div className="mkt-checkout-card-header">
                <h3 className="mkt-checkout-card-title">
                  <span>Merchant &amp; Seller</span>
                </h3>
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  {order.seller_name || 'Verified Kerala Merchant'}
                </h4>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b' }}>
                  Direct seller partner dispatching your item
                </p>

                {(order.seller_phone || order.seller_whatsapp) && (
                  <a
                    href={`https://wa.me/91${String(order.seller_whatsapp || order.seller_phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Inquiring regarding order #${order.order_code || id} for "${order.product_name}".`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mkt-whatsapp-btn"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <FaWhatsapp size={16} />
                    <span>WhatsApp Seller</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── You May Also Like Products Grid ── */}
        {recommendedProducts.length > 0 && (
          <div style={{ marginTop: '48px', paddingTop: '28px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 4px', color: '#0f172a' }}>
                  You May Also Like
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Explore top trending picks from verified merchants</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/market')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                View All →
              </button>
            </div>
            <div className="mkt-product-grid">
              {recommendedProducts.slice(0, 5).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
