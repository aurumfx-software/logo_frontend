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
        fetchPublicProducts({ limit: 6 }),
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

  const placedDateStr = order.placed_at
    ? new Date(order.placed_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <div className="mkt-page-wrapper">
      {/* ── Top Header ── */}
      <header className="mkt-navbar">
        <div className="mkt-container">
          <div className="mkt-navbar-inner" style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mkt-nav-back-btn"
                title="Back"
              >
                <span style={{ fontSize: '18px', fontWeight: 800 }}>←</span>
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
                padding: '4px 10px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                background: isCancelled ? '#fee2e2' : isDelivered ? '#d1fae5' : '#dbeafe',
                color: isCancelled ? '#dc2626' : isDelivered ? '#059669' : '#2563eb',
              }}
            >
              {status}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Tracking Body ── */}
      <main className="mkt-checkout-wrap">
        {/* If Cancelled Alert */}
        {isCancelled && (
          <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#dc2626', textTransform: 'uppercase', marginBottom: '4px' }}>
              Order Cancelled
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: '#991b1b' }}>
              Reason: {order.cancellation_reason || 'Cancelled by buyer'}
            </p>
            <div style={{ padding: '10px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '12px', color: '#065f46', fontWeight: 600 }}>
              If paid online, refund is processed directly to your source account within 24–48 hours.
            </div>
          </div>
        )}

        {/* Live Tracking Timeline Stepper */}
        {!isCancelled && (
          <div className="mkt-checkout-card">
            <div className="mkt-checkout-card-header">
              <h3 className="mkt-checkout-card-title">Live Delivery Tracking</h3>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                Est. Delivery: <strong style={{ color: '#2563eb' }}>{formatDateWithOffset(order.placed_at, 4)}</strong>
              </span>
            </div>

            {/* Stepper Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '12px 0 12px 24px', position: 'relative' }}>
              {TRACKING_STEPS.map((st, idx) => {
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;

                return (
                  <div key={st.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
                    {/* Circle Indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '0',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: isPassed ? '#2563eb' : '#e2e8f0',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 900,
                        boxShadow: isCurrent ? '0 0 0 4px #dbeafe' : 'none',
                      }}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: isCurrent ? '#2563eb' : isPassed ? '#0f172a' : '#94a3b8' }}>
                          {st.label}
                        </h4>
                        <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                          {formatDateWithOffset(order.placed_at, st.offsetDays)}
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
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

        {/* Courier Dispatch Card */}
        {order.courier_partner && (
          <div className="mkt-checkout-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Courier Partner</span>
              <h4 style={{ margin: '2px 0 0', fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                {order.courier_partner} {order.tracking_number && `(#${order.tracking_number})`}
              </h4>
            </div>

            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '6px 14px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}
              >
                Track on Carrier →
              </a>
            )}
          </div>
        )}

        {/* Ordered Item Card */}
        <div className="mkt-checkout-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <img
            src={order.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
            alt={order.product_name}
            style={{ width: '74px', height: '74px', borderRadius: '10px', objectFit: 'cover', background: '#f1f5f9', border: '1px solid #e2e8f0', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              {order.product_name || 'Marketplace Item'}
            </h4>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
              Size: <strong style={{ color: '#0f172a' }}>{order.selected_size || 'Standard'}</strong> • Qty: <strong style={{ color: '#0f172a' }}>{order.quantity || 1}</strong>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
              ₹{(Number(order.total_amount) || Number(order.price) || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="mkt-checkout-card">
          <div className="mkt-checkout-card-header">
            <h3 className="mkt-checkout-card-title">Shipping Address</h3>
          </div>
          <div style={{ fontSize: '13px' }}>
            <p style={{ margin: '0 0 2px', fontWeight: 800, color: '#0f172a' }}>
              {order.buyer_name || deliveryAddress?.name || 'Customer'}{' '}
              <span style={{ color: '#64748b', fontWeight: 500 }}>({order.buyer_phone || deliveryAddress?.phone})</span>
            </p>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.5 }}>
              {order.buyer_address || deliveryAddress?.address},{' '}
              {order.buyer_city || order.buyer_district || deliveryAddress?.district}, Kerala -{' '}
              {order.buyer_pincode || deliveryAddress?.pincode}
            </p>
          </div>
        </div>

        {/* Seller Info & Actions */}
        <div className="mkt-checkout-card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Seller</span>
            <h4 style={{ margin: '2px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              {order.seller_name || 'Verified Kerala Merchant'}
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Assisting with your order and dispatch</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {(order.seller_phone || order.seller_whatsapp) && (
              <a
                href={`https://wa.me/91${String(order.seller_whatsapp || order.seller_phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Inquiring regarding order #${order.order_code || id} for "${order.product_name}".`)}`}
                target="_blank"
                rel="noreferrer"
                className="mkt-whatsapp-btn"
              >
                <FaWhatsapp size={16} />
                <span>WhatsApp Seller</span>
              </a>
            )}

            {!isCancelled && !isDelivered && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                style={{ padding: '8px 14px', background: '#fff', border: '1.5px solid #fecaca', color: '#dc2626', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {/* Review Submission Card */}
        {!isCancelled && (
          <div className="mkt-checkout-card">
            <h3 className="mkt-checkout-card-title" style={{ paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', marginBottom: '14px' }}>
              Rate Your Experience
            </h3>

            {reviewSubmitted ? (
              <div style={{ padding: '12px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46', fontSize: '12.5px', fontWeight: 700 }}>
                ✓ Thank you! Your review has been submitted.
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="mkt-form-label">Your Rating</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', fontSize: '22px', color: star <= reviewRating ? '#f59e0b' : '#cbd5e1' }}
                      >
                        ★
                      </button>
                    ))}
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#334155', marginLeft: '6px' }}>{reviewRating} out of 5 stars</span>
                  </div>
                </div>

                <div className="mkt-form-group" style={{ margin: 0 }}>
                  <label className="mkt-form-label">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Authentic quality and swift packaging"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="mkt-form-input"
                  />
                </div>

                <div className="mkt-form-group" style={{ margin: 0 }}>
                  <label className="mkt-form-label">Review Details</label>
                  <textarea
                    rows={2}
                    placeholder="Share your experience with this item..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="mkt-form-textarea"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="mkt-btn-buy-now"
                  style={{ alignSelf: 'flex-start', flex: 'unset', padding: '10px 20px', fontSize: '13px' }}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <div style={{ marginTop: '36px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 14px', color: '#0f172a' }}>
              Explore More Products
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {recommendedProducts.slice(0, 3).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
