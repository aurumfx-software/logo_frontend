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
import '../components/market/market-web.css';

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

  // Reviews submission
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
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
        const itemPrice = Number(prodRes.price || 0);
        if (itemPrice > 0 && itemPrice < 150) {
          setQuantity(Math.ceil(150 / itemPrice));
        } else {
          setQuantity(1);
        }

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
      await submitOrderReview(id, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
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
  const isOutOfStock = !product.inStock || product.stockStatus === 'OUT_OF_STOCK';
  const isLowStock =
    !isOutOfStock &&
    product.stockQuantity !== null &&
    product.stockQuantity !== undefined &&
    Number(product.stockQuantity) <= 5;

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
            <div className="mkt-gallery-main">
              <img
                src={images[activeImageIdx] || images[0]}
                alt={product.name}
              />
              {isOutOfStock ? (
                <span className="mkt-badge-stockout">OUT OF STOCK</span>
              ) : discount > 0 ? (
                <span className="mkt-badge-discount">{discount}% OFF</span>
              ) : (
                <span className="mkt-badge-deal">SPECIAL DEAL</span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="mkt-gallery-thumbs">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`mkt-gallery-thumb-btn ${activeImageIdx === idx ? 'is-active' : ''}`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} />
                  </button>
                ))}
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
                {product.district && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#64748b' }}>
                    <HiLocationMarker size={14} color="#64748b" />
                    {product.district}, Kerala
                  </span>
                )}
              </div>
              <h1 className="mkt-detail-heading">{product.name}</h1>

              <div className="mkt-detail-rating-row" style={{ marginTop: '8px' }}>
                <span className="mkt-card-rating-pill" style={{ padding: '3px 8px', fontSize: '11px' }}>
                  <span>{reviewsData.rating_average || product.rating || 4.8}</span>
                  <HiStar size={12} />
                </span>
                <span style={{ color: '#64748b', fontSize: '12px' }}>
                  {reviewsData.rating_count || product.reviewsCount || 24} Ratings & Reviews
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
                <span>Currently Out of Stock. Check back soon or contact seller.</span>
              </div>
            ) : isLowStock ? (
              <div className="mkt-stock-alert is-low-stock">
                <HiOutlineClock size={18} />
                <span>Hurry! Only {product.stockQuantity} items left in stock.</span>
              </div>
            ) : (
              <div className="mkt-stock-alert is-in-stock">
                <HiCheckCircle size={18} />
                <span>In Stock & Ready for Immediate Dispatch</span>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h4 className="mkt-size-section-title">Select Size / Variant</h4>
                <div className="mkt-size-chips-row">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`mkt-size-chip ${selectedSize === sz ? 'is-active' : ''}`}
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
                      onClick={() => setQuantity(quantity + 1)}
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
            <div className="mkt-detail-cta-row" style={{ display: 'flex' }}>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="mkt-btn-add-cart"
              >
                <HiShoppingBag size={18} />
                <span>Add to Cart</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="mkt-btn-buy-now"
              >
                <span>Buy Now</span>
              </button>
            </div>

            {/* Delivery Estimator Card */}
            <div className="mkt-trust-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <HiLocationMarker size={18} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <h5 style={{ margin: '0 0 2px', fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                    Deliver To: {deliveryAddress?.city || deliveryAddress?.district || 'Kerala'} - {deliveryAddress?.pincode || '695121'}
                  </h5>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                    Estimated Delivery by <strong style={{ color: '#0f172a' }}>{new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Change
              </button>
            </div>

            {/* Seller Contact Card */}
            <div className="mkt-seller-card">
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Sold By</span>
                <h4 style={{ margin: '2px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{product.sellerName}</h4>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>{product.district || 'Kerala'} • Verified Local Seller</p>
              </div>

              {(product.sellerPhone || product.sellerWhatsapp) && (
                <a
                  href={`https://wa.me/91${String(product.sellerWhatsapp || product.sellerPhone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello! Inquiring regarding "${product.name}" on Logo Marketplace.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mkt-whatsapp-btn"
                >
                  <FaWhatsapp size={16} />
                  <span>Chat with Seller</span>
                </a>
              )}
            </div>

            {/* Description Card */}
            <div className="mkt-trust-card">
              <h4 className="mkt-trust-title">Product Description</h4>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-line' }}>
                {product.description || 'Authentic, handcrafted, and sourced from trusted local producers across Kerala.'}
              </p>
            </div>

            {/* Customer Reviews Section */}
            <div className="mkt-trust-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <h4 className="mkt-trust-title" style={{ margin: 0 }}>Customer Ratings & Reviews</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>Verified buyer feedback</p>
                </div>
                {!showReviewForm && (
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(true)}
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
                    <div key={i} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <strong style={{ fontSize: '12px', color: '#0f172a' }}>{rev.user_name || rev.author || 'Verified Buyer'}</strong>
                        <div style={{ display: 'flex', gap: '1px' }}>
                          {[...Array(Number(rev.rating || 5))].map((_, idx) => (
                            <HiStar key={idx} size={13} color="#f59e0b" />
                          ))}
                        </div>
                      </div>
                      {rev.title && <h5 style={{ margin: '2px 0', fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>{rev.title}</h5>}
                      <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Be the first customer to review this authentic Kerala item!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Similar Products Row ── */}
        {similarProducts.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 16px', color: '#0f172a' }}>
              More in {product.category}
            </h3>
            <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 0' }}>
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
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="mkt-btn-add-cart"
          style={{ flex: 1, padding: '11px 14px', fontSize: '13px' }}
        >
          <HiShoppingBag size={16} />
          <span>Add to Cart</span>
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="mkt-btn-buy-now"
          style={{ flex: 1.2, padding: '11px 18px', fontSize: '13px' }}
        >
          <span>Buy Now</span>
        </button>
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && <div className="mkt-toast">{toastMessage}</div>}

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
