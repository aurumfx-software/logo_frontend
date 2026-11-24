import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiStar, HiHeart, HiOutlineHeart, HiOutlineShoppingBag } from 'react-icons/hi';

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
        className="group relative flex flex-col w-48 sm:w-52 shrink-0 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer overflow-hidden"
      >
        <div className="relative w-full h-36 bg-slate-100 overflow-hidden">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Badges */}
          {isOutOfStock ? (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white bg-rose-600/90 rounded-md backdrop-blur-sm">
              OUT OF STOCK
            </span>
          ) : discount > 0 ? (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-extrabold text-white bg-emerald-600 rounded-md shadow-sm">
              {discount}% OFF
            </span>
          ) : (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-extrabold text-white bg-blue-600 rounded-md shadow-sm">
              DEAL
            </span>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlistClick}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center text-slate-700 hover:text-rose-500 hover:bg-white active:scale-90 transition-all"
          >
            {isWishlisted ? (
              <HiHeart className="w-4 h-4 text-rose-500" />
            ) : (
              <HiOutlineHeart className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="p-3 flex flex-col flex-1 justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h4>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-sm font-black text-slate-900">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {originalPrice > price && (
                <span className="text-[11px] text-slate-400 line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
            <div className="flex items-center gap-1 bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
              <span>{rating}</span>
              <HiStar className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-500 font-semibold">Free Delivery</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard Grid Variant (Market Screen) ──
  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Product Image Box */}
      <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        {isOutOfStock ? (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[10px] font-black tracking-wider text-white bg-rose-600 rounded-lg shadow-md">
            OUT OF STOCK
          </span>
        ) : discount > 0 ? (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[11px] font-black tracking-wide text-white bg-emerald-600 rounded-lg shadow-md">
            {discount}% OFF
          </span>
        ) : (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[11px] font-black tracking-wide text-white bg-blue-600 rounded-lg shadow-md">
            SPECIAL DEAL
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          aria-label="Wishlist"
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-700 hover:text-rose-500 hover:bg-white active:scale-90 transition-all z-10"
        >
          {isWishlisted ? (
            <HiHeart className="w-4 h-4 text-rose-500 animate-pulse" />
          ) : (
            <HiOutlineHeart className="w-4 h-4" />
          )}
        </button>

        {/* Store Pill */}
        <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-slate-900/75 backdrop-blur-md rounded-lg text-white text-[11px] font-medium truncate flex items-center justify-between">
          <span className="truncate">{merchantName}</span>
          {product.district && (
            <span className="text-[10px] text-blue-200 shrink-0 ml-1 font-normal">
              {product.district}
            </span>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between bg-white">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors min-h-[38px]">
            {product.name}
          </h3>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-base sm:text-lg font-black text-slate-900">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {originalPrice > price && (
              <span className="text-xs text-slate-400 line-through font-semibold">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            {discount > 0 && (
              <span className="text-xs font-extrabold text-emerald-600 hidden sm:inline">
                Save ₹{(originalPrice - price).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Rating & Delivery Row */}
        <div className="flex items-center justify-between gap-1 mt-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-emerald-600 text-white px-1.5 py-0.5 rounded-md font-extrabold text-[11px]">
              <span>{rating}</span>
              <HiStar className="w-3 h-3" />
            </div>
            <span className="text-slate-400 text-[11px] font-medium">({reviewsCount})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-bold text-[11px]">Free Delivery</span>
            {onQuickAddToCart && !isOutOfStock && (
              <button
                onClick={handleQuickAdd}
                title="Add to Cart"
                className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white flex items-center justify-center transition-colors active:scale-95"
              >
                <HiOutlineShoppingBag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
