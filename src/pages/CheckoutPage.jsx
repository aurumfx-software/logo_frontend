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
  const [paymentSubMethod, setPaymentSubMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [isOrdering, setIsOrdering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [placedOrderCode, setPlacedOrderCode] = useState('');

  // Estimated delivery date (4 days ahead)
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

  // Price calculations
  const unitPrice = Number(product?.price || 0);
  const itemsTotal = unitPrice * quantity;
  const isFreeDelivery = itemsTotal >= (checkoutRules.free_delivery_above || 499) || true; // Free across Kerala
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

      // Auto redirect after celebration
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-600">Preparing secure checkout...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <HiExclamationCircle className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">No Product Selected</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Please select an item from the Kerala Marketplace to checkout.
        </p>
        <button
          onClick={() => navigate('/market')}
          className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20"
        >
          Go to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 2) setStep(1);
              else navigate(-1);
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <HiChevronLeft className="w-5 h-5" />
            <span>{step === 2 ? 'Back to Order Review' : 'Back'}</span>
          </button>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span
              className={`px-3 py-1 rounded-full ${
                step === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              1. Review Order
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={`px-3 py-1 rounded-full ${
                step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2. Payment
            </span>
          </div>
        </div>
      </header>

      {/* ── Checkout Container ── */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
            <HiExclamationCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── STEP 1: REVIEW YOUR ORDER ── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Delivery Address Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <HiLocationMarker className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Deliver To
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  {deliveryAddress?.address ? 'Change Address' : '+ Add Address'}
                </button>
              </div>

              {deliveryAddress?.address ? (
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900 text-sm">
                    {deliveryAddress.name}{' '}
                    <span className="text-slate-500 font-medium">({deliveryAddress.phone})</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {deliveryAddress.address}
                    {deliveryAddress.landmark ? `, ${deliveryAddress.landmark}` : ''},{' '}
                    {deliveryAddress.city || deliveryAddress.district}, Kerala -{' '}
                    <span className="font-mono font-bold text-slate-800">{deliveryAddress.pincode}</span>
                  </p>
                </div>
              ) : (
                <div className="py-2 text-center text-slate-500 text-xs">
                  <p>No delivery address found. Please enter your shipping details.</p>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="mt-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl"
                  >
                    Enter Address
                  </button>
                </div>
              )}
            </div>

            {/* Product Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-2.5 flex items-center justify-between text-xs font-bold text-blue-900">
                <div className="flex items-center gap-1.5">
                  <HiOutlineTruck className="w-4 h-4 text-blue-600" />
                  <span>Estimated Delivery by {getDeliveryDate()}</span>
                </div>
                <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                  Free Delivery
                </span>
              </div>

              <div className="p-5 flex gap-4 items-start">
                <img
                  src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                  alt={product.name}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                />
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{product.name}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded">
                      Size: {selectedSize}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>Sold by: {product.sellerName}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base font-black text-slate-900">
                      ₹{itemsTotal.toLocaleString('en-IN')}
                    </span>

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                      <button
                        onClick={() => setQuantity(Math.max(minRequiredQty, quantity - 1))}
                        disabled={quantity <= minRequiredQty}
                        className="p-1.5 hover:bg-slate-200 disabled:opacity-40 text-slate-600 transition-colors"
                      >
                        <HiMinus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-black text-slate-900 font-mono">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <HiPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Details Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Order Price Details
              </h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Price ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span className="font-semibold text-slate-800">
                    ₹{itemsTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-100">
                  <span>Order Total</span>
                  <span className="text-blue-600">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleProceedToPayment}
                  className="w-full py-3.5 px-6 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue to Payment Method</span>
                  <span className="text-blue-200 font-mono">→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: PAYMENT METHOD ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                Select Payment Option
              </h3>

              {/* Online Payment (UPI / Cards / Netbanking) */}
              <div
                onClick={() => setPaymentMethod('online')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'online'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'online'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {paymentMethod === 'online' && <HiCheck className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        Online Payment (Fast & Recommended)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Google Pay, PhonePe, Paytm, UPI, Credit/Debit Cards & Netbanking
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    100% SECURE
                  </span>
                </div>

                {paymentMethod === 'online' && (
                  <div className="mt-3 pt-3 border-t border-blue-100 flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg font-bold text-slate-700">
                      ⚡ Google Pay / PhonePe
                    </span>
                    <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg font-bold text-slate-700">
                      💳 Visa / Mastercard / RuPay
                    </span>
                    <span className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg font-bold text-slate-700">
                      🏦 Net Banking
                    </span>
                  </div>
                )}
              </div>

              {/* Cash on Delivery (COD) */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'cod'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {paymentMethod === 'cod' && <HiCheck className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        Cash on Delivery (Pay upon delivery)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Hand over cash to delivery partner when package arrives
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total & Place Order Button */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                <span>Total Amount Payable</span>
                <span className="text-xl text-blue-600">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isOrdering}
                className="w-full py-4 px-6 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isOrdering ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Placing Your Order...</span>
                  </>
                ) : (
                  <>
                    <HiShieldCheck className="w-5 h-5" />
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
        <div className="fixed inset-0 z-50 bg-[#1E3A8A] flex flex-col items-center justify-center text-white p-6 animate-fadeIn">
          <div className="w-24 h-24 rounded-full bg-white text-emerald-600 flex items-center justify-center mb-6 shadow-2xl animate-bounce">
            <HiCheckCircle className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <HiSparkles className="w-6 h-6 text-amber-300" />
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Order Placed!</h2>
            <HiSparkles className="w-6 h-6 text-amber-300" />
          </div>
          <p className="text-blue-100 text-sm text-center max-w-sm mb-4">
            Thank you for ordering with Logo Kerala Marketplace. Your package is being processed by the seller.
          </p>
          <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-xs font-mono font-bold tracking-wider">
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
