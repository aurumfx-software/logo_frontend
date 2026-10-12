import React from 'react';
import {
  HiStar,
  HiLocationMarker,
  HiPhone,
  HiCheckCircle,
  HiClock,
} from 'react-icons/hi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

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
  const phoneText =
    merchant.phone ||
    merchant.phone_number ||
    merchant.contact_number ||
    merchant.whatsapp ||
    merchant.mobile ||
    '';
  const ratingValue = merchant.rating ? Number(merchant.rating).toFixed(1) : '4.8';
  const reviewCount = merchant.reviews_count || merchant.reviews || 42;

  const [hasImgError, setHasImgError] = React.useState(false);

  // Check if image is a placeholder bag image or invalid
  const isBagOrInvalidPhoto = (url) => {
    if (!url || typeof url !== 'string') return true;
    return url.includes('1553062407-98eeb64c6a62') || url.includes('f183f22512ae4d35990bbef9cbb018fe');
  };

  // Cover image: photo_1 or first merchant_photo or image (never fallback to bag image)
  const rawCandidate =
    merchant.photo_1 ||
    (merchant.merchant_photos && merchant.merchant_photos[0]) ||
    (merchant.photos && merchant.photos[0]) ||
    merchant.image ||
    merchant.profile_picture ||
    '';

  const coverImage = isBagOrInvalidPhoto(rawCandidate) ? '' : rawCandidate;
  const hasValidImage = Boolean(coverImage && !hasImgError);

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
  }, [userCoordinates, merchant.latitude, merchant.longitude]);

  return (
    <article
      className="zeas-blue-merchant-card"
      onClick={() => onViewShop && onViewShop(merchant)}
      role="button"
      tabIndex={0}
      aria-label={`View ${shopName}`}
    >
      {/* 16:10 Aspect Ratio Image Container */}
      <div className="zeas-blue-merchant-card-image">
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
        <h3 className="zeas-blue-merchant-card-name" title={shopName}>
          {shopName}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span className="zeas-blue-merchant-card-cat">{categoryName}</span>
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
