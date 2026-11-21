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
} from 'react-icons/hi';
import { fetchActivePromotions } from '../api/promotionApi';
import CustomerAuthModal from '../components/CustomerAuthModal';

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

export default function AdsPage() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('All Kerala');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'banners' | 'offers' | 'plans'
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

  const filteredPromos = useMemo(() => {
    let list = [...promotions];
    if (selectedDistrict !== 'All Kerala') {
      const distLower = selectedDistrict.toLowerCase();
      list = list.filter((p) => {
        const text = `${p.location || ''} ${p.district || ''} ${p.title || ''} ${p.description || ''}`.toLowerCase();
        return text.includes(distLower);
      });
    }
    return list;
  }, [promotions, selectedDistrict]);

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
              onClick={() => navigate('/')}
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
              }}
              title="Back to Home"
            >
              <HiChevronLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HiSpeakerphone size={20} color="#2563eb" />
                <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  Logo Business Network &amp; Ads
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
                  <option key={d} value={d}>{d}</option>
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
              + Advertise Your Business
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1360, margin: '32px auto', padding: '0 20px' }}>
        {/* Business Packages Section */}
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
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900, margin: '10px 0 6px', color: '#0f172a' }}>
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
                  boxShadow: pkg.popular ? '0 16px 36px rgba(15, 23, 42, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.05)',
                  transform: pkg.popular ? 'scale(1.02)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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

                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 12px', color: pkg.textColor || '#0f172a' }}>
                  {pkg.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: pkg.popular ? '#38bdf8' : '#2563eb' }}>
                    {pkg.price}
                  </span>
                  <span style={{ fontSize: 13, color: pkg.popular ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    {pkg.period}
                  </span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
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
                      <HiCheckCircle size={16} color={pkg.popular ? '#34d399' : '#16a34a'} style={{ flexShrink: 0 }} />
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

        {/* Live Promotions & Ads Section */}
        <section>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px', color: '#0f172a' }}>
              Active Ads &amp; Promotional Campaigns ({filteredPromos.length})
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
          ) : filteredPromos.length === 0 ? (
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
                No active ads in {selectedDistrict}
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
              {filteredPromos.map((promo) => {
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
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
                          <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <HiLocationMarker size={13} color="#3b82f6" />
                            <span>{promo.district}</span>
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                        {promo.title}
                      </h3>
                      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px', lineHeight: 1.4 }}>
                        {promo.description || promo.details || 'Exclusive business showcase on Logo Network.'}
                      </p>

                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                          {promo.discount || promo.badge || 'Verified Partner'}
                        </span>
                        {promo.targetUrl && (
                          <a
                            href={promo.targetUrl}
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
