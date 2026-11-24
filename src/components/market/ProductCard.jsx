import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiStar, HiHeart, HiOutlineHeart, HiOutlineShoppingBag } from 'react-icons/hi';
import './market-web.css';

export default function ProductCard({
  product,
  variant = 'grid',
  isWishlisted = false,
  onToggleWishlist,
  onQuickAddToCart,
}) {
  const navigate = useNavigate();
  if (!product) return null;

  const discount = Number(product.discountPercent || product.discount_percent || 0);
  const originalPrice = Number(product.originalPrice || product.original_price || 0);
  const price = Number(product.price || 0);
  const merchantName =
    product.sellerName ||
    product.seller_name ||
    product.merchant_name ||
    product.business_name ||
    'Kerala Seller';
  const rating = product.rating || '4.8';
  const reviewsCount = product.reviewsCount || product.reviews_count || product.reviews || '24';

  const isOutOfStock =
    product.in_stock === false ||
    product.inStock === false ||
    (product.stock_status || product.stockStatus || '').toUpperCase() === 'OUT_OF_STOCK' ||
    (product.stock_quantity !== undefined &&
      product.stock_quantity !== null &&
      Number(product.stock_quantity) <= 0) ||
    (product.stockQuantity !== undefined &&
      product.stockQuantity !== null &&
      Number(product.stockQuantity) <= 0);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (onQuickAddToCart) {
      onQuickAddToCart(product);
    }
  };

  // ── Horizontal Variant (for recommended carousels) ──
  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleCardClick}
        className="mkt-card mkt-card-horiz"
        style={{ width: '210px', flexShrink: 0 }}
      >
        <div className="mkt-card-img-wrap" style={{ height: '145px', aspectRatio: 'unset' }}>
          <img
            src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
            alt={product.name}
            className="mkt-card-img"
            loading="lazy"
          />

          {isOutOfStock ? (
            <span className="mkt-badge-stockout">OUT OF STOCK</span>
          ) : discount > 0 ? (
            <span className="mkt-badge-discount">{discount}% OFF</span>
          ) : (
            <span className="mkt-badge-deal">DEAL</span>
          )}

          <button
            type="button"
            onClick={handleWishlistClick}
            className="mkt-card-heart-btn"
            title="Wishlist"
          >
            {isWishlisted ? (
              <HiHeart size={16} color="#ef4444" />
            ) : (
              <HiOutlineHeart size={16} />
            )}
          </button>
        </div>

        <div className="mkt-card-content">
          <div>
            <h4 className="mkt-card-title" style={{ minHeight: 'unset', marginBottom: '4px' }}>
              {product.name}
            </h4>
            <div className="mkt-card-price-row">
              <span className="mkt-card-price">₹{price.toLocaleString('en-IN')}</span>
              {originalPrice > price && (
                <span className="mkt-card-original-price">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div className="mkt-card-footer">
            <div className="mkt-card-rating-wrap">
              <span className="mkt-card-rating-pill">
                <span>{rating}</span>
                <HiStar size={10} />
              </span>
            </div>
            <span className="mkt-card-delivery-tag">Free Delivery</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard Grid Variant (Market Screen) ──
  return (
    <div onClick={handleCardClick} className="mkt-card">
      {/* Product Image Container */}
      <div className="mkt-card-img-wrap">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
          alt={product.name}
          className="mkt-card-img"
          loading="lazy"
        />

        {/* Badges */}
        {isOutOfStock ? (
          <span className="mkt-badge-stockout">OUT OF STOCK</span>
        ) : discount > 0 ? (
          <span className="mkt-badge-discount">{discount}% OFF</span>
        ) : (
          <span className="mkt-badge-deal">SPECIAL DEAL</span>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label="Wishlist"
          className="mkt-card-heart-btn"
        >
          {isWishlisted ? (
            <HiHeart size={16} color="#ef4444" />
          ) : (
            <HiOutlineHeart size={16} />
          )}
        </button>

        {/* Store Pill */}
        <div className="mkt-card-store-pill">
          <span>{merchantName}</span>
          {product.district && (
            <span className="mkt-card-district">{product.district}</span>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="mkt-card-content">
        <div>
          <h3 className="mkt-card-title">{product.name}</h3>

          {/* Pricing Row */}
          <div className="mkt-card-price-row">
            <span className="mkt-card-price">₹{price.toLocaleString('en-IN')}</span>
            {originalPrice > price && (
              <span className="mkt-card-original-price">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            {discount > 0 && (
              <span className="mkt-card-save-text">
                Save ₹{(originalPrice - price).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Rating & Delivery Row */}
        <div className="mkt-card-footer">
          <div className="mkt-card-rating-wrap">
            <span className="mkt-card-rating-pill">
              <span>{rating}</span>
              <HiStar size={11} />
            </span>
            <span className="mkt-card-reviews-count">({reviewsCount})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="mkt-card-delivery-tag">Free Delivery</span>
            {onQuickAddToCart && !isOutOfStock && (
              <button
                type="button"
                onClick={handleQuickAdd}
                title="Add to Cart"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                  e.currentTarget.style.color = '#2563eb';
                }}
              >
                <HiOutlineShoppingBag size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
