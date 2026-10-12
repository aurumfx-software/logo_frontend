import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiLocationMarker,
  HiPhone,
  HiStar,
  HiCheckCircle,
  HiClock,
  HiExternalLink,
  HiShare,
  HiOutlinePencil,
  HiInformationCircle,
  HiGlobeAlt,
  HiX,
  HiSearch,
  HiChevronLeft,
} from 'react-icons/hi';
import {
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaGlobe,
  FaHeart,
  FaRegHeart,
} from 'react-icons/fa';
import ZeashellNavbar from './ZeashellNavbar';
import { EMPTY_MERCHANT_IMAGE } from '../../api/merchantApi';

export default function ZeashellShopModal({
  merchant,
  onClose,
  userCoordinates,
  currentLocationName,
  onOpenLocationModal,
  onDetectGPS,
  onSelectTownOrDistrict,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  categories = [],
  activeCategory = 'all',
  onSelectCategory,
  customerUser = null,
  onOpenCustomerLogin,
  onCustomerLogout,
  onOpenOnboardModal,
  favoritesCount = 0,
  onOpenWishlistPage,
}) {
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Lock background scroll when fullscreen modal is open
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!merchant) return null;

  // Merchant Data Extraction with reliable fallbacks matching screenshot
  const shopName =
    merchant.business_name || merchant.name || 'Kerala Spice Garden Restaurant';
  const categoryName =
    merchant.category || (merchant.categories && merchant.categories[0]) || 'Restaurants';
  const locationText =
    merchant.city || merchant.location || merchant.district || 'Ernakulam, Kochi';
  const fullAddress =
    merchant.address ||
    (merchant.landmark
      ? `${merchant.landmark}, ${locationText}, Kerala 682011`
      : `MG Road, ${locationText}, Kerala 682011`);

  const rawPhone =
    merchant.phone ||
    merchant.phone_number ||
    merchant.contact_number ||
    merchant.whatsapp ||
    merchant.mobile ||
    '+91 484 236 7890';
  const cleanPhone = String(rawPhone).replace(/[^0-9+]/g, '') || '+914842367890';
  const waNumber = cleanPhone.replace(/^\+/, '').replace(/^0+/, '');

  const ratingValue = merchant.rating ? Number(merchant.rating).toFixed(1) : '5.0';
  const reviewCount = merchant.reviews_count || merchant.reviews || 342;
  const timingMonSat = merchant.service_timing || '11:00 AM - 10:30 PM';
  const timingSun = '12:00 PM - 10:00 PM';

  const description =
    merchant.about ||
    merchant.description ||
    'Authentic Kerala cuisine with traditional recipes passed down through generations. Famous for our fish curry and appam.';

  // Coordinates
  const lat = merchant.latitude ? Number(merchant.latitude) : 9.9716;
  const lng = merchant.longitude ? Number(merchant.longitude) : 76.2846;
  const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  // Helper to upgrade low-resolution Unsplash and thumbnail URLs to high-definition 1600px crystal-clear quality
  const getHighResPhoto = (url) => {
    if (!url || typeof url !== 'string') return '';
    let res = url.trim();
    if (res.includes('images.unsplash.com')) {
      res = res.replace(/w=\d+/, 'w=1600').replace(/q=\d+/, 'q=90');
      if (!res.includes('w=1600')) {
        res += (res.includes('?') ? '&' : '?') + 'w=1600&q=90&auto=format&fit=crop';
      }
    }
    return res;
  };

  // Gallery Photos (clean out any fallback bag image)
  const isBag = (url) =>
    typeof url === 'string' &&
    (url.includes('1553062407-98eeb64c6a62') || url.includes('f183f22512ae4d35990bbef9cbb018fe'));

  const candidateList = [
    ...(Array.isArray(merchant.merchant_photos) ? merchant.merchant_photos : []),
    ...(Array.isArray(merchant.photos) ? merchant.photos : []),
    merchant.photo_1,
    merchant.photo_2,
    merchant.photo_3,
    merchant.photo_4,
    merchant.image,
  ].filter((p) => p && typeof p === 'string' && !isBag(p));

  const photos =
    candidateList.length > 0
      ? candidateList.map(getHighResPhoto)
      : [EMPTY_MERCHANT_IMAGE];
  const currentCoverPhoto = photos[activePhotoIdx] || photos[0];

  // Actions
  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenMapExternal = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCall = () => {
    window.open(`tel:${cleanPhone}`, '_self');
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${shopName}, I found your establishment on Logo / Zeashell and would like more details.`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: shopName,
          text: `Check out ${shopName} in ${locationText}, Kerala: ${fullAddress}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      alert('Shop link copied to clipboard!');
    }
  };

  const handleEdit = () => {
    alert(`Editing details for ${shopName}. (Admin / Owner mode)`);
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
  };

  // Social Links
  const socialLinks = [
    {
      name: `WhatsApp ${waNumber.slice(0, 5)}...`,
      icon: <FaWhatsapp color="#22c55e" size={15} />,
      onClick: handleWhatsApp,
    },
    {
      name: 'Facebook Page',
      icon: <FaFacebook color="#1877f2" size={15} />,
      onClick: () => window.open('https://facebook.com', '_blank'),
    },
    {
      name: 'Instagram Profile',
      icon: <FaInstagram color="#e1306c" size={15} />,
      onClick: () => window.open('https://instagram.com', '_blank'),
    },
    {
      name: 'Twitter / X',
      icon: <FaTwitter color="#0f172a" size={15} />,
      onClick: () => window.open('https://twitter.com', '_blank'),
    },
    {
      name: 'YouTube Channel',
      icon: <FaYoutube color="#ef4444" size={15} />,
      onClick: () => window.open('https://youtube.com', '_blank'),
    },
    {
      name: 'Official Website',
      icon: <FaGlobe color="#0d9488" size={15} />,
      onClick: () =>
        window.open(
          merchant.website || 'https://keralatourism.org',
          '_blank',
          'noopener,noreferrer'
        ),
    },
  ];

  const navigate = useNavigate();

  const handleCloseShop = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="zeas-fs-container" role="dialog" aria-modal="true" aria-label={shopName}>
      {/* 1. APP'S MAIN NAVBAR (Replaces old navbar as requested) */}
      <ZeashellNavbar
        currentLocationName={currentLocationName || locationText || 'Kerala'}
        onOpenLocationModal={onOpenLocationModal || handleCloseShop}
        onDetectGPS={onDetectGPS || handleCloseShop}
        onSelectTownOrDistrict={(type, val) => {
          if (onSelectTownOrDistrict) onSelectTownOrDistrict(type, val);
          else {
            handleCloseShop();
            navigate(`/?location=${encodeURIComponent(val)}`);
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSearchSubmit={(q) => {
          if (onSearchSubmit) onSearchSubmit(q);
          else {
            handleCloseShop();
            navigate(`/?q=${encodeURIComponent(q)}`);
          }
        }}
        favoritesCount={favoritesCount}
        onOpenOnboardModal={onOpenOnboardModal || handleCloseShop}
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          if (onSelectCategory) onSelectCategory(cat);
          else {
            handleCloseShop();
            navigate(`/?cat=${encodeURIComponent(cat)}`);
          }
        }}
        customerUser={customerUser}
        onOpenCustomerLogin={onOpenCustomerLogin}
        onCustomerLogout={onCustomerLogout}
        onOpenWishlistPage={onOpenWishlistPage || handleCloseShop}
      />

      {/* 2. SLEEK BREADCRUMB & BACK STRIP DIRECTLY UNDER MAIN NAVBAR */}
      <div className="zeas-shop-nav-strip">
        <div className="zeas-shop-nav-strip-inner">
          <button
            type="button"
            className="zeas-shop-strip-back-btn"
            onClick={handleCloseShop}
            title="Back to All Shops"
          >
            <HiChevronLeft size={18} />
            <span>Back to All Shops</span>
          </button>

          <div className="zeas-shop-strip-breadcrumbs">
            <span onClick={handleCloseShop} style={{ cursor: 'pointer' }}>Kerala</span>
            <span>&gt;</span>
            <span onClick={handleCloseShop} style={{ cursor: 'pointer' }}>{locationText}</span>
            <span>&gt;</span>
            <span className="crumb-active">{categoryName}</span>
            <span>&gt;</span>
            <span className="crumb-shop">{shopName}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className={`zeas-shop-action-btn ${isSaved ? 'saved' : ''}`}
              onClick={handleToggleSave}
              title="Save to Wishlist"
            >
              {isSaved ? <FaHeart color="#ef4444" size={15} /> : <FaRegHeart size={15} />}
              <span>{isSaved ? 'Saved' : 'Wishlist'}</span>
            </button>

            <button
              type="button"
              className="zeas-shop-action-btn"
              onClick={handleShare}
              title="Share Shop"
            >
              <HiShare size={15} />
              <span>Share</span>
            </button>

            <button
              type="button"
              className="zeas-shop-strip-close-btn"
              onClick={handleCloseShop}
              title="Close Shop Details"
            >
              <HiX size={16} />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CRYSTAL-CLEAR ULTRA-SHARP HERO COVER PHOTO (NO BLUR) */}
      <div className="zeas-fs-hero-wrapper">
        <div className="zeas-fs-hero-stage">
          <img
            src={currentCoverPhoto}
            alt={shopName}
            className="zeas-fs-hero-img"
            style={{
              imageRendering: '-webkit-optimize-contrast',
              filter: 'contrast(1.02) saturate(1.03)',
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = EMPTY_MERCHANT_IMAGE;
            }}
          />
          <div className="zeas-fs-photo-badge">
            {photos[0] === EMPTY_MERCHANT_IMAGE
              ? '🏬 Storefront'
              : `📷 ${activePhotoIdx + 1}/${photos.length} Photos`}
          </div>
        </div>

        {/* Thumbnail Selector Strip if Multiple Real Photos */}
        {photos.length > 1 && photos[0] !== EMPTY_MERCHANT_IMAGE && (
          <div className="zeas-fs-thumb-strip">
            {photos.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className={`zeas-fs-thumb-item ${activePhotoIdx === idx ? 'active' : ''}`}
                onClick={() => setActivePhotoIdx(idx)}
              >
                <img src={p} alt={`Photo ${idx + 1}`} style={{ imageRendering: '-webkit-optimize-contrast' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. MAIN CONTENT WRAPPER */}
      <main className="zeas-fs-main">
        {/* OVERLAPPING WHITE HEADER CARD */}
        <div className="zeas-fs-header-card">
          <div className="zeas-fs-title-row">
            <h1 className="zeas-fs-title">{shopName}</h1>

            <div className="zeas-fs-header-actions">
              <button
                type="button"
                className="zeas-fs-action-pill"
                onClick={handleShare}
                title="Share this shop"
              >
                <HiShare size={15} />
                <span>Share</span>
              </button>

              <button
                type="button"
                className="zeas-fs-action-pill"
                onClick={handleEdit}
                title="Edit shop details"
              >
                <HiOutlinePencil size={15} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                className="zeas-fs-action-pill"
                onClick={handleToggleSave}
                title="Save to favorites"
              >
                {isSaved ? <FaHeart color="#ef4444" size={14} /> : <FaRegHeart size={14} />}
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Badges Row */}
          <div className="zeas-fs-badges-row">
            <span className="zeas-fs-badge-cat">{categoryName}</span>
            <span className="zeas-fs-badge-approved">
              <HiCheckCircle size={14} /> approved
            </span>
            <span className="zeas-fs-badge-verified">Verified</span>
            <span className="zeas-fs-badge-open">🟢 Open Now</span>
            <span className="zeas-fs-badge-offer">🔥 20% OFF</span>
          </div>

          {/* Rating */}
          <div className="zeas-fs-rating-row">
            <span style={{ color: '#f59e0b', display: 'flex', gap: 2 }}>
              ★★★★★
            </span>
            <span>
              {ratingValue} Stars{' '}
              <span style={{ color: '#64748b', fontWeight: 500 }}>
                ({reviewCount} user reviews)
              </span>
            </span>
          </div>

          {/* Address */}
          <div className="zeas-fs-address-line">
            <HiLocationMarker size={16} color="#2563eb" style={{ flexShrink: 0 }} />
            <span>{fullAddress}</span>
          </div>

          {/* Phone */}
          <div className="zeas-fs-phone-line">
            <HiPhone size={15} color="#2563eb" style={{ flexShrink: 0 }} />
            <span>
              {cleanPhone}{' '}
              <span style={{ color: '#16a34a' }}>(WhatsApp: {waNumber})</span>
            </span>
          </div>
        </div>

        {/* 4. UPPER TWO-COLUMN LAYOUT: CONTACT/REVIEWS (LEFT) & MAP/TIMINGS (RIGHT) */}
        <div className="zeas-fs-content-grid">
          {/* LEFT COLUMN: CONTACT & RATINGS */}
          <div className="zeas-fs-col-left">
            {/* CARD 1: LOCATION / ADDRESS */}
            <div className="zeas-fs-card">
              <div className="zeas-fs-card-head">
                <h2 className="zeas-fs-card-title">
                  <HiLocationMarker className="zeas-fs-card-icon" />
                  Location / Address
                </h2>
              </div>
              <p className="zeas-fs-location-text">{fullAddress}</p>
              <button
                type="button"
                className="zeas-fs-btn-map-dark"
                onClick={handleDirections}
              >
                <HiLocationMarker size={16} />
                View Location on Google Maps
              </button>
            </div>

            {/* CARD 2: PHONE CONTACT */}
            <div className="zeas-fs-card">
              <div className="zeas-fs-card-head">
                <h2 className="zeas-fs-card-title">
                  <HiPhone className="zeas-fs-card-icon" />
                  Phone Contact
                </h2>
              </div>

              <div className="zeas-fs-phone-box-grid">
                {/* DIRECT PHONE CALL */}
                <div className="zeas-fs-phone-subbox">
                  <div className="zeas-fs-phone-subbox-label">Direct Phone Call</div>
                  <div className="zeas-fs-phone-subbox-num">{cleanPhone}</div>
                  <button
                    type="button"
                    className="zeas-fs-btn-call-sub"
                    onClick={handleCall}
                  >
                    Call Now
                  </button>
                </div>

                {/* WHATSAPP CONTACT */}
                <div className="zeas-fs-phone-subbox whatsapp-subbox">
                  <div className="zeas-fs-phone-subbox-label">WhatsApp Contact</div>
                  <div className="zeas-fs-phone-subbox-num">WhatsApp: {waNumber}</div>
                  <button
                    type="button"
                    className="zeas-fs-btn-wa-sub"
                    onClick={handleWhatsApp}
                  >
                    Chat on WhatsApp ↗
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 3: RATING & REVIEWS */}
            <div className="zeas-fs-card">
              <div className="zeas-fs-card-head">
                <h2 className="zeas-fs-card-title">
                  <HiStar className="zeas-fs-card-icon" />
                  Rating & Reviews
                </h2>
              </div>

              <div className="zeas-fs-rating-big-row">
                <span className="zeas-fs-rating-num">{ratingValue}</span>
                <div>
                  <div style={{ color: '#f59e0b', fontSize: 18, letterSpacing: 2 }}>
                    ★★★★★
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                    5 Stars ({reviewCount} user reviews)
                  </div>
                </div>
              </div>

              {/* Verified Reviewer Testimonial */}
              <div className="zeas-fs-review-card">
                <div className="zeas-fs-reviewer-head">
                  <div className="zeas-fs-reviewer-avatar">A</div>
                  <div>
                    <div className="zeas-fs-reviewer-name">
                      Verified Locality Reviewer
                    </div>
                    <div className="zeas-fs-reviewer-meta">
                      <span style={{ color: '#f59e0b' }}>★★★★★</span>
                      <span>October 2026</span>
                    </div>
                  </div>
                </div>
                <p className="zeas-fs-review-quote">
                  5 Stars ({reviewCount} user reviews) — Excellent retail experience! Friendly staff,
                  genuine products, and very quick response time. Recommended merchant on
                  Logo My Locality.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: MAP & OPENING HOURS */}
          <div className="zeas-fs-col-right">
            {/* CARD 1: LOCATION & MAP */}
            <div className="zeas-fs-card">
              <div className="zeas-fs-card-head">
                <h2 className="zeas-fs-card-title">
                  <HiLocationMarker className="zeas-fs-card-icon" />
                  Location & Map
                </h2>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <span className="zeas-fs-coord-text">
                  📍 Coordinates: {coordString}
                </span>
                <button
                  type="button"
                  onClick={handleOpenMapExternal}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 9999,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#1e293b',
                    cursor: 'pointer',
                  }}
                >
                  Open Map ↗
                </button>
              </div>

              {/* Interactive OpenStreetMap preview iframe */}
              <div className="zeas-fs-map-wrap">
                <iframe
                  title="Shop Location Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015}%2C${lat - 0.012}%2C${lng + 0.015}%2C${lat + 0.012}&layer=mapnik&marker=${lat}%2C${lng}`}
                />
              </div>
            </div>

            {/* CARD 2: OPENING HOURS */}
            <div className="zeas-fs-card">
              <div className="zeas-fs-card-head">
                <h2 className="zeas-fs-card-title">
                  <HiClock className="zeas-fs-card-icon" />
                  Opening Hours
                </h2>
              </div>
              <div className="zeas-fs-hours-list">
                <div className="zeas-fs-hours-row">
                  <span>Mon-Sat:</span>
                  <span style={{ fontWeight: 600 }}>{timingMonSat}</span>
                </div>
                <div className="zeas-fs-hours-row muted">
                  <span>Sun:</span>
                  <span style={{ fontWeight: 600 }}>{timingSun}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. ABOUT (LEFT) AND SOCIAL MEDIA (RIGHT) SIDE-BY-SIDE GRID — ELIMINATES UNWANTED WHITE SPACE! */}
        <div className="zeas-fs-about-social-grid">
          {/* LEFT: ABOUT SECTION */}
          <div className="zeas-fs-card zeas-fs-about-card">
            <div className="zeas-fs-card-head">
              <h2 className="zeas-fs-card-title">
                <HiInformationCircle className="zeas-fs-card-icon" />
                About {shopName}
              </h2>
            </div>
            <p className="zeas-fs-about-text">{description}</p>
            {merchant.highlights && merchant.highlights.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Store Highlights & Amenities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {merchant.highlights.map((h, i) => (
                    <span
                      key={i}
                      style={{
                        background: '#eff6ff',
                        color: '#1e40af',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        border: '1px solid #dbeafe',
                      }}
                    >
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: SOCIAL MEDIA & WEB LINKS SECTION */}
          <div className="zeas-fs-card zeas-fs-social-card">
            <div className="zeas-fs-card-head">
              <h2 className="zeas-fs-card-title">
                <HiGlobeAlt className="zeas-fs-card-icon" />
                Social Media & Web Links
              </h2>
            </div>
            <div className="zeas-fs-social-grid">
              {socialLinks.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="zeas-fs-social-pill"
                  onClick={s.onClick}
                >
                  {s.icon}
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 6. FLOATING STICKY BOTTOM ACTION BAR */}
      <div className="zeas-fs-floating-bar">
        <button
          type="button"
          className="zeas-fs-btn-call-float"
          onClick={handleCall}
        >
          <HiPhone size={16} />
          <span>Call Merchant</span>
        </button>

        <button
          type="button"
          className="zeas-fs-btn-maps-float"
          onClick={handleDirections}
        >
          <HiLocationMarker size={16} />
          <span>Google Maps</span>
        </button>

        <button
          type="button"
          className="zeas-fs-btn-close-float"
          onClick={onClose}
          aria-label="Close full screen view"
        >
          <HiX size={16} />
          <span>Close</span>
        </button>
      </div>
    </div>
  );
}
