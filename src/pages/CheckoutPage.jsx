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
  HiLockClosed,
  HiCreditCard,
  HiCash,
} from 'react-icons/hi';
import {
  fetchProductById,
  placeProductOrder,
  getSavedDeliveryAddress,
  clearMarketCart,
  fetchCheckoutRules,
  startProductOrderRazorpayCheckout,
  startOrderPayment,
  isOwnProduct,
} from '../api/productApi';
import DeliveryAddressModal from '../components/market/DeliveryAddressModal';
import MobileAccountModal from '../components/MobileAccountModal';
import { isCustomerAuthenticated, getStoredCustomerUser } from '../api/customerApi';
import '../components/market/market-web.css';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [customerUser, setCustomerUser] = useState(() =>
    isCustomerAuthenticated() ? getStoredCustomerUser() : null
  );
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountPrompt, setAccountPrompt] = useState('');

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
    const syncAuth = async () => {
      const authed = isCustomerAuthenticated();
      setCustomerUser(authed ? getStoredCustomerUser() : null);
      const saved = authed ? await getSavedDeliveryAddress() : null;
      setDeliveryAddress(saved?.address ? saved : null);
    };
    window.addEventListener('customer-session-changed', syncAuth);
    window.addEventListener('logo-delivery-address-changed', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('customer-session-changed', syncAuth);
      window.removeEventListener('logo-delivery-address-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const authed = isCustomerAuthenticated();
        const [prod, addr, rules] = await Promise.all([
          productId ? fetchProductById(productId) : null,
          authed ? getSavedDeliveryAddress() : null,
          fetchCheckoutRules(),
        ]);

        if (prod) {
          setProduct(prod);
          if (prod.sizes && prod.sizes.length > 0) {
            const matchedSize = prod.sizes.includes(initialSize) ? initialSize : prod.sizes[0];
            setSelectedSize(matchedSize);
          }
          const minRule = rules?.min_order_value ? Number(rules.min_order_value) : 150.0;
          const p = Number(prod.price || 0);
          const reqMin = p > 0 && p < minRule ? Math.ceil(minRule / p) : 1;
          setQuantity((prev) => Math.max(prev, reqMin));
        }

        setDeliveryAddress(authed && addr?.address ? addr : null);
        if (rules) {
          setCheckoutRules(rules);
          if (rules.cod_available === false) {
            setPaymentMethod('online');
          }
        }
      } catch (err) {
        console.warn('Failed to load checkout details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId, initialSize]);

  // Pricing calculations
  const unitPrice = Number(product?.price || 0);
  const originalUnitPrice = Number(product?.original_price || product?.mrp || unitPrice * 1.35);
  const minOrderValue = Number(checkoutRules.min_order_value ?? 150.0);
  const minRequiredQty = unitPrice > 0 && unitPrice < minOrderValue ? Math.ceil(minOrderValue / unitPrice) : 1;

  const subtotal = unitPrice * quantity;
  const totalMrp = originalUnitPrice * quantity;
  const totalSavings = Math.max(0, totalMrp - subtotal);

  // 1. Delivery Fee: Free above 499, else 40
  const isFreeDelivery = subtotal >= Number(checkoutRules.free_delivery_above ?? 499.0);
  const deliveryCharge = isFreeDelivery ? 0 : Number(checkoutRules.delivery_fee ?? 40.0);

  // 2. COD Extra Fee: If COD selected and subtotal < 500, add 40
  const isFreeCod = subtotal >= Number(checkoutRules.free_cod_above ?? 500.0);
  const codFee = paymentMethod === 'cod' && !isFreeCod ? Number(checkoutRules.cod_fee ?? 40.0) : 0;

  // Final Payable
  const finalPayable = Math.max(0, subtotal + deliveryCharge + codFee);

  const openCustomerAuth = (prompt = 'Sign in required: please sign in to purchase products, use COD, or pay online.') => {
    setAccountPrompt(prompt);
    setAccountModalOpen(true);
  };

  const ownProduct = isOwnProduct(product, customerUser);
  const isOutOfStock = Boolean(
    product &&
      (product.inStock === false ||
        product.in_stock === false ||
        String(product.stockStatus || product.stock_status || '').toUpperCase() === 'OUT_OF_STOCK' ||
        (product.stockQuantity !== null && product.stockQuantity !== undefined && Number(product.stockQuantity) <= 0))
  );

  const handleContinueToPayment = () => {
    if (!isCustomerAuthenticated()) {
      setErrorMsg('Please sign in with your Customer Account to purchase products.');
      openCustomerAuth('Please sign in to proceed to payment and place orders.');
      return;
    }
    if (ownProduct) {
      setErrorMsg('You cannot purchase your own listed product.');
      return;
    }
    if (isOutOfStock) {
      setErrorMsg('This product is currently out of stock.');
      return;
    }
    if (subtotal < minOrderValue) {
      setErrorMsg(
        `Minimum order total is ₹${minOrderValue}. Please increase quantity to at least ${minRequiredQty}.`
      );
      return;
    }
    if (!deliveryAddress || !deliveryAddress.address || !deliveryAddress.phone) {
      setErrorMsg('Please enter a delivery address to proceed.');
      setIsAddressModalOpen(true);
      return;
    }
    setErrorMsg('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerOrderCelebration = (result) => {
    setPlacedOrderCode(String(result?.order_code || result?.id || ''));
    setShowCelebration(true);
    setTimeout(() => {
      navigate(
        `/order/confirmed?order_id=${result?.id || result?.order_code}&product_id=${product?.id || productId}&quantity=${quantity}&size=${encodeURIComponent(selectedSize)}&total_amount=${finalPayable}&payment_method=${paymentMethod}`
      );
    }, 2400);
  };

  const handlePlaceOrder = async () => {
    if (!isCustomerAuthenticated()) {
      setErrorMsg('Sign in required: please sign in before choosing Cash on Delivery or Online Payment.');
      openCustomerAuth('Sign in is strictly required before Cash on Delivery or Online Payment can be used.');
      return;
    }
    if (ownProduct) {
      setErrorMsg('Sellers cannot purchase their own listed products.');
      return;
    }
    if (isOutOfStock) {
      setErrorMsg('This item is currently out of stock.');
      return;
    }
    if (subtotal < minOrderValue) {
      setErrorMsg(`Minimum order amount is ₹${minOrderValue}.`);
      return;
    }
    if (!deliveryAddress || !deliveryAddress.address || !deliveryAddress.phone) {
      setErrorMsg('Please specify a valid delivery address.');
      setIsAddressModalOpen(true);
      return;
    }

    try {
      setIsOrdering(true);
      setErrorMsg('');

      const orderPayload = {
        product_id: Number(product?.id || productId),
        product_name: product?.name || 'Kerala Marketplace Item',
        product_image: product?.image || product?.images?.[0],
        seller_name: product?.seller_name || product?.merchant_name || 'Kerala Seller',
        seller_phone: product?.seller_phone || product?.sellerPhone || '',
        seller_whatsapp: product?.seller_whatsapp || product?.sellerWhatsapp,
        buyer_name: deliveryAddress.name || customerUser?.name || '',
        buyer_phone: deliveryAddress.phone || customerUser?.phone || '',
        buyer_address: deliveryAddress.address,
        buyer_city: deliveryAddress.city || deliveryAddress.district || '',
        buyer_district: deliveryAddress.district || '',
        buyer_pincode: deliveryAddress.pincode || '',
        selected_size: selectedSize || (product?.sizes && product.sizes[0]) || 'Standard',
        quantity: quantity,
        price: unitPrice,
        total_amount: finalPayable,
        payment_method: paymentMethod === 'online' ? 'RAZORPAY' : 'COD',
        notes: `Ordered via Logo Web Marketplace (${paymentMethod === 'online' ? 'Razorpay Online' : 'Cash on Delivery'})`,
      };

      const result = await placeProductOrder(orderPayload);

      // ── If Online Payment: Launch Razorpay Modal ──
      if (paymentMethod === 'online') {
        try {
          await startProductOrderRazorpayCheckout({
            orderId: result.id,
            orderCode: result.order_code,
            productName: product?.name,
            amount: finalPayable,
            user: customerUser || {
              name: deliveryAddress.name,
              phone: deliveryAddress.phone,
              email: customerUser?.email || '',
            },
            onSuccess: async () => {
              await clearMarketCart();
              triggerOrderCelebration(result);
            },
            onError: (payErr) => {
              const msg = String(payErr?.message || '');
              setErrorMsg(msg || 'Payment could not be completed. You can retry from My Orders.');
              setIsOrdering(false);
            },
            onDismiss: () => {
              setErrorMsg('Payment cancelled. Your order has been placed in pending state.');
              setIsOrdering(false);
            },
          });
        } catch (rzpErr) {
          console.warn('Razorpay checkout error:', rzpErr);
          setErrorMsg(rzpErr?.message || 'Failed to start payment gateway.');
          setIsOrdering(false);
        }
        return;
      }

      // ── If COD: Record COD method cleanly on backend & confirm ──
      await startOrderPayment(result.id, 'COD').catch(() => null);
      await clearMarketCart();
      triggerOrderCelebration(result);
    } catch (err) {
      console.error('Order placement failed:', err);
      setErrorMsg(err?.message || 'Failed to place order. Please try again.');
      setIsOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="mkt-page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(37, 99, 235, 0.2)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>Preparing your order...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mkt-page-wrapper" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>Product Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '20px' }}>The product you are trying to checkout is unavailable.</p>
        <button type="button" onClick={() => navigate('/market')} className="mkt-btn-buy-now" style={{ flex: 'unset', display: 'inline-flex', padding: '10px 24px' }}>
          Back to Marketplace
        </button>
      </div>
    );
  }

  const thumbImg = product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';

  return (
    <div className="mkt-page-wrapper">
      {/* ── Top Header ── */}
      <header className="mkt-navbar">
        <div className="mkt-container">
          <div className="mkt-navbar-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => (step === 2 ? setStep(1) : navigate(-1))}
                className="mkt-nav-back-btn"
                title="Go Back"
              >
                <HiChevronLeft size={20} />
              </button>
              <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                {step === 1 ? 'Review Your Order' : 'Select Payment Method'}
              </h1>
            </div>

            {/* Stepper Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800 }}>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: step === 1 ? '#2563eb' : '#eff6ff',
                  color: step === 1 ? '#ffffff' : '#2563eb',
                  border: '1px solid #bfdbfe',
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

      {/* ── Checkout Content Container (1180px Wide 2-Column Grid) ── */}
      <main className="mkt-checkout-wrap">
        {errorMsg && (
          <div style={{ padding: '12px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#991b1b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HiExclamationCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mkt-checkout-grid">
          {/* ═══════════════════════════════════════════════════════════════════
              LEFT MAIN COLUMN: Step 1 or Step 2 Cards
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="mkt-checkout-main">
            {step === 1 ? (
              <>
                {/* 1. Delivery Address Card */}
                {!isCustomerAuthenticated() && (
                  <div
                    className="mkt-checkout-card"
                    style={{
                      background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)',
                      border: '1.5px solid #bfdbfe',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 900, color: '#1e3a8a' }}>
                        Sign In Required to Complete Purchase
                      </h4>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>
                        Please sign in with your Customer Account before adding a delivery address, choosing COD, or paying via Razorpay.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCustomerAuth('Please sign in to continue your order.')}
                      className="mkt-btn-buy-now"
                      style={{ flex: 'unset', padding: '10px 20px', fontSize: '13px', whiteSpace: 'nowrap' }}
                    >
                      Sign In Now →
                    </button>
                  </div>
                )}

                <div className="mkt-checkout-card">
                  <div className="mkt-checkout-card-header">
                    <h3 className="mkt-checkout-card-title">
                      <HiLocationMarker size={18} color="#2563eb" />
                      <span>Delivery Address</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isCustomerAuthenticated()) {
                          openCustomerAuth('Please sign in first to add a delivery address.');
                          return;
                        }
                        setIsAddressModalOpen(true);
                      }}
                      style={{ fontSize: '12.5px', fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {deliveryAddress?.address ? 'Change Address' : '+ Add Address'}
                    </button>
                  </div>

                  {deliveryAddress?.address ? (
                    <div style={{ fontSize: '13.5px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                        {deliveryAddress.name}{' '}
                        <span style={{ color: '#64748b', fontWeight: 500 }}>({deliveryAddress.phone})</span>
                      </div>
                      <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
                        {deliveryAddress.address}
                        {deliveryAddress.landmark ? `, ${deliveryAddress.landmark}` : ''},{' '}
                        {deliveryAddress.city || deliveryAddress.district}, Kerala -{' '}
                        <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{deliveryAddress.pincode}</strong>
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: '#64748b', fontSize: '13px' }}>
                      <p style={{ margin: '0 0 10px' }}>
                        {isCustomerAuthenticated()
                          ? 'No delivery address added yet.'
                          : 'Sign in to add your delivery address (no default address saved).'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isCustomerAuthenticated()) {
                            openCustomerAuth('Please sign in first to add a delivery address.');
                            return;
                          }
                          setIsAddressModalOpen(true);
                        }}
                        className="mkt-btn-buy-now"
                        style={{ flex: 'unset', display: 'inline-flex', padding: '8px 20px', fontSize: '12.5px' }}
                      >
                        {isCustomerAuthenticated() ? '+ Add Delivery Address' : 'Sign In & Add Address'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Product Summary Card */}
                <div className="mkt-checkout-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ background: '#eff6ff', borderBottom: '1px solid #dbeafe', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 800, color: '#1e40af' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <HiOutlineTruck size={18} />
                      <span>Estimated Delivery: {getDeliveryDate()}</span>
                    </div>
                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '4px' }}>
                      {isFreeDelivery ? 'Free Delivery' : 'Standard Shipping'}
                    </span>
                  </div>

                  <div style={{ padding: '20px', display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    <img
                      src={thumbImg}
                      alt={product.name}
                      style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', background: '#f1f5f9', border: '1px solid #e2e8f0', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{product.name}</h4>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                        <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Size: {selectedSize}</span>
                        <span>Sold by: {product.seller_name || product.sellerName || 'Kerala Verified Merchant'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                            ₹{subtotal.toLocaleString('en-IN')}
                          </span>
                          {totalMrp > subtotal && (
                            <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{totalMrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {/* Quantity Counter */}
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
                            onClick={() =>
                              setQuantity((q) =>
                                product.stockQuantity !== null && product.stockQuantity !== undefined
                                  ? Math.min(Number(product.stockQuantity), q + 1)
                                  : q + 1
                              )
                            }
                            disabled={
                              product.stockQuantity !== null &&
                              product.stockQuantity !== undefined &&
                              quantity >= Number(product.stockQuantity)
                            }
                            className="mkt-qty-btn"
                          >
                            <HiPlus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Assurance Trust Card */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HiShieldCheck size={24} color="#059669" />
                    <div>
                      <h5 style={{ margin: 0, fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>100% Genuine Products</h5>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Direct from verified Kerala sellers</span>
                    </div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HiSparkles size={24} color="#2563eb" />
                    <div>
                      <h5 style={{ margin: 0, fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>Easy 7-Day Returns</h5>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Hassle-free replacement policy</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* ═══════════════════════════════════════════════════════════
                    STEP 2: PAYMENT METHOD SELECTION
                    ═══════════════════════════════════════════════════════════ */}
                <div className="mkt-checkout-card">
                  <div className="mkt-checkout-card-header">
                    <h3 className="mkt-checkout-card-title">
                      <HiCreditCard size={18} color="#2563eb" />
                      <span>Choose Payment Method</span>
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Option 1: Razorpay Online Payment */}
                    <label
                      onClick={() => {
                        if (!isCustomerAuthenticated()) {
                          openCustomerAuth('Please sign in to pay online via Razorpay.');
                          return;
                        }
                        setPaymentMethod('online');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${paymentMethod === 'online' ? '#2563eb' : '#e2e8f0'}`,
                        background: paymentMethod === 'online' ? '#eff6ff' : '#ffffff',
                        cursor: isCustomerAuthenticated() ? 'pointer' : 'not-allowed',
                        opacity: isCustomerAuthenticated() ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === 'online'}
                        disabled={!isCustomerAuthenticated()}
                        onChange={() => {
                          if (!isCustomerAuthenticated()) {
                            openCustomerAuth('Please sign in to pay online via Razorpay.');
                            return;
                          }
                          setPaymentMethod('online');
                        }}
                        style={{ marginTop: '4px', accentColor: '#2563eb' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                            Pay Online (Razorpay)
                          </span>
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                            Save ₹40 COD Fee
                          </span>
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: '12.5px', color: '#64748b', lineHeight: 1.4 }}>
                          Instant checkout via Google Pay, PhonePe, Paytm, UPI Apps, Debit/Credit Cards & Netbanking.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#334155' }}>UPI Apps</span>
                          <span style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#334155' }}>Visa / Mastercard</span>
                          <span style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#334155' }}>RuPay</span>
                          <span style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#334155' }}>Netbanking</span>
                        </div>
                      </div>
                    </label>

                    {/* Option 2: Cash on Delivery */}
                    <label
                      onClick={() => {
                        if (!isCustomerAuthenticated()) {
                          openCustomerAuth('Please sign in to use Cash on Delivery (COD).');
                          return;
                        }
                        setPaymentMethod('cod');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${paymentMethod === 'cod' ? '#2563eb' : '#e2e8f0'}`,
                        background: paymentMethod === 'cod' ? '#eff6ff' : '#ffffff',
                        cursor: isCustomerAuthenticated() ? 'pointer' : 'not-allowed',
                        opacity: isCustomerAuthenticated() ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === 'cod'}
                        disabled={!isCustomerAuthenticated()}
                        onChange={() => {
                          if (!isCustomerAuthenticated()) {
                            openCustomerAuth('Please sign in to use Cash on Delivery (COD).');
                            return;
                          }
                          setPaymentMethod('cod');
                        }}
                        style={{ marginTop: '4px', accentColor: '#2563eb' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                            Cash on Delivery (COD)
                          </span>
                          {!isFreeCod ? (
                            <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                              +₹40 Extra COD Fee
                            </span>
                          ) : (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                              Free COD
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.4 }}>
                          Pay with cash or scan delivery partner's UPI QR code at your doorstep upon receiving the package.
                          {!isFreeCod && ' Note: COD handling fee of ₹40 applies (Free above ₹500).'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Delivery Destination Reminder */}
                <div className="mkt-checkout-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Delivering To
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Change
                    </button>
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#0f172a', fontWeight: 700 }}>
                    {deliveryAddress?.name} ({deliveryAddress?.phone})
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                    {deliveryAddress?.address}, {deliveryAddress?.city || deliveryAddress?.district} - {deliveryAddress?.pincode}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              RIGHT SIDEBAR: Sticky Price Details Summary Card
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="mkt-checkout-sidebar">
            <div className="mkt-checkout-card" style={{ position: 'sticky', top: '90px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 900, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                Price Details ({quantity} Item{quantity > 1 ? 's' : ''})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Total MRP</span>
                  <span>₹{totalMrp.toLocaleString('en-IN')}</span>
                </div>

                {totalSavings > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                    <span>Discount on MRP</span>
                    <span>-₹{totalSavings.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Product Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Delivery Charges</span>
                  <span>
                    {isFreeDelivery ? (
                      <strong style={{ color: '#16a34a' }}>FREE</strong>
                    ) : (
                      `+₹${deliveryCharge}`
                    )}
                  </span>
                </div>

                {/* Dynamic COD Fee: Shows +₹40 when COD chosen */}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Cash on Delivery Fee</span>
                  <span>
                    {paymentMethod === 'cod' ? (
                      codFee > 0 ? (
                        <strong style={{ color: '#dc2626' }}>+₹{codFee}</strong>
                      ) : (
                        <strong style={{ color: '#16a34a' }}>FREE</strong>
                      )
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>₹0 (Online)</span>
                    )}
                  </span>
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#2563eb' }}>₹{finalPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {totalSavings > 0 && (
                <div style={{ marginTop: '14px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#166534', textAlign: 'center' }}>
                  🎉 You are saving ₹{totalSavings.toLocaleString('en-IN')} on this order!
                </div>
              )}

              {/* Action Button */}
              <div style={{ marginTop: '20px' }}>
                {ownProduct ? (
                  <div style={{ padding: '14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}>
                    You cannot purchase your own listed product.
                  </div>
                ) : isOutOfStock ? (
                  <div style={{ padding: '14px', borderRadius: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}>
                    Currently Out of Stock
                  </div>
                ) : !isCustomerAuthenticated() ? (
                  <button
                    type="button"
                    onClick={() => openCustomerAuth('Please sign in before placing an order or choosing payment.')}
                    className="mkt-btn-buy-now"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14.5px' }}
                  >
                    Sign In to Purchase →
                  </button>
                ) : step === 1 ? (
                  <button
                    type="button"
                    onClick={handleContinueToPayment}
                    className="mkt-btn-buy-now"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14.5px' }}
                  >
                    Continue to Payment →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isOrdering}
                    className="mkt-btn-buy-now"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '14px',
                      fontSize: '14.5px',
                      background: paymentMethod === 'online' ? '#2563eb' : '#059669',
                      opacity: isOrdering ? 0.7 : 1,
                    }}
                  >
                    {isOrdering ? (
                      <span>Processing...</span>
                    ) : paymentMethod === 'online' ? (
                      `Pay ₹${finalPayable.toLocaleString('en-IN')} via Razorpay`
                    ) : (
                      `Place Order with COD (₹${finalPayable.toLocaleString('en-IN')})`
                    )}
                  </button>
                )}
              </div>

              {/* Security Badge */}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                <HiLockClosed size={14} color="#64748b" />
                <span>Safe & Secure 256-Bit SSL Payments</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Address Modal ── */}
      <DeliveryAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        initialAddress={deliveryAddress}
        onAddressSaved={(saved) => {
          setDeliveryAddress(saved);
          setErrorMsg('');
        }}
      />

      {/* ── Customer Sign In Modal ── */}
      <MobileAccountModal
        isOpen={accountModalOpen}
        onClose={() => {
          setAccountModalOpen(false);
          setAccountPrompt('');
        }}
        initialSection="customer-login"
        promptMessage={accountPrompt}
        onAuthSuccess={async (u) => {
          setCustomerUser(u || getStoredCustomerUser());
          const saved = await getSavedDeliveryAddress();
          setDeliveryAddress(saved?.address ? saved : null);
          setAccountModalOpen(false);
          setAccountPrompt('');
          setErrorMsg('');
        }}
      />

      {/* ── Celebration Overlay ── */}
      {showCelebration && (
        <div className="mkt-celebrate-overlay">
          <div className="mkt-celebrate-box">
            <div className="mkt-celebrate-icon">
              <HiCheckCircle size={56} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px' }}>
              Order Placed Successfully!
            </h2>
            <p style={{ fontSize: '14px', opacity: 0.9, margin: '0 0 16px' }}>
              Order ID: <strong>{placedOrderCode}</strong>
            </p>
            <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
              Redirecting to order confirmation...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
