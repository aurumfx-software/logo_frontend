import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiChevronLeft,
  HiSpeakerphone,
  HiTag,
  HiLocationMarker,
  HiExternalLink,
  HiCheckCircle,
  HiSparkles,
  HiFilter,
  HiPhone,
  HiOutlinePhotograph,
} from 'react-icons/hi';
import { fetchActivePromotions } from '../api/promotionApi';
import CustomerAuthModal from '../components/CustomerAuthModal';
import { DEFAULT_NEWS_CARDS } from '../components/landing/ZeashellBusinessNetworkSlider';

const BUSINESS_PACKAGES = [
  {
    id: 'pkg-1',
    name: 'Standard Local Listing',
    badge: 'STARTER',
    badgeColor: '#2563eb',
    price: '₹499',
    period: '/ 6 Months',
    features: [
      'Store Photos & Complete Business Bio',
      'Address & Google GPS Map Pin',
      'One-Tap WhatsApp & Direct Dial Call',
      'Category Listing in Local Directory',
      'Search Discovery across Kerala',
    ],
    popular: false,
    cardBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '1.5px solid #bfdbfe',
  },
  {
    id: 'pkg-2',
    name: 'Premium Subscription & Verified Tick',
    badge: '⭐ MOST POPULAR',
    badgeColor: '#f59e0b',
    price: '₹999',
    period: '/ Year',
    features: [
      'Official Verified Blue Tick Badge',
      'Boosted Top 3 Search Ranking',
      'Direct Community Marketplace Store Access',
      'Flash Offers & Promotion Banners',
      'Customer Lead Inquiries & Click Analytics',
      'Dedicated Customer Support Representative',
    ],
    popular: true,
    cardBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    border: '2px solid #3b82f6',
    textColor: '#ffffff',
  },
  {
    id: 'pkg-3',
    name: 'Festival Mega Advertising Promo',
    badge: '🔥 FESTIVE SPECIAL',
    badgeColor: '#e11d48',
    price: '₹1,499',
    period: '/ Year',
    features: [
      'Full Hero Banner Carousel Spotlight',
      'Middle In-Feed Banner Promotion',
      'Social Media Sharing & Direct WhatsApp Catalog',
      'Unlimited Product Listings in Store',
      'Priority Support & Dedicated Account Manager',
    ],
    popular: false,
    cardBg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    border: '1.5px solid #fecdd3',
  },
];

const KERALA_DISTRICTS = [
  'All Kerala',
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad',
];

const CARD_CLASSES = [
  'card-royal',
  'card-black',
  'card-crimson',
  'card-emerald',
  'card-amber',
  'card-violet',
  'card-teal',
  'card-orange',
  'card-ruby',
];

export default function AdsPage() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('All Kerala');
  const [activeTab, setActiveTab] = useState('network'); // 'network' | 'banners' | 'plans'
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

  useEffect(() => {
    async function loadAds() {
      setIsLoading(true);
      try {
        const data = await fetchActivePromotions();
        setPromotions(data || []);
      } catch (err) {
        console.warn('Failed to load promotions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAds();
  }, []);

  // Compute all Business Network News & Updates Cards (Default 9 Posters + Admin added ones)
  const businessNetworkAds = useMemo(() => {
    const adminCards = (promotions || [])
      .filter((p) => {
        const place = String(p.placement || '').toLowerCase();
        return (
          place === 'business network' ||
          place === 'business_network' ||
          place === 'news & updates' ||
          place === 'news'
        );
      })
      .map((p, idx) => {
        const cls = CARD_CLASSES[idx % CARD_CLASSES.length];
        const img = p.imageUrl || p.image_url || p.bannerUrl || p.banner_url || '';
        return {
          id: p.id || `custom-news-${idx}`,
          cardClass: cls,
          badge: p.badge || '⭐ PARTNER AD',
          badgeClass: 'dark',
          badgeSub: p.placement || 'BUSINESS NETWORK',
          badgeSubClass: 'emerald',
          title: p.title || p.merchant_name || 'Business Partner',
          malayalam: p.description || p.category || 'വിശ്വസ്ത സേവനങ്ങൾ നിങ്ങൾക്കായി',
          subtitle: p.subtitle || 'കേരളത്തിലെ വിശ്വസ്ത വ്യാപാരികൾ',
          highlight: p.highlight || (p.discount_percent ? `${p.discount_percent}% OFF SPECIAL` : 'BUSINESS SHOWCASE'),
          highlightClass: 'yellow',
          features: Array.isArray(p.features) && p.features.length > 0
            ? p.features
            : [
                p.category ? `Category: ${p.category}` : 'Verified Business Listing',
                p.location ? `Location: ${p.location}` : 'Statewide Kerala Reach',
                'One-Tap WhatsApp & Direct Calling',
                'Exclusive Directory Partner',
              ],
          checkClass: 'gold',
          discountLabel: p.discount_label || 'Special Deal',
          discountValue: p.discount_percent ? `${p.discount_percent}% OFF` : 'ACTIVE',
          discountClass: 'tag-green',
          btnText: p.btn_text || 'Contact Merchant',
          btnClass: 'gold',
          phone: p.phone_number || p.contact_number || '+91 860 60 800 74',
          imageUrl: img,
          rawPromo: p,
        };
      });

    return [...DEFAULT_NEWS_CARDS, ...adminCards];
  }, [promotions]);

  // Standard Commercial Banners / Ads excluding Business Network
  const commercialPromos = useMemo(() => {
    let list = (promotions || []).filter((p) => {
      const place = String(p.placement || '').toLowerCase();
      return (
        place !== 'business network' &&
        place !== 'business_network' &&
        place !== 'news & updates' &&
        place !== 'news'
      );
    });

    if (selectedDistrict !== 'All Kerala') {
      const distLower = selectedDistrict.toLowerCase();
      list = list.filter((p) => {
        const text = `${p.location || ''} ${p.district || ''} ${p.title || ''} ${p.description || ''}`.toLowerCase();
        return text.includes(distLower);
      });
    }
    return list;
  }, [promotions, selectedDistrict]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      {/* Header */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            margin: '0 auto',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={handleBack}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#eff6ff',
                color: '#2563eb',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
              title="Back"
            >
              <HiChevronLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HiSpeakerphone size={22} color="#2563eb" />
                <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  LOGO Business Network &amp; Ads
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Explore active promotions, partner showcases and verified Kerala business updates
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* District Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiLocationMarker size={15} color="#2563eb" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1e293b',
                  background: '#ffffff',
                  border: selectedDistrict !== 'All Kerala' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsOnboardModalOpen(true)}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
              }}
            >
              + List Your Business
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1360, margin: '28px auto', padding: '0 20px' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 32,
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: 10,
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('network')}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'network' ? '#2563eb' : '#eff6ff',
              color: activeTab === 'network' ? '#ffffff' : '#1e40af',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <span>📢 Business Network Posters ({businessNetworkAds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'banners' ? '#2563eb' : '#eff6ff',
              color: activeTab === 'banners' ? '#ffffff' : '#1e40af',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <span>🎯 Live Ad Showcases ({commercialPromos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'plans' ? '#2563eb' : '#eff6ff',
              color: activeTab === 'plans' ? '#ffffff' : '#1e40af',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
            }}
          >
            <span>💎 Membership Plans</span>
          </button>
        </div>

        {/* 1. LOGO Business Network News & Updates Posters Section */}
        {activeTab === 'network' && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ textAlign: 'center', maxWidth: 780, margin: '0 auto 36px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#eff6ff',
                  color: '#2563eb',
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontSize: 12.5,
                  fontWeight: 800,
                  marginBottom: 12,
                  border: '1px solid #bfdbfe',
                }}
              >
                <HiSpeakerphone size={15} />
                <span>LOGO BUSINESS NETWORK</span>
              </div>
              <h2
                style={{
                  fontSize: 'clamp(26px, 3.2vw, 36px)',
                  fontWeight: 900,
                  margin: '0 0 10px',
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                }}
              >
                News &amp; Updates
              </h2>
              <p style={{ margin: 0, fontSize: 16, color: '#64748b', fontWeight: 500 }}>
                Grow Your Business With Kerala's Fastest Growing Local Directory
              </p>
            </div>

            {/* Responsive Multi-Poster Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: 26,
              }}
            >
              {businessNetworkAds.map((card, idx) => (
                <div key={card.id || idx} style={{ display: 'flex' }}>
                  <div
                    className={`news-card ${card.cardClass}`}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '24px 26px',
                      borderRadius: 22,
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14)',
                      position: 'relative',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div>
                      <div className="news-card-top-row">
                        <span className={`news-card-badge ${card.badgeClass || ''}`}>{card.badge}</span>
                        <span className={`news-card-badge-sub ${card.badgeSubClass || ''}`}>
                          {card.badgeSub}
                        </span>
                      </div>

                      {card.imageUrl && (
                        <div
                          style={{
                            width: '100%',
                            height: 160,
                            borderRadius: 14,
                            overflow: 'hidden',
                            margin: '10px 0 14px',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                          }}
                        >
                          <img
                            src={card.imageUrl}
                            alt={card.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}

                      <div className="news-card-content">
                        <h3 style={{ fontSize: 20, margin: '8px 0 3px', color: '#ffffff', fontWeight: 800 }}>
                          {card.title}
                        </h3>
                        <p
                          className="news-malayalam"
                          style={{ fontSize: 14, margin: '2px 0 10px', color: 'rgba(255, 255, 255, 0.92)' }}
                        >
                          {card.malayalam}
                        </p>
                        <h4 style={{ fontSize: 13, margin: 0, color: 'rgba(255, 255, 255, 0.85)' }}>
                          {card.subtitle}
                        </h4>
                        <h2
                          className={`news-highlight ${card.highlightClass || ''}`}
                          style={{ fontSize: 22, margin: '6px 0 14px' }}
                        >
                          {card.highlight}
                        </h2>

                        <ul
                          className="news-features"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            padding: '10px 14px',
                            margin: '0 0 16px',
                            listStyle: 'none',
                          }}
                        >
                          {card.features.map((feat, fIdx) => (
                            <li
                              key={fIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 13,
                                color: '#ffffff',
                              }}
                            >
                              <HiCheckCircle
                                className={`feat-check ${card.checkClass || ''}`}
                                size={16}
                                style={{ flexShrink: 0 }}
                              />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <div className="news-card-footer" style={{ marginTop: 'auto', paddingTop: 14 }}>
                        <div className={`discount-tag ${card.discountClass || ''}`}>
                          <span>{card.discountLabel}</span>
                          <strong>{card.discountValue}</strong>
                        </div>
                        <button
                          type="button"
                          className={`news-join-btn ${card.btnClass || ''}`}
                          onClick={() => setIsOnboardModalOpen(true)}
                          style={{ cursor: 'pointer' }}
                        >
                          {card.btnText}
                        </button>
                      </div>
                      <div className="news-contact" style={{ marginTop: 12, textAlign: 'center' }}>
                        <a
                          href={`tel:${card.phone.replace(/\s+/g, '')}`}
                          style={{
                            color: 'rgba(255,255,255,0.95)',
                            textDecoration: 'none',
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          📞 Mob: {card.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. Live Commercial Banners & Showcases */}
        {activeTab === 'banners' && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', color: '#0f172a' }}>
                Active Promotional Campaigns ({commercialPromos.length})
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Verified business advertisements running in {selectedDistrict}
              </p>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📢</div>
                <p style={{ fontWeight: 600 }}>Loading active business campaigns...</p>
              </div>
            ) : commercialPromos.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  background: '#ffffff',
                  borderRadius: 16,
                  border: '1.5px dashed #cbd5e1',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>📢</div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#1e293b' }}>
                  No active ad campaigns in {selectedDistrict}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                  Be the first business to launch an advertisement banner in this region!
                </p>
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(true)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  + Launch Your Ad Campaign
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 20,
                }}
              >
                {commercialPromos.map((promo) => {
                  const img = promo.imageUrl || promo.image_url || promo.bannerUrl;
                  return (
                    <div
                      key={promo.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        border: '1.5px solid #e2e8f0',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      }}
                    >
                      {img && (
                        <div style={{ width: '100%', height: 180, overflow: 'hidden' }}>
                          <img
                            src={img}
                            alt={promo.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#2563eb',
                              background: '#eff6ff',
                              padding: '3px 8px',
                              borderRadius: 6,
                            }}
                          >
                            {promo.placement || promo.type || 'FEATURED AD'}
                          </span>
                          {promo.district && (
                            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                              📍 {promo.district}
                            </span>
                          )}
                        </div>

                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                          {promo.title}
                        </h3>

                        {promo.description && (
                          <p
                            style={{
                              fontSize: 13,
                              color: '#475569',
                              margin: '0 0 14px',
                              lineHeight: 1.5,
                              flex: 1,
                            }}
                          >
                            {promo.description}
                          </p>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: 12,
                            borderTop: '1px solid #f1f5f9',
                            marginTop: 'auto',
                          }}
                        >
                          {promo.phone_number ? (
                            <a
                              href={`tel:${promo.phone_number}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#16a34a',
                                textDecoration: 'none',
                              }}
                            >
                              <HiPhone size={14} />
                              <span>{promo.phone_number}</span>
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>Contact via directory</span>
                          )}

                          {promo.target_url && (
                            <a
                              href={promo.target_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#2563eb',
                                textDecoration: 'none',
                              }}
                            >
                              <span>Visit</span>
                              <HiExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 3. Business Membership Packages */}
        {activeTab === 'plans' && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 32px' }}>
              <span
                style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Subscription Plans
              </span>
              <h2
                style={{
                  fontSize: 'clamp(24px, 3vw, 32px)',
                  fontWeight: 900,
                  margin: '10px 0 6px',
                  color: '#0f172a',
                }}
              >
                Grow Your Reach with Kerala's Top Local Network
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                Select a flexible plan to get featured at the top of search results, connect on WhatsApp, and sell directly.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 24,
              }}
            >
              {BUSINESS_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  style={{
                    background: pkg.cardBg,
                    border: pkg.border,
                    borderRadius: 20,
                    padding: '30px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: pkg.popular
                      ? '0 16px 36px rgba(15, 23, 42, 0.2)'
                      : '0 4px 16px rgba(0, 0, 0, 0.05)',
                    transform: pkg.popular ? 'scale(1.02)' : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        background: pkg.badgeColor,
                        color: '#ffffff',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 12,
                        letterSpacing: '0.03em',
                      }}
                    >
                      {pkg.badge}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      margin: '0 0 12px',
                      color: pkg.textColor || '#0f172a',
                    }}
                  >
                    {pkg.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                    <span
                      style={{
                        fontSize: 32,
                        fontWeight: 900,
                        color: pkg.popular ? '#38bdf8' : '#2563eb',
                      }}
                    >
                      {pkg.price}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: pkg.popular ? '#94a3b8' : '#64748b',
                        fontWeight: 600,
                      }}
                    >
                      {pkg.period}
                    </span>
                  </div>

                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      flex: 1,
                    }}
                  >
                    {pkg.features.map((feat, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          color: pkg.popular ? '#cbd5e1' : '#334155',
                        }}
                      >
                        <HiCheckCircle
                          size={16}
                          color={pkg.popular ? '#34d399' : '#16a34a'}
                          style={{ flexShrink: 0 }}
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => setIsOnboardModalOpen(true)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 12,
                      background: pkg.popular ? '#3b82f6' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    Choose {pkg.name.split(' ')[0]}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Customer / Merchant Registration Modal */}
      <CustomerAuthModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        initialTab="register"
        onAuthSuccess={() => setIsOnboardModalOpen(false)}
      />
    </div>
  );
}