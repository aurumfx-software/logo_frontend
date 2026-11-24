import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HiChevronLeft,
  HiShoppingBag,
  HiHeart,
  HiOutlineHeart,
  HiShare,
  HiStar,
  HiLocationMarker,
  HiCheckCircle,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineRefresh,
  HiExclamationCircle,
  HiPlus,
  HiMinus,
  HiOutlineClock,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import {
  fetchProductById,
  fetchPublicProducts,
  getMarketCart,
  addToMarketCart,
  getSavedDeliveryAddress,
  fetchProductReviews,
  submitOrderReview,
  getMarketplaceWishlist,
  addToMarketplaceWishlist,
  removeFromMarketplaceWishlist,
} from '../api/productApi';
import ProductCard from '../components/market/ProductCard';
import MarketCartDrawer from '../components/market/MarketCartDrawer';
import DeliveryAddressModal from '../components/market/DeliveryAddressModal';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('Standard');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [reviewsData, setReviewsData] = useState({ reviews: [], rating_average: 4.8, rating_count: 24 });

  // Reviews submission state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Cart & Drawers
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTab, setCartTab] = useState('cart');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadProduct = async () => {
    setLoading(true);
    try {
      const [prodRes, addr, cart, revs, wish] = await Promise.all([
        fetchProductById(id),
        getSavedDeliveryAddress(),
        getMarketCart(),
        fetchProductReviews(id),
        getMarketplaceWishlist(),
      ]);

      if (prodRes) {
        setProduct(prodRes);
        if (prodRes.sizes && prodRes.sizes.length > 0) {
          setSelectedSize(prodRes.sizes[0]);
        }
        // Check minimum quantity rule
        const itemPrice = Number(prodRes.price || 0);
        if (itemPrice > 0 && itemPrice < 150) {
          setQuantity(Math.ceil(150 / itemPrice));
        } else {
          setQuantity(1);
        }

        // Fetch similar products in category
        if (prodRes.category) {
          fetchPublicProducts({ category: prodRes.category, limit: 8 })
            .then((sim) => {
              setSimilarProducts((sim || []).filter((p) => String(p.id) !== String(id)));
            })
            .catch(() => {});
        }
      }

      setDeliveryAddress(addr);
      setCartCount((cart || []).reduce((sum, it) => sum + Number(it.quantity || 1), 0));
      if (revs) setReviewsData(revs);
      if (wish?.items && Array.isArray(wish.items)) {
        setIsWishlisted(wish.items.some((it) => String(it.product_id || it.id) === String(id)));
      }
    } catch (err) {
      console.warn('Failed to load product detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Real-time cart listener
  useEffect(() => {
    const handleCartChanged = (e) => {
      const items = e?.detail || [];
      setCartCount(items.reduce((sum, it) => sum + Number(it.quantity || 1), 0));
    };
    window.addEventListener('logo-cart-changed', handleCartChanged);
    return () => window.removeEventListener('logo-cart-changed', handleCartChanged);
  }, []);

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      if (isWishlisted) {
        setIsWishlisted(false);
        await removeFromMarketplaceWishlist(product.id);
        showToast('Removed from Wishlist');
      } else {
        setIsWishlisted(true);
        await addToMarketplaceWishlist(product.id);
        showToast('Saved to Wishlist ❤️');
      }
    } catch (err) {
      console.warn('Wishlist error:', err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name || 'Kerala Marketplace',
        text: `Check out ${product?.name} on Logo Marketplace!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard! 📋');
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const itemPrice = Number(product.price || 0);
    const minQty = itemPrice > 0 && itemPrice < 150 ? Math.ceil(150 / itemPrice) : 1;
    const finalQty = Math.max(quantity, minQty);

    await addToMarketCart(product, finalQty, selectedSize);
    showToast(`Added ${finalQty}x "${product.name}" to Cart! 🛍️`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const itemPrice = Number(product.price || 0);
    const minQty = itemPrice > 0 && itemPrice < 150 ? Math.ceil(150 / itemPrice) : 1;
    const finalQty = Math.max(quantity, minQty);

    // Direct checkout navigation matching mobile
    navigate(
      `/checkout?product_id=${product.id}&selected_size=${encodeURIComponent(
        selectedSize
      )}&quantity=${finalQty}`
    );
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewTitle.trim() && !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      // Create review on backend
      await submitOrderReview(id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      setReviewSubmitted(true);
      showToast('Thank you! Your review has been submitted.');
      setShowReviewForm(false);
    } catch (err) {
      alert(err?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-600">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <HiExclamationCircle className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The requested product may have been unlisted or removed by the seller.
        </p>
        <button
          onClick={() => navigate('/market')}
          className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'];

  const discount = Number(product.discountPercent || product.discount_percent || 0);
  const originalPrice = Number(product.originalPrice || product.original_price || 0);
  const price = Number(product.price || 0);
  const isOutOfStock = !product.inStock || product.stockStatus === 'OUT_OF_STOCK';
  const isLowStock =
    !isOutOfStock &&
    product.stockQuantity !== null &&
    product.stockQuantity !== undefined &&
    Number(product.stockQuantity) <= 5;

  const minRequiredQty = price > 0 && price < 150 ? Math.ceil(150 / price) : 1;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 lg:pb-12">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Back"
              >
                <HiChevronLeft className="w-5 h-5" />
              </button>
              <nav className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Link to="/" className="hover:text-blue-600">Home</Link>
                <span>/</span>
                <Link to="/market" className="hover:text-blue-600">Market</Link>
                <span>/</span>
                <span className="text-slate-800 font-bold truncate max-w-xs">{product.category}</span>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                title="Share Product"
              >
                <HiShare className="w-5 h-5" />
              </button>
              <button
                onClick={handleToggleWishlist}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                title="Wishlist"
              >
                {isWishlisted ? (
                  <HiHeart className="w-5 h-5 text-rose-500" />
                ) : (
                  <HiOutlineHeart className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => {
                  setCartTab('cart');
                  setIsCartOpen(true);
                }}
                className="relative p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                title="Cart"
              >
                <HiShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[11px] font-black rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Details Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Column: Image Gallery (5 cols) ── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square w-full bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden group">
              <img
                src={images[activeImageIdx] || images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Badges */}
              {isOutOfStock ? (
                <span className="absolute top-4 left-4 px-3 py-1 text-xs font-black tracking-wider text-white bg-rose-600 rounded-lg shadow-md">
                  OUT OF STOCK
                </span>
              ) : discount > 0 ? (
                <span className="absolute top-4 left-4 px-3 py-1 text-xs font-black tracking-wide text-white bg-emerald-600 rounded-lg shadow-md">
                  {discount}% OFF
                </span>
              ) : (
                <span className="absolute top-4 left-4 px-3 py-1 text-xs font-black tracking-wide text-white bg-blue-600 rounded-lg shadow-md">
                  SPECIAL DEAL
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIdx === idx
                        ? 'border-blue-600 shadow-md ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Kerala Trust Guarantees */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Kerala Trust & Quality Assurance
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <HiOutlineShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">100% Authentic Kerala</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineTruck className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="font-semibold">Free Delivery Across Kerala</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineRefresh className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span className="font-semibold">7 Days Easy Return</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiCheckCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="font-semibold">Cash on Delivery Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Product Info & Buy Box (7 cols) ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title & Brand */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
                <span className="bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {product.category}
                </span>
                {product.district && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <HiLocationMarker className="w-3.5 h-3.5 text-slate-400" />
                    {product.district}, Kerala
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {product.name}
              </h1>

              {/* Rating & Review summary */}
              <div className="flex items-center gap-3 mt-2.5">
                <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-md font-black text-xs">
                  <span>{reviewsData.rating_average || product.rating || 4.8}</span>
                  <HiStar className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {reviewsData.rating_count || product.reviewsCount || 24} Ratings & Reviews
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Verified Local Merchant
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                {originalPrice > price && (
                  <>
                    <span className="text-base text-slate-400 line-through font-semibold">
                      ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      {discount}% OFF (Save ₹{(originalPrice - price).toLocaleString('en-IN')})
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Inclusive of all taxes • <span className="text-emerald-700 font-bold">Free Delivery</span>
              </p>
            </div>

            {/* Stock Alerts */}
            {isOutOfStock ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <HiExclamationCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Currently Out of Stock. Check back soon or contact seller.</span>
              </div>
            ) : isLowStock ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center gap-2">
                <HiOutlineClock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Hurry! Only {product.stockQuantity} items left in stock.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                <span>In Stock & Ready for Dispatch</span>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Size / Variant
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedSize === sz
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-600/20'
                          : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm">
                    <button
                      onClick={() => setQuantity(Math.max(minRequiredQty, quantity - 1))}
                      disabled={quantity <= minRequiredQty}
                      className="p-2 hover:bg-slate-100 disabled:opacity-40 text-slate-600 transition-colors"
                    >
                      <HiMinus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-black text-slate-900 font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <HiPlus className="w-4 h-4" />
                    </button>
                  </div>

                  {price < 150 && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      Min. ₹150 order required (Min. {minRequiredQty} items)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex items-center gap-4 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 px-6 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border-2 border-blue-600 rounded-xl transition-all disabled:opacity-50 active:scale-98 flex items-center justify-center gap-2"
              >
                <HiShoppingBag className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1.2 py-3.5 px-8 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 active:scale-98 flex items-center justify-center gap-2"
              >
                <span>Buy Now</span>
              </button>
            </div>

            {/* Delivery Estimator Card */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <HiLocationMarker className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Deliver To: {deliveryAddress?.city || deliveryAddress?.district || 'Kerala'} -{' '}
                    {deliveryAddress?.pincode || '695121'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Estimated Delivery by{' '}
                    <span className="font-bold text-slate-800">
                      {new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="text-xs font-bold text-blue-600 hover:underline shrink-0"
              >
                Change
              </button>
            </div>

            {/* Seller Contact Card */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Sold By
                </span>
                <h4 className="text-sm font-black text-slate-900">{product.sellerName}</h4>
                <p className="text-xs text-slate-500">
                  {product.district || 'Kerala'} • Registered Merchant
                </p>
              </div>

              {(product.sellerPhone || product.sellerWhatsapp) && (
                <a
                  href={`https://wa.me/91${String(
                    product.sellerWhatsapp || product.sellerPhone
                  ).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello! Inquiring regarding "${product.name}" listed on Logo Marketplace.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  <span>Chat with Seller</span>
                </a>
              )}
            </div>

            {/* Description */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Product Description
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description ||
                  'Authentic, handcrafted, and carefully sourced product from trusted local sellers across Kerala.'}
              </p>
            </div>

            {/* Customer Reviews Section */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Customer Ratings & Reviews
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified buyer feedback from across Kerala
                  </p>
                </div>
                {!showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
                  >
                    Rate & Review
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form
                  onSubmit={handleSubmitReview}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fadeIn"
                >
                  <h4 className="text-xs font-bold text-slate-800">Write Your Review</h4>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <HiStar
                            className={`w-5 h-5 ${
                              star <= reviewRating ? 'text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {reviewRating} out of 5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Great quality Kasavu saree!"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Detailed Review
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Share your experience with this item..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-3 pt-2">
                {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                  reviewsData.reviews.map((rev, i) => (
                    <div key={i} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {rev.user_name || rev.author || 'Verified Buyer'}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[...Array(Number(rev.rating || 5))].map((_, idx) => (
                            <HiStar key={idx} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      {rev.title && (
                        <h5 className="text-xs font-bold text-slate-700 mt-1">{rev.title}</h5>
                      )}
                      <p className="text-xs text-slate-600 mt-0.5">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Be the first customer to review this authentic Kerala product!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Similar Products Row ── */}
        {similarProducts.length > 0 && (
          <div className="mt-12 space-y-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              More in {product.category}
            </h3>
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
              {similarProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  variant="horizontal"
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Mobile Sticky Bottom Action Bar ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 p-3 flex items-center gap-3 shadow-2xl">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1 py-3 px-4 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-600 rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <HiShoppingBag className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
        <button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="flex-1.2 py-3 px-6 text-xs font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center"
        >
          <span>Buy Now</span>
        </button>
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-slate-900/95 text-white text-xs font-bold shadow-2xl backdrop-blur-sm animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* ── Slide-Out Cart Drawer ── */}
      <MarketCartDrawer
        isOpen={isCartOpen}
        initialTab={cartTab}
        onClose={() => setIsCartOpen(false)}
        onOpenAddressModal={() => setIsAddressModalOpen(true)}
      />

      {/* ── Delivery Address Modal ── */}
      <DeliveryAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressSaved={(addr) => {
          setDeliveryAddress(addr);
          showToast('Delivery address updated!');
        }}
      />
    </div>
  );
}
