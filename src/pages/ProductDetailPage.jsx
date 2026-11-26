import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HiChevronLeft,
  HiChevronRight,
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
import {
  fetchProductById,
  getMarketCart,
  addToMarketCart,
  getSavedDeliveryAddress,
  fetchProductReviews,
  submitProductReview,
  getMarketplaceWishlist,
  addToMarketplaceWishlist,
  removeFromMarketplaceWishlist,
  isOwnProduct,
} from '../api/productApi';
import { isCustomerAuthenticated, getStoredCustomerUser } from '../api/customerApi';
import MarketCartDrawer from '../components/market/MarketCartDrawer';
import DeliveryAddressModal from '../components/market/DeliveryAddressModal';
import MobileAccountModal from '../components/MobileAccountModal';
import '../components/market/market-web.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomPos, setZoomPos] = useState({ active: false, x: 50, y: 50 });
  const [touchStartX, setTouchStartX] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Standard');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [reviewsData, setReviewsData] = useState({ reviews: [], total: 0, rating_average: 0, rating_count: 0 });
  const [customerUser, setCustomerUser] = useState(() =>
    isCustomerAuthenticated() ? getStoredCustomerUser() : null
  );
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountPromptMessage, setAccountPromptMessage] = useState('');

  // Reviews submission
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const loadProduct = async (isSiblingSwitch = false) => {
    if (!isSiblingSwitch) {
      setLoading(true);
    }
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
        setActiveImageIdx(0);
        if (prodRes.sizes && prodRes.sizes.length > 0) {
          const stkMap = prodRes.size_stocks || prodRes.sizeStocks || {};
          const firstAvail = prodRes.sizes.find((sz) => !(sz in stkMap) || Number(stkMap[sz]) > 0);
          setSelectedSize(firstAvail || prodRes.sizes[0]);
        }
        const itemPrice = Number(prodRes.price || 0);
        if (itemPrice > 0 && itemPrice < 150) {
          setQuantity(Math.ceil(150 / itemPrice));
        } else {
          setQuantity(1);
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
    const matchedSibling = product?.sub_products?.find((s) => String(s.id) === String(id));
    if (matchedSibling) {
      setProduct((prev) => ({
        ...prev,
        ...matchedSibling,
        sub_products: prev?.sub_products || [],
      }));
      setActiveImageIdx(0);
      if (matchedSibling.sizes && matchedSibling.sizes.length > 0) {
        setSelectedSize(matchedSibling.sizes[0]);
      }
      loadProduct(true);
    } else {
      loadProduct(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id]);

  useEffect(() => {
    const handleCartChanged = (e) => {
      const items = e?.detail || [];
      setCartCount(items.reduce((sum, it) => sum + Number(it.quantity || 1), 0));
    };
    window.addEventListener('logo-cart-changed', handleCartChanged);
    return () => window.removeEventListener('logo-cart-changed', handleCartChanged);
  }, []);

  const openCustomerAuth = (prompt = 'Please sign in with your Logo Kerala account to continue.') => {
    setAccountPromptMessage(prompt);
    setAccountModalOpen(true);
  };

  useEffect(() => {
    const handleSync = async () => {
      const authed = isCustomerAuthenticated();
      setCustomerUser(authed ? getStoredCustomerUser() : null);
      const saved = authed ? await getSavedDeliveryAddress() : null;
      setDeliveryAddress(saved?.address ? saved : null);
    };
    window.addEventListener('customer-session-changed', handleSync);
    window.addEventListener('logo-delivery-address-changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('customer-session-changed', handleSync);
      window.removeEventListener('logo-delivery-address-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleToggleWishlist = async () => {
    if (!product) return;
    if (!isCustomerAuthenticated()) {
      openCustomerAuth('Please sign in to save products to your Wishlist.');
      return;
    }
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
    if (!isCustomerAuthenticated()) {
      openCustomerAuth('Please sign in to add products to your cart and purchase.');
      return;
    }
    if (isOwnProduct(product, customerUser)) {
      showToast('Sellers cannot purchase their own listed product.');
      return;
    }
    const stkMap = product.size_stocks || product.sizeStocks || {};
    const szStk = selectedSize in stkMap ? Number(stkMap[selectedSize]) : product.stockQuantity;
    if (!product.inStock || product.stockStatus === 'OUT_OF_STOCK' || (szStk !== null && szStk !== undefined && Number(szStk) <= 0)) {
      showToast(selectedSize in stkMap && Number(stkMap[selectedSize]) <= 0 ? `Size "${selectedSize}" is out of stock.` : 'This product is currently out of stock.');
      return;
    }
    const itemPrice = Number(product.price || 0);
    const minQty = itemPrice > 0 && itemPrice < 150 ? Math.ceil(150 / itemPrice) : 1;
    const finalQty = Math.max(quantity, minQty);

    await addToMarketCart(product, finalQty, selectedSize);
    showToast(`Added ${finalQty}x "${product.name}" to Cart! 🛍️`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!isCustomerAuthenticated()) {
      openCustomerAuth('Sign in required: please sign in to purchase products.');
      return;
    }
    if (isOwnProduct(product, customerUser)) {
      showToast('Sellers cannot purchase their own listed product.');
      return;
    }
    const stkMap = product.size_stocks || product.sizeStocks || {};
    const szStk = selectedSize in stkMap ? Number(stkMap[selectedSize]) : product.stockQuantity;
    if (!product.inStock || product.stockStatus === 'OUT_OF_STOCK' || (szStk !== null && szStk !== undefined && Number(szStk) <= 0)) {
      showToast(selectedSize in stkMap && Number(stkMap[selectedSize]) <= 0 ? `Size "${selectedSize}" is out of stock.` : 'This product is currently out of stock.');
      return;
    }
    const itemPrice = Number(product.price || 0);
    const minQty = itemPrice > 0 && itemPrice < 150 ? Math.ceil(150 / itemPrice) : 1;
    const finalQty = Math.max(quantity, minQty);

    navigate(
      `/checkout?product_id=${product.id}&selected_size=${encodeURIComponent(
        selectedSize
      )}&quantity=${finalQty}`
    );
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!isCustomerAuthenticated()) {
      openCustomerAuth('Please sign in to submit a product review.');
      return;
    }
    if (!reviewTitle.trim() && !reviewComment.trim()) {
      setReviewError('Please enter a review title or comment.');
      return;
    }

    setSubmittingReview(true);
    try {
      await submitProductReview(id, {
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      const updatedRevs = await fetchProductReviews(id);
      if (updatedRevs) setReviewsData(updatedRevs);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
      showToast('Thank you! Your review has been published.');
    } catch (err) {
      setReviewError(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="mkt-page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid rgba(37, 99, 235, 0.2)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mkt-page-wrapper" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <HiExclamationCircle size={56} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>Product Not Found</h2>
        <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '360px', margin: '0 auto 20px' }}>
          The requested product may have been unlisted or removed by the seller.
        </p>
        <button
          type="button"
          onClick={() => navigate('/market')}
          style={{ padding: '10px 24px', fontSize: '13px', fontWeight: 800, color: '#fff', background: '#2563eb', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
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
  const ownProduct = isOwnProduct(product, customerUser);
  const sizeStocksMap = product.size_stocks || product.sizeStocks || {};
  const hasPerSizeStocks = Object.keys(sizeStocksMap).length > 0;
  const selectedSizeHasStock = hasPerSizeStocks && selectedSize in sizeStocksMap;
  const activeStockQty = selectedSizeHasStock
    ? Math.max(0, Number(sizeStocksMap[selectedSize] || 0))
    : product.stockQuantity;
  const isProductOutOfStock =
    !product.inStock ||
    product.stockStatus === 'OUT_OF_STOCK' ||
    (product.stockQuantity !== null && product.stockQuantity !== undefined && Number(product.stockQuantity) <= 0);
  const isOutOfStock =
    isProductOutOfStock ||
    (activeStockQty !== null && activeStockQty !== undefined && Number(activeStockQty) <= 0);
  const isLowStock =
    !isOutOfStock &&
    activeStockQty !== null &&
    activeStockQty !== undefined &&
    Number(activeStockQty) <= 5;

  const minRequiredQty = price > 0 && price < 150 ? Math.ceil(150 / price) : 1;

  return (
    <div className="mkt-page-wrapper" style={{ paddingBottom: '90px' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
                <span>/</span>
                <Link to="/market" style={{ color: 'inherit', textDecoration: 'none' }}>Market</Link>
                <span>/</span>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>{product.category}</span>
              </div>
            </div>

            <div className="mkt-nav-actions">
              <button type="button" onClick={handleShare} className="mkt-nav-back-btn" title="Share">
                <HiShare size={18} />
              </button>
              <button type="button" onClick={handleToggleWishlist} className="mkt-nav-back-btn" title="Wishlist">
                {isWishlisted ? <HiHeart size={20} color="#ef4444" /> : <HiOutlineHeart size={20} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartTab('cart');
                  setIsCartOpen(true);
                }}
                className="mkt-cart-trigger"
                title="Cart"
              >
                <HiShoppingBag size={20} />
                {cartCount > 0 && <span className="mkt-cart-badge">{cartCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Details Grid (Desktop 2-Col, Mobile Stacked) ── */}
      <main className="mkt-container">
        <div className="mkt-detail-grid">
          {/* ── Left Column: Image Gallery & Trust Guarantees ── */}
          <div className="mkt-gallery-wrap">
            <div
              className="mkt-gallery-main"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                setZoomPos({ active: true, x, y });
              }}
              onMouseLeave={() => setZoomPos({ active: false, x: 50, y: 50 })}
              onTouchStart={(e) => setTouchStartX(e.touches?.[0]?.clientX ?? null)}
              onTouchEnd={(e) => {
                if (touchStartX === null || images.length <= 1) return;
                const diff = (e.changedTouches?.[0]?.clientX ?? 0) - touchStartX;
                if (diff > 40) setActiveImageIdx((i) => (i - 1 + images.length) % images.length);
                else if (diff < -40) setActiveImageIdx((i) => (i + 1) % images.length);
                setTouchStartX(null);
              }}
            >
              <img
                src={images[activeImageIdx] || images[0]}
                alt={product.name}
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: zoomPos.active ? 'scale(2.15)' : 'scale(1)',
                  transition: zoomPos.active ? 'transform 0.04s ease-out' : 'transform 0.22s ease',
                  cursor: zoomPos.active ? 'zoom-out' : 'zoom-in',
                }}
              />
              {isOutOfStock ? (
                <span className="mkt-badge-stockout">OUT OF STOCK</span>
              ) : discount > 0 ? (
                <span className="mkt-badge-discount">{discount}% OFF</span>
              ) : (
                <span className="mkt-badge-deal">SPECIAL DEAL</span>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous image"
                    onMouseEnter={() => setZoomPos((p) => ({ ...p, active: false }))}
                    onClick={() => setActiveImageIdx((i) => (i - 1 + images.length) % images.length)}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(15, 23, 42, 0.58)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 5,
                    }}
                  >
                    <HiChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onMouseEnter={() => setZoomPos((p) => ({ ...p, active: false }))}
                    onClick={() => setActiveImageIdx((i) => (i + 1) % images.length)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(15, 23, 42, 0.58)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 5,
                    }}
                  >
                    <HiChevronRight size={20} />
                  </button>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 6,
                      padding: '5px 10px',
                      borderRadius: 999,
                      background: 'rgba(15, 23, 42, 0.5)',
                      zIndex: 5,
                    }}
                  >
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`Slide ${idx + 1}`}
                        onClick={() => setActiveImageIdx(idx)}
                        style={{
                          width: activeImageIdx === idx ? 18 : 7,
                          height: 7,
                          borderRadius: 999,
                          border: 'none',
                          padding: 0,
                          background: activeImageIdx === idx ? '#ffffff' : 'rgba(255,255,255,0.45)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sub-Products Thumbnail Strip (Exact old image-thumbnails spot directly below main slider & above Trust section) */}
            {Array.isArray(product.sub_products) && product.sub_products.length > 0 && (
              <div className="mkt-subthumbs-strip">
                {product.sub_products.map((sub) => {
                  const isCurrent = String(sub.id) === String(product.id);
                  const subOut = !sub.inStock || (sub.stockQuantity !== null && sub.stockQuantity !== undefined && Number(sub.stockQuantity) <= 0);
                  const sizeHint = Array.isArray(sub.sizes) && sub.sizes.length > 0 ? sub.sizes[0] : '';
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => !isCurrent && navigate(`/product/${sub.id}`)}
                      className={`mkt-subthumb-btn ${isCurrent ? 'is-active' : ''}`}
                      title={`${sub.name} — ₹${Number(sub.price || 0).toLocaleString('en-IN')}`}
                    >
                      <img
                        src={sub.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                        alt={sub.name}
                        className="mkt-subthumb-img"
                      />
                      <div className="mkt-subthumb-meta">
                        <div className="mkt-subthumb-name">{sub.name}</div>
                        <div className="mkt-subthumb-price" style={subOut ? { color: '#dc2626' } : undefined}>
                          ₹{Number(sub.price || 0).toLocaleString('en-IN')}
                          {sizeHint ? ` · ${sizeHint}` : ''}
                          {subOut ? ' · Out' : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Kerala Trust Guarantees Card */}
            <div className="mkt-trust-card">
              <h4 className="mkt-trust-title">Kerala Trust & Quality Assurance</h4>
              <div className="mkt-trust-grid">
                <div className="mkt-trust-item">
                  <HiOutlineShieldCheck size={18} color="#059669" />
                  <span>100% Authentic Kerala</span>
                </div>
                <div className="mkt-trust-item">
                  <HiOutlineTruck size={18} color="#2563eb" />
                  <span>Free Delivery Across Kerala</span>
                </div>
                <div className="mkt-trust-item">
                  <HiOutlineRefresh size={18} color="#4f46e5" />
                  <span>7 Days Easy Return</span>
                </div>
                <div className="mkt-trust-item">
                  <HiCheckCircle size={18} color="#d97706" />
                  <span>Cash on Delivery Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Info, Pricing, Size, CTA ── */}
          <div className="mkt-detail-info">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="mkt-detail-category-tag">{product.category}</span>
              </div>
              <h1 className="mkt-detail-heading">{product.name}</h1>

              <div className="mkt-detail-rating-row" style={{ marginTop: '8px' }}>
                <span className="mkt-card-rating-pill" style={{ padding: '3px 8px', fontSize: '11px' }}>
                  <span>{reviewsData.rating_count > 0 ? reviewsData.rating_average : (product.rating || 4.8)}</span>
                  <HiStar size={12} />
                </span>
                <span style={{ color: '#64748b', fontSize: '12px' }}>
                  {reviewsData.rating_count || 0} Ratings & Reviews
                </span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span style={{ color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 700 }}>
                  Verified Local Merchant
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="mkt-price-card">
              <div className="mkt-price-card-main">
                <span className="mkt-price-card-value">₹{price.toLocaleString('en-IN')}</span>
                {originalPrice > price && (
                  <>
                    <span className="mkt-price-card-orig">₹{originalPrice.toLocaleString('en-IN')}</span>
                    <span className="mkt-price-card-discount">
                      {discount}% OFF (Save ₹{(originalPrice - price).toLocaleString('en-IN')})
                    </span>
                  </>
                )}
              </div>
              <div className="mkt-price-card-sub">
                Inclusive of all taxes • <strong style={{ color: '#047857' }}>Free Delivery</strong> across all Kerala districts
              </div>
            </div>

            {/* Stock Alerts */}
            {isOutOfStock ? (
              <div className="mkt-stock-alert is-out-stock">
                <HiExclamationCircle size={18} />
                <span>
                  {!isProductOutOfStock && selectedSizeHasStock
                    ? `Size "${selectedSize}" is Out of Stock. Choose another size or check back soon.`
                    : 'Currently Out of Stock. Check back soon or contact seller.'}
                </span>
              </div>
            ) : isLowStock ? (
              <div className="mkt-stock-alert is-low-stock">
                <HiOutlineClock size={18} />
                <span>
                  Hurry! Only {activeStockQty} {selectedSizeHasStock ? `(${selectedSize}) ` : ''}items left in stock.
                </span>
              </div>
            ) : (
              <div className="mkt-stock-alert is-in-stock">
                <HiCheckCircle size={18} />
                <span>
                  {activeStockQty !== null && activeStockQty !== undefined
                    ? `In Stock • ${activeStockQty} units available${selectedSizeHasStock ? ` (${selectedSize})` : ''}`
                    : 'In Stock & Ready for Immediate Dispatch'}
                </span>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h4 className="mkt-size-section-title">Select Size / Variant</h4>
                <div className="mkt-size-chips-row">
                  {product.sizes.map((sz) => {
                    const hasSzStock = hasPerSizeStocks && sz in sizeStocksMap;
                    const szStockCount = hasSzStock ? Number(sizeStocksMap[sz] || 0) : null;
                    const szOut = isProductOutOfStock || (hasSzStock && szStockCount <= 0);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setSelectedSize(sz);
                          if (hasSzStock && szStockCount > 0 && quantity > szStockCount) {
                            setQuantity(Math.max(minRequiredQty, szStockCount));
                          }
                        }}
                        className={`mkt-size-chip ${selectedSize === sz ? 'is-active' : ''}`}
                        style={
                          szOut
                            ? {
                                opacity: 0.65,
                                borderColor: selectedSize === sz ? '#dc2626' : '#fca5a5',
                                background: selectedSize === sz ? '#fef2f2' : '#f8fafc',
                                color: '#991b1b',
                                textDecoration: 'line-through',
                              }
                            : undefined
                        }
                      >
                        {sz}{szOut ? ' (Out of Stock)' : hasSzStock && szStockCount <= 5 ? ` (${szStockCount} left)` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div>
                <h4 className="mkt-size-section-title">Quantity</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="mkt-qty-selector">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(minRequiredQty, quantity - 1))}
                      disabled={quantity <= minRequiredQty}
                      className="mkt-qty-btn"
                    >
                      <HiMinus size={14} />
                    </button>
                    <span className="mkt-qty-val">{quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) =>
                          activeStockQty !== null && activeStockQty !== undefined
                            ? Math.min(Number(activeStockQty), q + 1)
                            : q + 1
                        )
                      }
                      disabled={
                        activeStockQty !== null &&
                        activeStockQty !== undefined &&
                        quantity >= Number(activeStockQty)
                      }
                      className="mkt-qty-btn"
                    >
                      <HiPlus size={14} />
                    </button>
                  </div>

                  {price < 150 && (
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#92400e', background: '#fef3c7', padding: '6px 12px', borderRadius: '8px' }}>
                      Min. ₹150 order required (Min. {minRequiredQty} items)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons (Desktop / Tablet) */}
            {ownProduct ? (
              <div style={{ padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#92400e' }}>This is Your Listed Product</div>
                  <div style={{ fontSize: 12, color: '#b45309' }}>Sellers cannot purchase their own listing. Manage stock or edit details in My Products.</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard?tab=my-products')}
                  style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Manage in My Products →
                </button>
              </div>
            ) : (
              <div className="mkt-detail-cta-row" style={{ display: 'flex' }}>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="mkt-btn-add-cart"
                >
                  <HiShoppingBag size={18} />
                  <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="mkt-btn-buy-now"
                >
                  <span>{isOutOfStock ? 'Unavailable' : 'Buy Now'}</span>
                </button>
              </div>
            )}

            {/* Delivery Estimator Card */}
            <div className="mkt-trust-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <HiLocationMarker size={18} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h5 style={{ margin: '0 0 2px', fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                    {deliveryAddress?.address
                      ? `Deliver To: ${deliveryAddress.city || deliveryAddress.district || ''} - ${deliveryAddress.pincode || ''}`
                      : customerUser
                      ? 'No delivery address added yet'
                      : 'Sign in to add delivery address'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                    Estimated Delivery by <strong style={{ color: '#0f172a' }}>{new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isCustomerAuthenticated()) {
                    openCustomerAuth('Please sign in to set a delivery address.');
                    return;
                  }
                  setIsAddressModalOpen(true);
                }}
                style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {deliveryAddress?.address ? 'Change' : 'Add Address'}
              </button>
            </div>

            {/* Product Description Card (Below Delivery Address) */}
            <div className="mkt-trust-card">
              <h4 className="mkt-trust-title">Product Description</h4>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.65, color: '#334155', whiteSpace: 'pre-line' }}>
                {product.description || 'Authentic, handcrafted, and sourced from trusted local producers across Kerala.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Product Highlights (Left) & Additional Details (Right) Side-by-Side ── */}
        {((Array.isArray(product.highlights) && product.highlights.length > 0) ||
          (Array.isArray(product.additional_details) && product.additional_details.length > 0)) && (
          <div className="mkt-specs-two-col">
            {Array.isArray(product.highlights) && product.highlights.length > 0 && (
              <div className="mkt-trust-card">
                <h4 className="mkt-trust-title" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
                  Product Highlights
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 24px' }}>
                  {product.highlights.map((hl, idx) => (
                    <div key={idx}>
                      {hl.label && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px', fontWeight: 500 }}>
                          {hl.label}
                        </div>
                      )}
                      {hl.value && (
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>
                          {hl.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(product.additional_details) && product.additional_details.length > 0 && (
              <div className="mkt-trust-card">
                <h4 className="mkt-trust-title" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
                  Additional Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {product.additional_details.map((det, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(120px, 40%) 1fr',
                        gap: '12px',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#334155' }}>
                        {det.label}
                      </span>
                      <span style={{ fontSize: '13.5px', fontWeight: 400, color: '#0f172a' }}>
                        {det.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Full-Width Customer Reviews Section ── */}
        <div className="mkt-trust-card" style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h4 className="mkt-trust-title" style={{ margin: 0 }}>Customer Ratings & Reviews</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>Verified buyer feedback</p>
                </div>
                {!showReviewForm && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCustomerAuthenticated()) {
                        openCustomerAuth('Please sign in to submit a product review.');
                        return;
                      }
                      setShowReviewForm(true);
                    }}
                    className="mkt-btn-secondary"
                    style={{ display: 'inline-flex', padding: '6px 12px' }}
                  >
                    Rate & Review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                  <div className="mkt-form-group">
                    <label className="mkt-form-label">Your Rating</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        >
                          <HiStar size={22} color={star <= reviewRating ? '#f59e0b' : '#cbd5e1'} />
                        </button>
                      ))}
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', marginLeft: '8px' }}>{reviewRating} out of 5</span>
                    </div>
                  </div>

                  <div className="mkt-form-group">
                    <label className="mkt-form-label">Review Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Excellent quality & fast delivery!"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="mkt-form-input"
                    />
                  </div>

                  <div className="mkt-form-group">
                    <label className="mkt-form-label">Your Experience</label>
                    <textarea
                      rows={2}
                      placeholder="Share your detailed feedback..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="mkt-form-textarea"
                    />
                  </div>

                  {reviewError && (
                    <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                      {reviewError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" onClick={() => setShowReviewForm(false)} className="mkt-btn-secondary" style={{ display: 'inline-flex' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={submittingReview} className="mkt-btn-buy-now" style={{ flex: 'unset', padding: '8px 18px', fontSize: '12px' }}>
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
                  reviewsData.reviews.map((rev, i) => (
                    <div key={rev.id || i} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>{rev.buyer_name || rev.user_name || rev.author || 'Verified Buyer'}</strong>
                        <div style={{ display: 'flex', gap: '1px' }}>
                          {[...Array(Number(rev.rating || 5))].map((_, idx) => (
                            <HiStar key={idx} size={13} color="#f59e0b" />
                          ))}
                        </div>
                      </div>
                      {rev.title && <h5 style={{ margin: '2px 0', fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{rev.title}</h5>}
                      {rev.comment && <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>{rev.comment}</p>}
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Be the first customer to review this authentic Kerala item!
                  </p>
                )}
              </div>
            </div>
      </main>

      {/* ── Mobile Sticky Bottom Action Bar ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 16px',
          display: 'flex',
          gap: '10px',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
          zIndex: 40,
        }}
        className="mobile-sticky-bar"
      >
        {ownProduct ? (
          <button
            type="button"
            onClick={() => navigate('/dashboard?tab=my-products')}
            className="mkt-btn-buy-now"
            style={{ flex: 1, padding: '11px 18px', fontSize: '13px', background: '#0f172a' }}
          >
            <span>Manage Your Product in My Products →</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="mkt-btn-add-cart"
              style={{ flex: 1, padding: '11px 14px', fontSize: '13px' }}
            >
              <HiShoppingBag size={16} />
              <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="mkt-btn-buy-now"
              style={{ flex: 1.2, padding: '11px 18px', fontSize: '13px' }}
            >
              <span>{isOutOfStock ? 'Unavailable' : 'Buy Now'}</span>
            </button>
          </>
        )}
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && <div className="mkt-toast">{toastMessage}</div>}

      {/* ── Slide-Out Cart Drawer ── */}
      <MarketCartDrawer
        isOpen={isCartOpen}
        initialTab={cartTab}
        onClose={() => setIsCartOpen(false)}
        onOpenAddressModal={() => {
          if (!isCustomerAuthenticated()) {
            openCustomerAuth('Please sign in to set a delivery address.');
            return;
          }
          setIsAddressModalOpen(true);
        }}
        onRequireAuth={(msg) => openCustomerAuth(msg || 'Please sign in to proceed to checkout.')}
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

      {/* ── Customer Sign In / Account Modal ── */}
      <MobileAccountModal
        isOpen={accountModalOpen}
        onClose={() => {
          setAccountModalOpen(false);
          setAccountPromptMessage('');
        }}
        initialSection="customer-login"
        promptMessage={accountPromptMessage}
        onAuthSuccess={async (u) => {
          setCustomerUser(u || getStoredCustomerUser());
          const saved = await getSavedDeliveryAddress();
          setDeliveryAddress(saved?.address ? saved : null);
          setAccountModalOpen(false);
          setAccountPromptMessage('');
          showToast('Signed in successfully!');
        }}
      />
    </div>
  );
}
