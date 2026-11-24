import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  HiChevronLeft,
  HiLocationMarker,
  HiCheckCircle,
  HiShieldCheck,
  HiOutlineTruck,
  HiExclamationCircle,
  HiPlus,
  HiMinus,
  HiCheck,
  HiSparkles,
} from 'react-icons/hi';
import {
  fetchProductById,
  placeProductOrder,
  getSavedDeliveryAddress,
  clearMarketCart,
  fetchCheckoutRules,
} from '../api/productApi';
import DeliveryAddressModal from '../components/market/DeliveryAddressModal';
import { useAuth } from '../context/AuthContext';
import '../components/market/market-web.css';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const productId = searchParams.get('product_id');
  const initialSize = searchParams.get('selected_size') || 'Standard';
  const initialQty = Number(searchParams.get('quantity') || 1);

  // Flow State
  const [step, setStep] = useState(1); // 1 = Review Order, 2 = Payment Method
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(initialQty);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [checkoutRules, setCheckoutRules] = useState({
    min_order_value: 150.0,
    free_delivery_above: 499.0,
    delivery_fee: 40.0,
    cod_available: true,
    cod_fee: 40.0,
    free_cod_above: 500.0,
  });

  // Payment Selection
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cod'
  const [isOrdering, setIsOrdering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [placedOrderCode, setPlacedOrderCode] = useState('');

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
        const [prod, addr, rules] = await Promise.all([
          productId ? fetchProductById(productId) : null,
          getSavedDeliveryAddress(),
          fetchCheckoutRules(),
        ]);

        if (prod) {
          setProduct(prod);
          const price = Number(prod.price || 0);
          if (price > 0 && price < 150) {
            setQuantity(Math.max(initialQty, Math.ceil(150 / price)));
          }
        }
        if (addr) setDeliveryAddress(addr);
        if (rules) setCheckoutRules(rules);
      } catch (err) {
        console.warn('Failed to load checkout details:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  const unitPrice = Number(product?.price || 0);
  const itemsTotal = unitPrice * quantity;
  const isFreeDelivery = itemsTotal >= (checkoutRules.free_delivery_above || 499) || true;
  const deliveryFee = isFreeDelivery ? 0 : Number(checkoutRules.delivery_fee || 40);
  const codFee =
    paymentMethod === 'cod' && itemsTotal < (checkoutRules.free_cod_above || 500)
      ? Number(checkoutRules.cod_fee || 40)
      : 0;
  const finalTotal = itemsTotal + deliveryFee + codFee;

  const minRequiredQty = unitPrice > 0 && unitPrice < 150 ? Math.ceil(150 / unitPrice) : 1;
  const isBelowMinOrder = unitPrice > 0 && itemsTotal < 150;

  const handleProceedToPayment = () => {
    setErrorMsg('');
    if (!deliveryAddress || !deliveryAddress.address || !deliveryAddress.phone) {
      setErrorMsg('Please enter your complete delivery shipping address.');
      setIsAddressModalOpen(true);
      return;
    }
    if (isBelowMinOrder) {
      setErrorMsg(
        `"${product?.name || 'Item'}" requires a minimum order of ₹150. Please increase quantity to at least ${minRequiredQty}.`
      );
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    if (!product || !deliveryAddress) return;
    setErrorMsg('');
    setIsOrdering(true);

    try {
      const orderPayload = {
        product_id: Number(product.id),
        buyer_name: deliveryAddress.name,
        buyer_phone: deliveryAddress.phone,
        buyer_address: deliveryAddress.address,
        buyer_city: deliveryAddress.city || deliveryAddress.district,
        buyer_district: deliveryAddress.district,
        buyer_pincode: deliveryAddress.pincode,
        selected_size: selectedSize || 'Standard',
        quantity: quantity,
        price: unitPrice,
        total_amount: finalTotal,
        payment_method: paymentMethod,
        notes: `Selected size: ${selectedSize || 'Standard'}`,
      };

      const result = await placeProductOrder(orderPayload);
      await clearMarketCart();

      const orderCode = result?.order_code || result?.code || `ORD-${Date.now()}`;
      const finalOrderId = result?.id || orderCode;

      setPlacedOrderCode(orderCode);
      setShowCelebration(true);

      setTimeout(() => {
        navigate(
          `/order/confirmed?order_id=${finalOrderId}&product_id=${product.id}&quantity=${quantity}&size=${encodeURIComponent(
            selectedSize
          )}&total_amount=${finalTotal}&payment_method=${paymentMethod}`
        );
      }, 2400);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to place order. Please try again.');
      setIsOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="mkt-page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid rgba(37, 99, 235, 0.2)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>Preparing secure checkout...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mkt-page-wrapper" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <HiExclamationCircle size={56} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>No Product Selected</h2>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '360px', margin: '0 auto 20px' }}>
          Please select an item from the Kerala Marketplace to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('/market')}
          style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 800, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
        >
          Go to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="mkt-page-wrapper">
      {/* ── Top Header ── */}
      <header className="mkt-navbar">
        <div className="mkt-container">
          <div className="mkt-navbar-inner" style={{ maxWidth: '840px', margin: '0 auto' }}>
            <button
              type="button"
              onClick={() => {
                if (step === 2) setStep(1);
                else navigate(-1);
              }}
              className="mkt-nav-back-btn"
              style={{ width: 'auto', padding: '0 10px', gap: '4px', fontSize: '12.5px', fontWeight: 700 }}
            >
              <HiChevronLeft size={18} />
              <span>{step === 2 ? 'Order Review' : 'Back'}</span>
            </button>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800 }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: step === 1 ? '#2563eb' : '#d1fae5',
                  color: step === 1 ? '#ffffff' : '#065f46',
                }}
              >
                1. Review Order
              </span>
              <span style={{ color: '#cbd5e1' }}>→</span>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: step === 2 ? '#2563eb' : '#f1f5f9',
                  color: step === 2 ? '#ffffff' : '#94a3b8',
                }}
              >
                2. Payment
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Checkout Content Container ── */}
      <main className="mkt-checkout-wrap">
        {errorMsg && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', fontSize: '12.5px', fontWeight: 700, color: '#991b1b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiExclamationCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── STEP 1: REVIEW YOUR ORDER ── */}
        {step === 1 && (
          <div>
            {/* Delivery Address Card */}
            <div className="mkt-checkout-card">
              <div className="mkt-checkout-card-header">
                <h3 className="mkt-checkout-card-title">
                  <HiLocationMarker size={18} color="#2563eb" />
                  <span>Deliver To</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {deliveryAddress?.address ? 'Change Address' : '+ Add Address'}
                </button>
              </div>

              {deliveryAddress?.address ? (
                <div style={{ fontSize: '13px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
                    {deliveryAddress.name}{' '}
                    <span style={{ color: '#64748b', fontWeight: 500 }}>({deliveryAddress.phone})</span>
                  </div>
                  <p style={{ margin: 0, color: '#475569', lineHeight: 1.5 }}>
                    {deliveryAddress.address}
                    {deliveryAddress.landmark ? `, ${deliveryAddress.landmark}` : ''},{' '}
                    {deliveryAddress.city || deliveryAddress.district}, Kerala -{' '}
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{deliveryAddress.pincode}</strong>
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#64748b', fontSize: '13px' }}>
                  <p style={{ margin: '0 0 10px' }}>No shipping address found. Please enter your delivery address.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="mkt-btn-buy-now"
                    style={{ flex: 'unset', display: 'inline-flex', padding: '8px 18px', fontSize: '12.5px' }}
                  >
                    Enter Address
                  </button>
                </div>
              )}
            </div>

            {/* Product Card */}
            <div className="mkt-checkout-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: '#eff6ff', borderBottom: '1px solid #dbeafe', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: '#1e40af' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HiOutlineTruck size={16} />
                  <span>Estimated Delivery: {getDeliveryDate()}</span>
                </div>
                <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '4px' }}>
                  Free Delivery
                </span>
              </div>

              <div style={{ padding: '18px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <img
                  src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                  alt={product.name}
                  style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', background: '#f1f5f9', border: '1px solid #e2e8f0', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{product.name}</h4>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                    <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Size: {selectedSize}</span>
                    <span>Sold by: {product.sellerName}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                      ₹{itemsTotal.toLocaleString('en-IN')}
                    </span>

                    <div className="mkt-qty-selector">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(minRequiredQty, quantity - 1))}
                        disabled={quantity <= minRequiredQty}
                        className="mkt-qty-btn"
                      >
                        <HiMinus size={13} />
                      </button>
                      <span className="mkt-qty-val">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="mkt-qty-btn"
                      >
                        <HiPlus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Details Breakdown */}
            <div className="mkt-checkout-card">
              <h3 className="mkt-checkout-card-title" style={{ paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
                Order Price Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Price ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{itemsTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Charges</span>
                  <strong style={{ color: '#059669' }}>FREE</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                  <span>Order Total</span>
                  <span style={{ color: '#2563eb' }}>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="mkt-btn-buy-now"
                  style={{ width: '100%', flex: 'unset', padding: '14px 20px', fontSize: '14.5px' }}
                >
                  <span>Continue to Payment Method</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: PAYMENT METHOD ── */}
        {step === 2 && (
          <div>
            <div className="mkt-checkout-card">
              <h3 className="mkt-checkout-card-title" style={{ paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
                Select Payment Option
              </h3>

              {/* Online Payment */}
              <div
                onClick={() => setPaymentMethod('online')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: paymentMethod === 'online' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                  background: paymentMethod === 'online' ? '#eff6ff' : '#ffffff',
                  marginBottom: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: paymentMethod === 'online' ? '2px solid #2563eb' : '2px solid #cbd5e1',
                        background: paymentMethod === 'online' ? '#2563eb' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {paymentMethod === 'online' && <HiCheck size={14} color="#fff" />}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                        Online Payment (Fast & Recommended)
                      </h4>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                        Google Pay, PhonePe, Paytm, UPI, Cards & Netbanking
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: 900, color: '#047857', background: '#d1fae5', padding: '2px 8px', borderRadius: '4px' }}>
                    100% SECURE
                  </span>
                </div>

                {paymentMethod === 'online' && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #dbeafe', display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                    <span style={{ padding: '4px 10px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: 700, color: '#334155' }}>
                      ⚡ Google Pay / PhonePe
                    </span>
                    <span style={{ padding: '4px 10px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: 700, color: '#334155' }}>
                      💳 Visa / Mastercard / RuPay
                    </span>
                    <span style={{ padding: '4px 10px', background: '#fff', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: 700, color: '#334155' }}>
                      🏦 Net Banking
                    </span>
                  </div>
                )}
              </div>

              {/* Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod('cod')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: paymentMethod === 'cod' ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                  background: paymentMethod === 'cod' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: paymentMethod === 'cod' ? '2px solid #2563eb' : '2px solid #cbd5e1',
                      background: paymentMethod === 'cod' ? '#2563eb' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {paymentMethod === 'cod' && <HiCheck size={14} color="#fff" />}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                      Cash on Delivery (Pay upon delivery)
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                      Hand over cash to delivery courier when package arrives
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total and Place Order Button */}
            <div className="mkt-checkout-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>Total Amount Payable</span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#2563eb' }}>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isOrdering}
                className="mkt-btn-buy-now"
                style={{ width: '100%', flex: 'unset', padding: '14px 20px', fontSize: '15px' }}
              >
                {isOrdering ? (
                  <span>Placing Your Order...</span>
                ) : (
                  <>
                    <HiShieldCheck size={20} />
                    <span>Place Order (₹{finalTotal.toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Celebration Overlay (Popping Confetti + Check Circle) ── */}
      {showCelebration && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#1e3a8a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '24px', animation: 'mktFadeIn 0.3s ease' }}>
          <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: '#fff', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}>
            <HiCheckCircle size={56} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <HiSparkles size={24} color="#fde047" />
            <h2 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>Order Placed Successfully!</h2>
            <HiSparkles size={24} color="#fde047" />
          </div>
          <p style={{ color: '#dbeafe', fontSize: '13.5px', textAlign: 'center', maxWidth: '380px', margin: '0 0 16px', lineHeight: 1.5 }}>
            Thank you for shopping on Logo Kerala Marketplace! The local merchant has received your order and is packing it for dispatch.
          </p>
          <div style={{ padding: '6px 18px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.4)', fontSize: '12px', fontWeight: 800, letterSpacing: '0.04em' }}>
            Order #{placedOrderCode}
          </div>
        </div>
      )}

      {/* ── Address Modal ── */}
      <DeliveryAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        initialAddress={deliveryAddress}
        onAddressSaved={(addr) => {
          setDeliveryAddress(addr);
        }}
      />
    </div>
  );
}
