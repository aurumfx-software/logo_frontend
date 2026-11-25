import React, { useState, useRef } from 'react';
import {
  HiStar,
  HiLocationMarker,
  HiPhone,
  HiCheckCircle,
  HiClock,
  HiChevronLeft,
  HiChevronRight,
  HiPlay,
} from 'react-icons/hi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { extractMerchantMedia } from '../../api/merchantApi';

export default function ZeashellMerchantCard({
  merchant,
  userCoordinates,
  merchantCoords,
  isFavorite = false,
  onToggleFavorite,
  onViewShop,
  onDirections,
  onCall,
}) {
  const shopName = merchant.business_name || merchant.name || 'Local Business';
  const categoryName = merchant.category || (merchant.categories && merchant.categories[0]) || 'General';
  const locationText = merchant.city || merchant.location || merchant.district || 'Kerala';
  const exactPlace = merchant.place || merchant.city || merchant.town || merchant.location || merchant.district || 'Kerala';
  const displayDistrict = merchant.district && merchant.district.toLowerCase() !== exactPlace.toLowerCase() ? merchant.district : '';
  const placeBadge = displayDistrict ? `${exactPlace}, ${displayDistrict}` : exactPlace;
  const phoneText =
    merchant.phone ||
    merchant.phone_number ||
    merchant.contact_number ||
    merchant.whatsapp ||
    merchant.mobile ||
    '';
  const ratingValue = merchant.rating ? Number(merchant.rating).toFixed(1) : '4.8';
  const reviewCount = merchant.reviews_count || merchant.reviews || 42;

  const [hasImgError, setHasImgError] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartX = useRef(null);

  const media = extractMerchantMedia(merchant);
  const cardPhotos = media.photos;
  const hasVideo = Boolean(media.videoUrl);
  const coverImage = cardPhotos[activeSlide] || cardPhotos[0] || '';
  const hasValidImage = Boolean(coverImage && !hasImgError);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || cardPhotos.length <= 1) return;
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartX.current;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 30) {
      e.stopPropagation();
      if (diff > 0) {
        setActiveSlide((prev) => (prev + 1) % cardPhotos.length);
      } else {
        setActiveSlide((prev) => (prev - 1 + cardPhotos.length) % cardPhotos.length);
      }
    }
    touchStartX.current = null;
  };

  // Distance calculation via Haversine formula
  const distanceText = React.useMemo(() => {
    if (!userCoordinates || !userCoordinates.lat || !userCoordinates.lng) return null;
    const mLat = merchantCoords?.lat || (merchant.latitude ? Number(merchant.latitude) : null);
    const mLng = merchantCoords?.lng || (merchant.longitude ? Number(merchant.longitude) : null);
    if (!mLat || !mLng) return null;

    const R = 6371; // km
    const dLat = ((mLat - userCoordinates.lat) * Math.PI) / 180;
    const dLon = ((mLng - userCoordinates.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userCoordinates.lat * Math.PI) / 180) *
        Math.cos((mLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    if (dist < 1) {
      return `${Math.round(dist * 1000)} m away`;
    }
    return `${dist.toFixed(1)} km away`;
  }, [userCoordinates, merchantCoords, merchant.latitude, merchant.longitude]);

  return (
    <article
      className="zeas-blue-merchant-card"
      onClick={() => onViewShop && onViewShop(merchant)}
      role="button"
      tabIndex={0}
      aria-label={`View ${shopName}`}
    >
      {/* 16:10 Aspect Ratio Swipeable Image Container */}
      <div
        className="zeas-blue-merchant-card-image"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {hasValidImage ? (
          <img
            src={coverImage}
            alt={shopName}
            loading="lazy"
            onError={() => setHasImgError(true)}
          />
        ) : (
          <div className="zeas-merchant-empty-theme">
            <div className="zeas-merchant-empty-pattern" />
            <div className="zeas-merchant-empty-icon-wrap">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="zeas-empty-store-icon"
              >
                <path d="M3 9l2-5h14l2 5" />
                <path d="M21 9v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9" />
                <path d="M3 9h18" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
            <div className="zeas-merchant-empty-info">
              <span className="zeas-merchant-empty-title">STOREFRONT</span>
              <span className="zeas-merchant-empty-sub">{categoryName}</span>
            </div>
          </div>
        )}

        {/* Swipe arrows + Dots when multiple photos exist */}
        {cardPhotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide((prev) => (prev - 1 + cardPhotos.length) % cardPhotos.length);
              }}
              aria-label="Previous photo"
              style={{
                position: 'absolute',
                left: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(15, 23, 42, 0.55)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 3,
              }}
            >
              <HiChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSlide((prev) => (prev + 1) % cardPhotos.length);
              }}
              aria-label="Next photo"
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(15, 23, 42, 0.55)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 3,
              }}
            >
              <HiChevronRight size={16} />
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 12,
                background: 'rgba(15, 23, 42, 0.45)',
                zIndex: 3,
              }}
            >
              {cardPhotos.slice(0, 4).map((_, i) => (
                <span
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide(i);
                  }}
                  style={{
                    width: activeSlide === i ? 14 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: activeSlide === i ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Promo Video Indicator Badge */}
        {hasVideo && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              background: 'rgba(37, 99, 235, 0.9)',
              color: '#FFFFFF',
              padding: '3px 8px',
              borderRadius: 9999,
              fontSize: 10.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              zIndex: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <HiPlay size={12} /> Video
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          type="button"
          className={`zeas-blue-merchant-fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite && onToggleFavorite(merchant.id);
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? <FaHeart size={15} color="#ef4444" /> : <FaRegHeart size={15} />}
        </button>

        {/* Verified Badge */}
        <div className="zeas-blue-merchant-badge-verified">
          <HiCheckCircle size={13} /> Verified
        </div>
      </div>

      {/* Card Body */}
      <div className="zeas-blue-merchant-card-body">
        {/* Merchant Name + Category Badge inline / beside name */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
          <h3 className="zeas-blue-merchant-card-name" style={{ margin: 0, flex: 1 }} title={shopName}>
            {shopName}
          </h3>
          <span className="zeas-blue-merchant-card-cat" style={{ flexShrink: 0 }} title={categoryName}>
            {categoryName}
          </span>
        </div>

        {/* Exact Place Name right below Merchant Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: '#1d4ed8',
            fontSize: '12px',
            fontWeight: 700,
            marginBottom: '6px',
          }}
          title={`Location: ${placeBadge}`}
        >
          <HiLocationMarker size={13} style={{ color: '#2563eb', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {placeBadge}
          </span>
        </div>

        {/* Rating, Distance, Status Row */}
        <div className="zeas-blue-merchant-meta-row">
          <span className="zeas-blue-merchant-rating">
            <HiStar size={14} color="#f59e0b" />
            <span>{ratingValue}</span>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>({reviewCount})</span>
          </span>

          {distanceText && (
            <span className="zeas-blue-merchant-distance">
              &bull; 📍 {distanceText}
            </span>
          )}

          <span className="zeas-blue-merchant-status-open">
            &bull; 🟢 Open
          </span>
        </div>

        {/* Address / Location snippet */}
        <div className="zeas-blue-merchant-address" title={merchant.address || locationText}>
          <HiLocationMarker size={13} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle', color: '#94a3b8' }} />
          {merchant.address || `${locationText}, Kerala`}
        </div>
      </div>

      {/* Action Buttons (Zeashell Style) */}
      <div className="zeas-blue-merchant-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="zeas-blue-btn-action-primary"
          onClick={(e) => {
            e.stopPropagation();
            onViewShop && onViewShop(merchant);
          }}
        >
          🏪 View Shop
        </button>
        <button
          type="button"
          className="zeas-blue-btn-action-secondary"
          onClick={(e) => {
            e.stopPropagation();
            onDirections && onDirections(merchant);
          }}
          title="Get Directions on Google Maps"
        >
          🧭 Directions
        </button>
        <button
          type="button"
          className="zeas-blue-btn-action-secondary"
          onClick={(e) => {
            e.stopPropagation();
            if (phoneText) {
              onCall && onCall(phoneText, merchant);
            } else {
              onViewShop && onViewShop(merchant);
            }
          }}
          title={phoneText ? `Call ${phoneText}` : 'Contact Info'}
        >
          <HiPhone size={13} /> {phoneText ? 'Call' : 'Contact'}
        </button>
      </div>
    </article>
  );
}
