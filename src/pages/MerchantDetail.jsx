import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineStar,
  HiOutlinePhotograph,
  HiOutlineVideoCamera,
  HiOutlineShare,
  HiOutlinePencil,
  HiCheckCircle,
  HiX,
  HiOutlineGlobe,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineEye,
  HiOutlineZoomIn,
} from 'react-icons/hi';
import {
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaGlobe,
  FaEnvelope,
} from 'react-icons/fa';
import { fetchMerchantsList } from '../api/merchantApi';
import { useAuth } from '../context/AuthContext';

// Standard fallback establishments matching landing page & screenshot
const FALLBACK_MERCHANTS = [
  {
    id: 'm1',
    name: 'HOTEL TOPFORM',
    category: 'Hotel & Restaurants',
    address: 'Main Road, Payyanur, Kannur, Kerala',
    city: 'Payyanur',
    district: 'Kannur',
    phone: '+91 4985 205882',
    rating: 4.5,
    reviews: 320,
    about:
      'Authentic Malabar cuisine, Biryani, seafood delicacies, and comfortable dining experience.',
    description:
      'Authentic Malabar cuisine, Biryani, seafood delicacies, and comfortable dining experience.',
    highlights: [
      'Famous Malabar Biryani',
      'Family Restaurant',
      'AC & Non-AC Rooms',
      'Free Parking Available',
      'Cards & UPI Accepted',
    ],
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80',
    latitude: 12.1025,
    longitude: 75.2032,
    status: 'active',
  },
  {
    id: 'm2',
    name: 'Aroma Fresh Bakery',
    category: 'Bakery',
    address: 'Near Old Bus Stand, Payyanur, Kannur',
    city: 'Payyanur',
    district: 'Kannur',
    phone: '+91 98471 23456',
    rating: 4.8,
    reviews: 194,
    about:
      'Freshly baked cakes, pastries, traditional snacks, and hot beverages served daily.',
    description:
      'Freshly baked cakes, pastries, traditional snacks, and hot beverages served daily.',
    highlights: ['Custom Cakes', 'Fresh Pastries', 'Drive-through', 'Clean Hygiene'],
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1000&auto=format&fit=crop&q=80',
    latitude: 12.105,
    longitude: 75.201,
    status: 'active',
  },
  {
    id: 'm3',
    name: 'Apex Helmets & Biking Gear',
    category: 'Helmets & Accessories',
    address: 'NH 66 Bypass Road, Perumba, Payyanur',
    city: 'Payyanur',
    district: 'Kannur',
    phone: '+91 94472 88990',
    rating: 4.7,
    reviews: 142,
    about:
      'Premium ISI & ECE certified helmets, riding jackets, gloves, and motorcycle accessories.',
    description:
      'Premium ISI & ECE certified helmets, riding jackets, gloves, and motorcycle accessories.',
    highlights: ['Certified Gear', 'Top Brands', 'Rider Discounts', 'Visor Replacement'],
    image:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1000&auto=format&fit=crop&q=80',
    latitude: 12.098,
    longitude: 75.208,
    status: 'active',
  },
];

export default function MerchantDetail({ isPublic = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const userId = user?.id || user?.user_id;
        const userCode = user?.user_code || user?.userCode;
        const list = await fetchMerchantsList(userId, userCode);

        let found = Array.isArray(list)
          ? list.find((m) => String(m.id) === String(id) || String(m._id) === String(id))
          : null;

        if (!found) {
          found = FALLBACK_MERCHANTS.find(
            (m) => String(m.id) === String(id) || String(m.name).toLowerCase() === String(id).toLowerCase()
          );
        }

        // If still not found, fallback to first fallback merchant so page always renders gracefully
        if (!found && id) {
          found = {
            ...FALLBACK_MERCHANTS[0],
            id: id,
            name: id.length > 3 ? id.replace(/-/g, ' ').toUpperCase() : 'HOTEL TOPFORM',
          };
        }

        setMerchant(found || FALLBACK_MERCHANTS[0]);
      } catch (err) {
        console.error('Error loading merchant detail:', err);
        setMerchant(FALLBACK_MERCHANTS[0]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMaps = () => {
    if (merchant) {
      const query = merchant.latitude && merchant.longitude
        ? `${merchant.latitude},${merchant.longitude}`
        : encodeURIComponent(`${merchant.name}, ${merchant.address || merchant.city || 'Payyanur'}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(isAuthenticated ? '/merchants' : '/');
    }
  };

  // Raw photos array
  const rawPhotos = merchant
    ? [
        merchant.image,
        ...(Array.isArray(merchant.photos) ? merchant.photos : []),
        merchant.photo_1,
        merchant.photo_2,
        merchant.photo_3,
        merchant.photo_4,
      ].filter(Boolean)
    : [];

  const defaultFallbackPhotos = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80',
  ];

  const photos =
    rawPhotos.length > 1
      ? rawPhotos
      : rawPhotos.length === 1
      ? [rawPhotos[0], ...defaultFallbackPhotos.slice(1)]
      : defaultFallbackPhotos;

  // Key highlights
  const highlights =
    merchant && Array.isArray(merchant.highlights) && merchant.highlights.length > 0
      ? merchant.highlights
      : [
          'Famous Malabar Biryani',
          'Family Restaurant',
          'AC & Non-AC Rooms',
          'Free Parking Available',
          'Cards & UPI Accepted',
        ];

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              border: '4px solid #E2E8F0',
              borderTopColor: '#6C63FF',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: '#64748B', fontWeight: 600, fontSize: 15 }}>Loading merchant details...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        padding: '24px 16px 40px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: 960,
          background: '#FFFFFF',
          borderRadius: 24,
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── TOP HEADER (Matching Screenshot Header) ── */}
        <div
          style={{
            padding: '24px 28px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F1F5F9',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(22px, 3.5vw, 30px)',
                fontWeight: 800,
                color: '#0F172A',
                margin: 0,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {merchant.name || 'HOTEL TOPFORM'}
            </h1>
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#64748B',
                margin: '6px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {merchant.category || 'Hotel & Restaurants'}
              {merchant.status && (
                <span
                  style={{
                    background: merchant.status === 'active' ? '#D1FAE5' : '#FEF3C7',
                    color: merchant.status === 'active' ? '#059669' : '#D97706',
                    padding: '2px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                  }}
                >
                  {merchant.status}
                </span>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={handleCopyLink}
              title="Share Page"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 20,
                border: '1.5px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#475569',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {copied ? <HiCheckCircle style={{ color: '#10B981' }} size={16} /> : <HiOutlineShare size={16} />}
              {copied ? 'Copied Link!' : 'Share'}
            </button>

            {isAuthenticated && (
              <button
                onClick={() => navigate(`/merchants?edit=${merchant.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: '1.5px solid #C7D2FE',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <HiOutlinePencil size={15} /> Edit
              </button>
            )}

            {/* Close / Back ✕ Button */}
            <button
              onClick={handleBack}
              title="Close Page"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: 'none',
                background: '#F1F5F9',
                color: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 18,
                transition: 'all 0.15s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#E2E8F0')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#F1F5F9')}
            >
              <HiX />
            </button>
          </div>
        </div>

        {/* ── MAIN CONTENT CANVAS ── */}
        <div style={{ padding: '24px 28px 32px', display: 'grid', gap: 28 }}>
          {/* ── HERO BANNER IMAGE ── */}
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
            <img
              src={photos[activePhoto] || photos[0]}
              alt={merchant.name}
              style={{
                width: '100%',
                height: 'clamp(220px, 42vw, 380px)',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80';
              }}
            />

            {/* Thumbnail selector overlay if multiple photos */}
            {photos.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: 8,
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '6px 12px',
                  borderRadius: 30,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {photos.slice(0, 6).map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhoto(idx)}
                    style={{
                      width: 46,
                      height: 34,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: idx === activePhoto ? '2px solid #FFFFFF' : '2px solid transparent',
                      opacity: idx === activePhoto ? 1 : 0.6,
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    <img src={imgUrl} alt={`Thumb ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                backdropFilter: 'blur(6px)',
              }}
            >
              <HiOutlinePhotograph size={14} /> {activePhoto + 1}/{photos.length}
            </div>
          </div>

          {/* ── 3 INFO BLOCKS GRID (Matching Screenshot Layout) ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
              gap: 20,
              background: '#FAFAFA',
              padding: '24px 20px',
              borderRadius: 20,
              border: '1px solid #F1F5F9',
            }}
          >
            {/* Block 1: Location / Address */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <HiOutlineLocationMarker />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Location / Address</h4>
                <p style={{ fontSize: 14, color: '#475569', margin: '0 0 10px', lineHeight: 1.45 }}>
                  {merchant.address || 'Main Road, Payyanur, Kannur, Kerala'}
                </p>
                <button
                  onClick={handleOpenMaps}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#2563EB',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#DBEAFE')}
                  onMouseOut={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                >
                  📍 View Location on Google Maps
                </button>
              </div>
            </div>

            {/* Block 2: Phone Contact */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#F0EFFF',
                  color: '#6C63FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <HiOutlinePhone />
              </div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Phone Contact</h4>
                <a
                  href={`tel:${merchant.phone || '+91 4985 205882'}`}
                  style={{
                    fontSize: 14,
                    color: '#1E293B',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  {merchant.phone || '+91 4985 205882'}
                </a>
                {merchant.whatsapp && (
                  <p style={{ fontSize: 13, color: '#16A34A', margin: '4px 0 0', fontWeight: 600 }}>
                    WhatsApp: {merchant.whatsapp}
                  </p>
                )}
              </div>
            </div>

            {/* Block 3: Rating & Reviews */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#FEF3C7',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                <HiOutlineStar />
              </div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Rating & Reviews</h4>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, fontWeight: 600 }}>
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>{merchant.rating || 4.5} Stars</span> ({merchant.reviews || 320} user reviews)
                </p>
              </div>
            </div>
          </div>

          {/* ── ABOUT SECTION ── */}
          <div style={{ display: 'grid', gap: 8 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>About</h3>
            <p
              style={{
                fontSize: 15,
                color: '#475569',
                lineHeight: 1.65,
                margin: 0,
                fontWeight: 400,
              }}
            >
              {merchant.about ||
                merchant.description ||
                'Authentic Malabar cuisine, Biryani, seafood delicacies, and comfortable dining experience.'}
            </p>
          </div>

          {/* ── KEY HIGHLIGHTS SECTION ── */}
          <div style={{ display: 'grid', gap: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Key Highlights</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              {highlights.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#1E293B',
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    borderRadius: 10,
                    border: '1px solid #F1F5F9',
                  }}
                >
                  <HiCheckCircle style={{ color: '#10B981', flexShrink: 0 }} size={18} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── SOCIAL MEDIA & WEB LINKS SECTION ── */}
          <div style={{ display: 'grid', gap: 12 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Social Media & Web Links
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              {[
                {
                  name: 'WhatsApp',
                  icon: <FaWhatsapp size={18} />,
                  color: '#25D366',
                  bgColor: '#E8F5E9',
                  borderColor: '#A5D6A7',
                  url: merchant.whatsapp
                    ? `https://wa.me/${merchant.whatsapp.replace(/\D/g, '')}`
                    : `https://wa.me/${(merchant.phone || '914985205882').replace(/\D/g, '')}`,
                  label: merchant.whatsapp || merchant.phone || 'Chat on WhatsApp',
                },
                {
                  name: 'Facebook',
                  icon: <FaFacebook size={18} />,
                  color: '#1877F2',
                  bgColor: '#E8F0FE',
                  borderColor: '#90CAF9',
                  url: merchant.facebook || `https://facebook.com/search/top?q=${encodeURIComponent(merchant.name || 'hotel topform')}`,
                  label: 'Facebook Page',
                },
                {
                  name: 'Instagram',
                  icon: <FaInstagram size={18} />,
                  color: '#E1306C',
                  bgColor: '#FCE4EC',
                  borderColor: '#F48FB1',
                  url: merchant.instagram || `https://instagram.com/explore/tags/${encodeURIComponent((merchant.name || 'hoteltopform').replace(/\s+/g, '').toLowerCase())}`,
                  label: 'Instagram',
                },
                {
                  name: 'Twitter / X',
                  icon: <FaTwitter size={18} />,
                  color: '#1DA1F2',
                  bgColor: '#E1F5FE',
                  borderColor: '#81D4FA',
                  url: merchant.twitter || `https://twitter.com/search?q=${encodeURIComponent(merchant.name || 'hotel topform')}`,
                  label: 'Twitter / X',
                },
                {
                  name: 'YouTube',
                  icon: <FaYoutube size={18} />,
                  color: '#FF0000',
                  bgColor: '#FFEBEE',
                  borderColor: '#EF9A9A',
                  url: merchant.youtube || `https://youtube.com/results?search_query=${encodeURIComponent(merchant.name || 'hotel topform')}`,
                  label: 'YouTube Channel',
                },
                {
                  name: 'Website',
                  icon: <FaGlobe size={18} />,
                  color: '#4F46E5',
                  bgColor: '#EEF2FF',
                  borderColor: '#C7D2FE',
                  url: merchant.website || 'https://www.topformpayyanur.com',
                  label: merchant.website ? merchant.website.replace(/^https?:\/\//, '') : 'Official Website',
                },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: social.bgColor,
                    border: `1px solid ${social.borderColor}`,
                    color: '#0F172A',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 13,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${social.color}25`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: '#FFFFFF',
                      color: social.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    {social.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {social.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {social.label}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: social.color, fontWeight: 700 }}>↗</span>
                </a>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HiOutlinePhotograph style={{ color: '#6C63FF' }} /> Photo Gallery
                <span style={{ fontSize: 13, background: '#EDE9FE', color: '#5B21B6', padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                  {photos.length} Photos
                </span>
              </h3>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Click photo to enlarge</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 12,
              }}
            >
              {photos.map((photoUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  style={{
                    position: 'relative',
                    height: 120,
                    borderRadius: 14,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(108, 99, 255, 0.25)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}
                >
                  <img
                    src={photoUrl}
                    alt={`Gallery photo ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(15, 23, 42, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = 0)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.75)', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      <HiOutlineZoomIn size={16} /> View Photo
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── MAP EMBED IF COORDINATES PRESENT ── */}
          {merchant.latitude && merchant.longitude && (
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              <iframe
                title="Google Maps Embed"
                width="100%"
                height="220"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps?q=${merchant.latitude},${merchant.longitude}&hl=en&z=15&output=embed`}
              />
            </div>
          )}

          {/* ── PROMO VIDEO IF PRESENT ── */}
          {merchant.videoUrl && (
            <div style={{ display: 'grid', gap: 10 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <HiOutlineVideoCamera style={{ color: '#6C63FF' }} /> Promo Video
              </h3>
              <div style={{ background: '#0F172A', borderRadius: 16, overflow: 'hidden' }}>
                <video controls src={merchant.videoUrl} style={{ width: '100%', maxHeight: 360, display: 'block' }} />
              </div>
            </div>
          )}

          {/* ── BOTTOM ACTION BUTTONS (Matching Screenshot) ── */}
          <div
            style={{
              paddingTop: 16,
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <a
              href={`tel:${merchant.phone || '+91 4985 205882'}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 28px',
                borderRadius: 12,
                background: '#6C63FF',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(108, 99, 255, 0.3)',
                transition: 'all 0.15s',
                minWidth: 160,
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#5A52D5')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#6C63FF')}
            >
              <HiOutlinePhone size={18} /> Call Merchant
            </a>

            <button
              onClick={handleOpenMaps}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 28px',
                borderRadius: 12,
                background: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                minWidth: 160,
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#1E293B')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#0F172A')}
            >
              <HiOutlineLocationMarker size={18} /> Google Maps
            </button>

            <button
              onClick={handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 28px',
                borderRadius: 12,
                background: '#EDE9FE',
                color: '#4F46E5',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                minWidth: 120,
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#DDD6FE')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#EDE9FE')}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── FULLSCREEN LIGHTBOX OVERLAY ── */}
      {lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              zIndex: 10000,
            }}
          >
            <HiX />
          </button>

          {/* Photo Counter */}
          <div
            style={{
              position: 'absolute',
              top: 28,
              left: 28,
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.15)',
              padding: '6px 16px',
              borderRadius: 20,
            }}
          >
            Photo {lightboxIndex + 1} of {photos.length}
          </div>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
            }}
            style={{
              position: 'absolute',
              left: 24,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              zIndex: 10000,
            }}
          >
            <HiChevronLeft />
          </button>

          {/* Main Image */}
          <img
            onClick={(e) => e.stopPropagation()}
            src={photos[lightboxIndex]}
            alt={`Photo ${lightboxIndex + 1}`}
            style={{
              maxWidth: '90vw',
              maxHeight: '82vh',
              borderRadius: 16,
              objectFit: 'contain',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          />

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
            }}
            style={{
              position: 'absolute',
              right: 24,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              zIndex: 10000,
            }}
          >
            <HiChevronRight />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
