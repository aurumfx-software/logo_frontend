import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  HiCheckCircle,
  HiOutlineTruck,
  HiLocationMarker,
  HiShare,
  HiChevronRight,
  HiX,
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
          fetchPublicProducts({ limit: 6 }),
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
      navigator.share({
        title: 'Order Confirmed - Logo Marketplace',
        text: `I just placed an order for ${product?.name || 'Kerala Marketplace item'} on Logo App!`,
        url: window.location.href,
      }).catch(() => {});
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

  return (
    <div className="mkt-page-wrapper">
      {/* ── Top Header ── */}
      <header className="mkt-navbar">
        <div className="mkt-container">
          <div className="mkt-navbar-inner" style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiCheckCircle size={18} />
              </div>
              <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#047857' }}>
                Order Confirmed
              </h1>
            </div>

            <button
              type="button"
              onClick={() => navigate('/market')}
              className="mkt-nav-back-btn"
              title="Continue Shopping"
            >
              <HiX size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="mkt-checkout-wrap">
        {/* Delivery Destination Card */}
        <div className="mkt-checkout-card">
          <div className="mkt-checkout-card-header">
            <h3 className="mkt-checkout-card-title">
              <HiLocationMarker size={18} color="#2563eb" />
              <span>Delivery Destination</span>
            </h3>
          </div>
          <div style={{ fontSize: '13px' }}>
            <p style={{ margin: '0 0 2px', fontWeight: 800, color: '#0f172a' }}>
              {customerName} <span style={{ color: '#64748b', fontWeight: 500 }}>({customerPhone})</span>
            </p>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.5 }}>{fullAddress}</p>
          </div>
        </div>

        {/* Product Details Card */}
        <div className="mkt-checkout-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>1 Item Ordered</span>
            <button
              type="button"
              onClick={() => navigate(`/order/${orderId}`)}
              style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              <span>Track Order</span>
              <HiChevronRight size={14} />
            </button>
          </div>

          <div style={{ background: '#eff6ff', borderBottom: '1px solid #dbeafe', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#1e40af' }}>
            <HiOutlineTruck size={16} color="#2563eb" />
            <span>Estimated Delivery: {getDeliveryDate()}</span>
          </div>

          <div style={{ padding: '18px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <img
              src={prodImg}
              alt={prodTitle}
              style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover', background: '#f1f5f9', border: '1px solid #e2e8f0', flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{prodTitle}</h3>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748b' }}>
                Size: <strong style={{ color: '#0f172a' }}>{size}</strong> • Qty: <strong style={{ color: '#0f172a' }}>{quantity}</strong>
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
                <button
                  type="button"
                  onClick={handleShare}
                  style={{ fontSize: '11.5px', fontWeight: 700, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <HiShare size={14} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Mode Card */}
        <div className="mkt-checkout-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Payment Mode</span>
            <p style={{ margin: '2px 0 0', fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
              {paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Paid Online (UPI / Card)'}
            </p>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => navigate(`/order/${orderId}`)}
            className="mkt-btn-buy-now"
            style={{ width: '100%', flex: 'unset', padding: '13px 20px', fontSize: '14px', textAlign: 'center' }}
          >
            Live Tracking & Delivery Status
          </button>
          <button
            type="button"
            onClick={() => navigate('/market')}
            className="mkt-btn-secondary"
            style={{ width: '100%', padding: '13px 20px', fontSize: '14px', display: 'flex', justifyContent: 'center' }}
          >
            Continue Shopping
          </button>
        </div>

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 900, margin: '0 0 14px', color: '#0f172a' }}>
              You Might Also Like
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
