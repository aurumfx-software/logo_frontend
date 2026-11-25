import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiStar, HiHeart, HiOutlineHeart } from 'react-icons/hi';
import { isOwnProduct } from '../../api/productApi';
import { getStoredCustomerUser, isCustomerAuthenticated } from '../../api/customerApi';
import './market-web.css';

export default function ProductCard({
  product,
  variant = 'grid',
  isWishlisted = false,
  onToggleWishlist,
}) {
  const navigate = useNavigate();
  if (!product) return null;

  const currentUser = isCustomerAuthenticated() ? getStoredCustomerUser() : null;
  const ownListing = isOwnProduct(product, currentUser);

  const discount = Number(product.discountPercent || product.discount_percent || 0);
  const originalPrice = Number(product.originalPrice || product.original_price || 0);
  const price = Number(product.price || 0);
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

  // ── Horizontal Variant (for recommended carousels) ──
  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleCardClick}
        className="mkt-card mkt-card-horiz"
        style={{ width: '200px', flexShrink: 0 }}
      >
        <div className="mkt-card-img-wrap" style={{ height: '150px', aspectRatio: 'unset' }}>
          <img
            src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
            alt={product.name}
            className="mkt-card-img"
            loading="lazy"
          />

          {isOutOfStock ? (
            <span className="mkt-badge-stockout">OUT OF STOCK</span>
          ) : ownListing ? (
            <span className="mkt-badge-deal" style={{ background: '#0f172a', color: '#ffffff' }}>YOUR LISTING</span>
          ) : discount > 0 ? (
            <span className="mkt-badge-discount">{discount}% OFF</span>
          ) : (
            <span className="mkt-badge-deal">SPECIAL</span>
          )}

          {onToggleWishlist && (
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
          )}
        </div>

        <div className="mkt-card-content">
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
            {discount > 0 && (
              <span className="mkt-card-discount-tag">{discount}% off</span>
            )}
          </div>

          <div className="mkt-card-footer">
            <div className="mkt-card-rating-wrap">
              <span className="mkt-card-rating-pill">
                <span>{rating}</span>
                <HiStar size={9} />
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>({reviewsCount})</span>
            </div>
            <span className="mkt-card-delivery-tag">Free Delivery</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard Grid Variant (Market Screen - Matches Mobile App ProductCard.js) ──
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
        ) : ownListing ? (
          <span className="mkt-badge-deal" style={{ background: '#0f172a', color: '#ffffff' }}>YOUR LISTING</span>
        ) : discount > 0 ? (
          <span className="mkt-badge-discount">{discount}% OFF</span>
        ) : (
          <span className="mkt-badge-deal">SPECIAL</span>
        )}

        {/* Wishlist Button */}
        {onToggleWishlist && (
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
        )}
      </div>

      {/* Card Content - Clean Typography, No Seller Name or Kannur */}
      <div className="mkt-card-content">
        {/* Product Title (2 lines clamp) */}
        <h4 className="mkt-card-title">{product.name}</h4>

        {/* Price & MRP Row */}
        <div className="mkt-card-price-row">
          <span className="mkt-card-price">₹{price.toLocaleString('en-IN')}</span>
          {originalPrice > price && (
            <span className="mkt-card-original-price">
              ₹{originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          {discount > 0 && (
            <span className="mkt-card-discount-tag">{discount}% off</span>
          )}
        </div>

        {/* Rating & Free Delivery Meta Row */}
        <div className="mkt-card-footer">
          <div className="mkt-card-rating-wrap">
            <span className="mkt-card-rating-pill">
              <span>{rating}</span>
              <HiStar size={10} />
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>({reviewsCount})</span>
            <span style={{ color: '#cbd5e1', fontSize: '10px' }}>•</span>
            <span className="mkt-card-delivery-tag">Free Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
}
