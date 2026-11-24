import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  HiCheckCircle,
  HiOutlineTruck,
  HiLocationMarker,
  HiShare,
  HiChevronRight,
  HiX,
  HiShieldCheck,
  HiChat,
  HiSparkles,
} from 'react-icons/hi';
import {
  fetchProductById,
  fetchPublicProducts,
  getSavedDeliveryAddress,
  getBuyerOrderById,
} from '../api/productApi';
import ProductCard from '../components/market/ProductCard';
import '../components/market/market-web.css';

export default function OrderConfirmedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get('order_id');
  const productId = searchParams.get('product_id');
  const quantity = Number(searchParams.get('quantity') || 1);
  const size = searchParams.get('size') || 'Standard';
  const totalAmount = Number(searchParams.get('total_amount') || 0);
  const paymentMethod = searchParams.get('payment_method') || 'cod';

  const [product, setProduct] = useState(null);
  const [buyerOrder, setBuyerOrder] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDeliveryDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prod, addr, ord, recs] = await Promise.all([
          productId ? fetchProductById(productId) : null,
          getSavedDeliveryAddress(),
          orderId ? getBuyerOrderById(orderId) : null,
          fetchPublicProducts({ limit: 8 }),
        ]);
        setProduct(prod);
        setDeliveryAddress(addr);
        setBuyerOrder(ord);
        setRecommendedProducts((recs || []).filter((p) => String(p.id) !== String(productId)));
      } catch (err) {
        console.warn('Failed to load order confirmation:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [orderId, productId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Order Confirmed - Logo Marketplace',
          text: `I just placed an order for ${product?.name || 'Kerala Marketplace item'} on Logo App!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Order link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="mkt-page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid rgba(5, 150, 105, 0.2)', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>Loading order receipt...</p>
      </div>
    );
  }

  const prodTitle = product?.name || buyerOrder?.product_name || 'Kerala Marketplace Item';
  const prodImg =
    product?.image ||
    buyerOrder?.product_image ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
  const customerName = deliveryAddress?.name || buyerOrder?.buyer_name || 'Customer';
  const customerPhone = deliveryAddress?.phone || buyerOrder?.buyer_phone || '';
  const fullAddress =
    deliveryAddress?.address || buyerOrder?.buyer_address
      ? `${deliveryAddress?.address || buyerOrder?.buyer_address}, ${deliveryAddress?.city || deliveryAddress?.district || 'Kerala'} - ${deliveryAddress?.pincode || ''}`
      : 'Kerala, India';

  const orderCode = buyerOrder?.order_code || buyerOrder?.id || orderId || 'ORD-RECENT';
  const sellerWhatsapp = product?.seller_whatsapp || product?.sellerWhatsapp || '919876543210';

  return (
    <div className="mkt-page-wrapper">
      {/* ── Top Header ── */}
      <header className="mkt-navbar">
        <div className="mkt-container">
          <div className="mkt-navbar-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiCheckCircle size={22} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#047857' }}>
                  Order Confirmed
                </h1>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Order ID: {orderCode}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/market')}
                className="mkt-btn-outline"
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Container (1180px Wide 2-Column Grid) ── */}
      <main className="mkt-checkout-wrap">
        {/* Celebration Banner */}
        <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderRadius: '16px', padding: '24px 28px', color: '#ffffff', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <HiCheckCircle size={36} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900 }}>
                Thank You for Your Order!
              </h2>
              <p style={{ margin: 0, fontSize: '13.5px', opacity: 0.9 }}>
                Your order <strong style={{ textDecoration: 'underline' }}>#{orderCode}</strong> has been successfully placed with the seller.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleShare}
              style={{ background: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.4)', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              <HiShare size={16} />
              <span>Share Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/order/${orderId}`)}
              style={{ background: '#ffffff', color: '#047857', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Track Order</span>
              <HiChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mkt-checkout-grid">
          {/* ═══════════════════════════════════════════════════════════════════
              LEFT COLUMN: Order Item & Shipping Details
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="mkt-checkout-main">
            {/* Delivery Destination Card */}
            <div className="mkt-checkout-card">
              <div className="mkt-checkout-card-header">
                <h3 className="mkt-checkout-card-title">
                  <HiLocationMarker size={18} color="#2563eb" />
                  <span>Delivery Destination</span>
                </h3>
              </div>
              <div style={{ fontSize: '13.5px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#0f172a' }}>
                  {customerName} <span style={{ color: '#64748b', fontWeight: 500 }}>({customerPhone})</span>
                </p>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{fullAddress}</p>
              </div>
            </div>

            {/* Product Details Card */}
            <div className="mkt-checkout-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>1 Item Ordered</span>
                <button
                  type="button"
                  onClick={() => navigate(`/order/${orderId}`)}
                  style={{ fontSize: '12.5px', fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <span>Live Tracking</span>
                  <HiChevronRight size={14} />
                </button>
              </div>

              <div style={{ padding: '20px', display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                <img
                  src={prodImg}
                  alt={prodTitle}
                  style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', background: '#f8fafc', border: '1px solid #e2e8f0', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{prodTitle}</h4>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12.5px', color: '#64748b', marginBottom: '8px' }}>
                    <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Size: {size}</span>
                    <span>Qty: {quantity}</span>
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Seller WhatsApp CTA */}
              <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '12.5px', color: '#475569' }}>
                  Have questions about your package?
                </div>
                <a
                  href={`https://wa.me/${sellerWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I just placed order #${orderCode} for ${prodTitle}. Could you please update me on dispatch?`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#25D366', color: '#ffffff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}
                >
                  <HiChat size={16} />
                  <span>Chat with Seller on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              RIGHT COLUMN: Delivery Schedule & Payment Summary
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="mkt-checkout-sidebar">
            {/* Delivery Schedule Card */}
            <div className="mkt-checkout-card" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiOutlineTruck size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Arrival</span>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>{getDeliveryDate()}</div>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>
                Your order is currently being packed by the seller and will be dispatched via registered courier partner.
              </p>
            </div>

            {/* Payment Summary Card */}
            <div className="mkt-checkout-card">
              <h3 style={{ margin: '0 0 14px', fontSize: '14.5px', fontWeight: 900, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                Payment Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Payment Method</span>
                  <strong style={{ color: '#0f172a' }}>
                    {paymentMethod === 'online' ? 'Online (Razorpay)' : 'Cash on Delivery'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Payment Status</span>
                  <span style={{ color: '#059669', fontWeight: 800 }}>
                    {paymentMethod === 'online' ? 'PAID / CONFIRMED' : 'DUE ON DELIVERY'}
                  </span>
                </div>
                <div style={{ borderTop: '1px dashed #cbd5e1', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#2563eb' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/order/${orderId}`)}
                  className="mkt-btn-buy-now"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13.5px' }}
                >
                  Track Order Status →
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/market')}
                  className="mkt-btn-outline"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px' }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recommended Products (Spans Full 1180px Width) ── */}
        {recommendedProducts.length > 0 && (
          <div style={{ marginTop: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiSparkles size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                  You May Also Like
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/market')}
                style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View All →
              </button>
            </div>

            <div className="mkt-product-grid">
              {recommendedProducts.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
