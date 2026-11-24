import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  HiCheckCircle,
  HiOutlineTruck,
  HiLocationMarker,
  HiShare,
  HiOutlineShoppingBag,
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

  // Delivery date: 4 days from today
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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-600">Loading order receipt...</p>
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
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* ── Top Header ── */}
      <header className="bg-white border-b border-slate-200/80 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <HiCheckCircle className="w-5 h-5" />
            </div>
            <h1 className="text-base sm:text-lg font-black text-emerald-700 tracking-tight">
              Order Confirmed
            </h1>
          </div>

          <button
            onClick={() => navigate('/market')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Continue Shopping"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Deliver To Destination Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
            <HiLocationMarker className="w-4 h-4 text-blue-600" />
            <span>Delivery Destination</span>
          </div>
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-900 text-sm">
              {customerName} <span className="text-slate-500 font-normal">({customerPhone})</span>
            </p>
            <p className="text-slate-600 leading-relaxed">{fullAddress}</p>
          </div>
        </div>

        {/* Product Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
              1 Item in Order
            </span>
            <button
              onClick={() => navigate(`/order/${orderId}`)}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Track Order</span>
              <HiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Delivery estimate banner */}
          <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-2.5 flex items-center gap-2 text-xs font-bold text-blue-900">
            <HiOutlineTruck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Estimated Delivery: {getDeliveryDate()}</span>
          </div>

          <div className="p-5 flex gap-4 items-center">
            <img
              src={prodImg}
              alt={prodTitle}
              className="w-20 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
            />
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{prodTitle}</h3>
              <p className="text-xs text-slate-500">
                Size: <span className="font-semibold text-slate-700">{size}</span> • Qty:{' '}
                <span className="font-semibold text-slate-700">{quantity}</span>
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-black text-slate-900">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
                <button
                  onClick={handleShare}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <HiShare className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Mode Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-semibold">Payment Mode</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">
              {paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Paid Online (UPI / Card)'}
            </p>
          </div>
          <span className="text-base font-black text-slate-900">
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate(`/order/${orderId}`)}
            className="flex-1 py-3.5 px-6 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-lg shadow-blue-600/25 transition-all text-center"
          >
            Live Tracking & Delivery Status
          </button>
          <button
            onClick={() => navigate('/market')}
            className="flex-1 py-3.5 px-6 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all text-center"
          >
            Continue Shopping
          </button>
        </div>

        {/* Recommended Products */}
        {recommendedProducts.length > 0 && (
          <div className="pt-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">You Might Also Like</h3>
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
