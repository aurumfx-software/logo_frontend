import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiChevronLeft,
  HiCheckCircle,
  HiOutlineTruck,
  HiLocationMarker,
  HiPhone,
  HiStar,
  HiExclamationCircle,
  HiExternalLink,
  HiX,
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-600">Loading live tracking details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <HiExclamationCircle className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          We could not find order details for #{id}.
        </p>
        <button
          onClick={() => navigate('/market')}
          className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl"
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
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Order #{order.order_code || id}
              </h1>
              <p className="text-[11px] text-slate-500">Placed on {placedDateStr}</p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isCancelled
                ? 'bg-rose-100 text-rose-700'
                : isDelivered
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {status}
          </span>
        </div>
      </header>

      {/* ── Main Tracking Body ── */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* If Cancelled Alert */}
        {isCancelled && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-rose-700 font-black text-xs uppercase tracking-wider">
              <HiExclamationCircle className="w-4 h-4" />
              <span>Order Cancelled</span>
            </div>
            <p className="text-xs text-rose-800">
              Reason: {order.cancellation_reason || 'Cancelled by buyer'}
            </p>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <HiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                If paid online, refund is processed directly to your source account within 24–48
                hours.
              </span>
            </div>
          </div>
        )}

        {/* Live Tracking Timeline Stepper */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HiOutlineTruck className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Live Delivery Tracking
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Est. Delivery:{' '}
                <span className="text-blue-600">
                  {formatDateWithOffset(order.placed_at, 4)}
                </span>
              </span>
            </div>

            {/* Stepper */}
            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {TRACKING_STEPS.map((st, idx) => {
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;

                return (
                  <div key={st.key} className="relative flex items-start gap-4">
                    {/* Dot */}
                    <div
                      className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isPassed
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <HiCheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2">
                        <h4
                          className={`text-xs font-black ${
                            isCurrent ? 'text-blue-600' : isPassed ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {st.label}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {formatDateWithOffset(order.placed_at, st.offsetDays)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {idx === 0 && 'Order confirmed by local Kerala merchant'}
                        {idx === 1 && 'Package packed & dispatched with courier partner'}
                        {idx === 2 && 'Package arrived at local delivery hub'}
                        {idx === 3 && 'Courier partner delivering to your doorstep'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Courier Partner Card (If available) */}
        {order.courier_partner && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Courier Dispatch
              </span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                {order.courier_partner}{' '}
                {order.tracking_number && (
                  <span className="text-slate-500 font-normal">
                    (Tracking #{order.tracking_number})
                  </span>
                )}
              </h4>
            </div>

            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold flex items-center gap-1 transition-colors"
              >
                <span>Track on Carrier</span>
                <HiExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Ordered Item Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex gap-4 items-center">
          <img
            src={
              order.product_image ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'
            }
            alt={order.product_name}
            className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
          />
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              {order.product_name || 'Marketplace Item'}
            </h3>
            <p className="text-xs text-slate-500">
              Size: {order.selected_size || 'Standard'} • Qty: {order.quantity || 1}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-base font-black text-slate-900">
                ₹{(Number(order.total_amount) || Number(order.price) || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
              </span>
            </div>
          </div>
        </div>

        {/* Deliver To Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
            <HiLocationMarker className="w-4 h-4 text-blue-600" />
            <span>Shipping Address</span>
          </div>
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-900">
              {order.buyer_name || deliveryAddress?.name || 'Customer'}{' '}
              <span className="text-slate-500 font-normal">
                ({order.buyer_phone || deliveryAddress?.phone})
              </span>
            </p>
            <p className="text-slate-600 leading-relaxed">
              {order.buyer_address || deliveryAddress?.address},{' '}
              {order.buyer_city || order.buyer_district || deliveryAddress?.district}, Kerala -{' '}
              {order.buyer_pincode || deliveryAddress?.pincode}
            </p>
          </div>
        </div>

        {/* Seller Info & Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Seller
            </span>
            <h4 className="text-sm font-bold text-slate-900">
              {order.seller_name || 'Subscribed Kerala Seller'}
            </h4>
            <p className="text-xs text-slate-500">Ready to assist with your delivery questions</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(order.seller_phone || order.seller_whatsapp) && (
              <a
                href={`https://wa.me/91${String(
                  order.seller_whatsapp || order.seller_phone
                ).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Inquiring regarding my order #${order.order_code || id} for "${order.product_name}".`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span>WhatsApp Seller</span>
              </a>
            )}

            {!isCancelled && !isDelivered && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 sm:flex-initial px-4 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {/* Rate & Review Card (If delivered or received) */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Rate Your Experience
            </h3>
            {reviewSubmitted ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Your review has been submitted! Thank you.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <HiStar
                        className={`w-6 h-6 ${
                          star <= reviewRating ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {reviewRating} out of 5 stars
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Review Title (e.g. Excellent packaging & swift delivery)"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                />

                <textarea
                  rows={2}
                  placeholder="Share details about the quality and packaging..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 resize-none"
                />

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="py-2 px-5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <div className="pt-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">Explore More Products</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
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
