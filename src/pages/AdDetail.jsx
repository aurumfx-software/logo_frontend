import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineStar,
  HiOutlineShare,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiChevronLeft,
  HiOutlineInformationCircle,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineTag,
} from 'react-icons/hi';
import {
  FaWhatsapp,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
} from 'react-icons/fa';
import { promoBanners } from './LandingPage';

// Haversine distance calculator
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function AdDetail({ isPublic = true }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [ad, setAd] = useState(location.state?.merchant || location.state?.ad || null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: 12.0988, lng: 75.2045 });

  useEffect(() => {
    window.scrollTo(0, 0);

    // Geolocation detection
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserCoords({ lat: 12.0988, lng: 75.2045 }),
        { timeout: 5000 }
      );
    }

    // Fallback ad search if direct URL opened
    if (!ad) {
      const foundInBanners = promoBanners.find((b) => String(b.id) === String(id));
      if (foundInBanners) {
        setAd(foundInBanners);
      } else {
        // Fallback default ad
        setAd({
          id: id || 1,
          title: 'Special Local Offer & Promotion',
          subtitle: 'Featured Local Merchant',
          category: 'Retail & Shopping',
          badge: 'FEATURED PROMOTION',
          tagline: 'Flat 20% Off on First Booking or Visit',
          description:
            'Enjoy premium services and exclusive discounts. Contact our team directly via phone or WhatsApp for instant consultations and special store deals.',
          location: 'Payyanur, Kannur',
          phone: '+91 98470 12345',
          bannerUrl:
            'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&auto=format&fit=crop&q=80',
          lat: 12.0988,
          lng: 75.2045,
          rating: 4.8,
          reviews: 124,
          highlights: ['Verified Business', 'Instant Booking', 'On-Site Parking', 'Best Price Guarantee'],
        });
      }
    }
  }, [id, ad]);

  if (!ad) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', padding: 30 }}>
          <HiOutlineInformationCircle style={{ fontSize: 48, color: '#0284c7', marginBottom: 12 }} />
          <h2>Loading Advertisement Details...</h2>
          <p style={{ color: '#64748B' }}>Fetching promotion data</p>
        </div>
      </div>
    );
  }

  const distance = calculateDistance(
    userCoords.lat,
    userCoords.lng,
    ad.lat || 12.0988,
    ad.lng || 75.2045
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ad.title || ad.name,
        text: `Check out this promotion: ${ad.title || ad.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${ad.title || ad.name || ''} ${ad.location || ad.address || ''}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', color: '#0F172A', fontFamily: 'sans-serif' }}>
      {/* Top Header Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '14px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <HiChevronLeft size={20} /> Back to Home
        </button>

        <span style={{ fontWeight: '800', fontSize: '18px', color: '#38BDF8', letterSpacing: '0.5px' }}>
          📢 ADVERTISEMENT DETAILS
        </span>

        <button
          onClick={handleShare}
          style={{
            background: '#0284c7',
            border: 'none',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <HiOutlineShare size={18} /> {copiedLink ? 'Link Copied!' : 'Share Ad'}
        </button>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Ad Hero Banner Cover */}
          {(() => {
            const isVideo = ad.media_type === 'video' || !!ad.video_url || (ad.media_url && ad.media_url.match(/\.(mp4|webm|mov|mkv|avi)$/i));
            return (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: '380px',
                  overflow: 'hidden',
                  background: (!isVideo && (ad.bannerUrl || ad.image || ad.media_url))
                    ? `linear-gradient(180deg, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%), url(${ad.bannerUrl || ad.image || ad.media_url}) center/cover no-repeat`
                    : ad.bgGradient || 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '36px',
                  color: '#FFFFFF',
                }}
              >
                {isVideo && (
                  <video
                    src={ad.video_url || ad.media_url}
                    poster={ad.thumbnail_url || ad.image_url || ad.bannerUrl}
                    autoPlay
                    muted
                    loop
                    controls
                    playsInline
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 0,
                      opacity: 0.85,
                    }}
                  />
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
              <span
                style={{
                  background: '#FDE047',
                  color: '#0F172A',
                  fontWeight: '800',
                  fontSize: '12px',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <HiOutlineSparkles /> {ad.badge || ad.adBadge || 'SPONSORED ADVERTISEMENT'}
              </span>
            </div>

            <div>
              <h1
                style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#FFFFFF',
                  margin: '0 0 10px 0',
                  lineHeight: '1.2',
                  letterSpacing: '-0.5px',
                }}
              >
                {ad.title || ad.name}
              </h1>

              <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.92)', margin: 0, fontWeight: '500' }}>
                {ad.merchant ? `Promoted by ${ad.merchant}` : ad.subtitle || ad.category}
              </p>
            </div>
          </div>
        );
      })()}

          {/* Ad Body Details */}
          <div style={{ padding: '36px' }}>
            {/* Offer Tagline / Discount Banner */}
            {(ad.tagline || ad.offerTag) && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                  borderLeft: '6px solid #F59E0B',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  marginBottom: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  fontSize: '18px',
                  fontWeight: '800',
                  color: '#92400E',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
                }}
              >
                <HiOutlineTag style={{ fontSize: '26px', color: '#D97706', flexShrink: 0 }} />
                <span>{ad.tagline || ad.offerTag}</span>
              </div>
            )}

            {/* Quick Info Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
                background: '#F8FAFC',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
              }}
            >
              {ad.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#E0F2FE', padding: '10px', borderRadius: '10px', color: '#0284c7' }}>
                    <HiOutlineLocationMarker size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>LOCATION</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{ad.location}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#E0F2FE', padding: '10px', borderRadius: '10px', color: '#0284c7' }}>
                  📍
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>NEAREST PROXIMITY</div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#0284c7' }}>
                    {distance.toFixed(1)} km away from you
                  </div>
                </div>
              </div>

              {ad.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#DCFCE7', padding: '10px', borderRadius: '10px', color: '#16A34A' }}>
                    <HiOutlinePhone size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>CONTACT PHONE</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{ad.phone}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Main CTAs Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '36px',
              }}
            >
              {ad.phone && (
                <a
                  href={`tel:${ad.phone.replace(/[^0-9+]/g, '')}`}
                  style={{
                    background: '#0284c7',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    padding: '16px 24px',
                    borderRadius: '14px',
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    textDecoration: 'none',
                    fontSize: '16px',
                    boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  <HiOutlinePhone size={22} /> Call Merchant Now
                </a>
              )}

              {ad.phone && (
                <a
                  href={`https://wa.me/${ad.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#25D366',
                    color: '#FFFFFF',
                    fontWeight: '800',
                    padding: '16px 24px',
                    borderRadius: '14px',
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    textDecoration: 'none',
                    fontSize: '16px',
                    boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  <FaWhatsapp size={22} /> WhatsApp Inquiry
                </a>
              )}

              <button
                type="button"
                onClick={openGoogleMaps}
                style={{
                  background: '#F1F5F9',
                  color: '#0F172A',
                  fontWeight: '800',
                  padding: '16px 24px',
                  borderRadius: '14px',
                  border: '1px solid #CBD5E1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <HiOutlineLocationMarker size={22} style={{ color: '#0284c7' }} /> Get Directions
              </button>
            </div>

            {/* Detailed Description */}
            <div style={{ marginBottom: '36px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>
                Full Offer Description &amp; Details
              </h3>
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: '#334155',
                  margin: 0,
                  whiteSpace: 'pre-line',
                }}
              >
                {ad.description ||
                  `Explore exclusive deals and high quality local offerings. This featured promotion provides customers with top tier services, transparent pricing, and priority support. Connect with our establishment today to learn more.`}
              </p>
            </div>

            {/* Highlights List */}
            {ad.highlights && ad.highlights.length > 0 && (
              <div style={{ marginBottom: '36px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '14px' }}>
                  Key Features &amp; Highlights
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {ad.highlights.map((h, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#F1F5F9',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1E293B',
                      }}
                    >
                      <HiOutlineCheckCircle style={{ color: '#16A34A', fontSize: '20px', flexShrink: 0 }} />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dedicated Merchant Profile CTA Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: '#FFFFFF',
                borderRadius: '18px',
                padding: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', color: '#FFFFFF' }}>
                  Want to explore the full establishment store?
                </h3>
                <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
                  View all services, photo gallery, user reviews, and full business profile.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const mId = ad.id || ad.merchantId || 1;
                  navigate(`/place/${mId}`, { state: { merchant: ad } });
                }}
                style={{
                  background: '#0284c7',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
              >
                View Establishment Page <HiOutlineArrowRight />
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
