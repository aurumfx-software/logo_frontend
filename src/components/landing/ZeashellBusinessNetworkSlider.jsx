import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiChevronLeft, HiChevronRight, HiArrowRight, HiSpeakerphone } from 'react-icons/hi';

const DEFAULT_NEWS_CARDS = [
  {
    id: 'news-1',
    cardClass: 'card-royal',
    badge: 'JOIN US',
    badgeSub: 'STANDARD LISTING',
    badgeSubClass: '',
    title: 'My Locality Info',
    malayalam: 'Mobile Application ൽ ലിസ്റ്റ് ചെയ്യൂ',
    subtitle: 'ലോകമറിയട്ടെ നിങ്ങളുടെ',
    highlight: 'BUSINESS & OFFERS',
    highlightClass: '',
    features: [
      'Multi Photos & Store Details',
      'Address & Exact GPS Location',
      'Direct Calling & One-Tap WhatsApp',
      'Social Page Sharing & Distance',
    ],
    checkClass: '',
    discountLabel: 'Special Launch Offer',
    discountValue: '50% OFF',
    discountClass: '',
    btnText: 'List Business',
    btnClass: '',
    phone: '+91 860 60 800 74',
  },
  {
    id: 'news-2',
    cardClass: 'card-black',
    badge: '⭐ PREMIUM SUBSCRIPTION',
    badgeClass: 'dark',
    badgeSub: 'TOP RANKING',
    badgeSubClass: 'emerald',
    title: 'My Locality Info',
    malayalam: 'Mobile Application ൽ ലിസ്റ്റ് ചെയ്യൂ',
    subtitle: 'ലോകമറിയട്ടെ നിങ്ങളുടെ',
    highlight: 'BUSINESS & OFFERS',
    highlightClass: 'yellow',
    features: [
      'E-Commerce Portal Access',
      'Video Reels & HD Image Gallery',
      'Flash Offers & Distance Filter',
      'Customer Analytics & Direct Leads',
    ],
    checkClass: 'gold',
    discountLabel: 'Annual Plan Savings',
    discountValue: '50% OFF',
    discountClass: 'tag-green',
    btnText: 'Get Premium',
    btnClass: 'gold',
    phone: '+91 860 60 800 74',
  },
  {
    id: 'news-3',
    cardClass: 'card-crimson',
    badge: '🔥 SPECIAL OFFER',
    badgeSub: 'FESTIVAL PROMO',
    badgeSubClass: 'rose',
    title: 'My Locality Info',
    malayalam: 'Mobile Application ൽ ലിസ്റ്റ് ചെയ്യൂ',
    subtitle: 'ലോകമറിയട്ടെ നിങ്ങളുടെ',
    highlight: 'BUSINESS & OFFERS',
    highlightClass: 'pink',
    features: [
      'Verified Blue Tick Merchant Badge',
      'Boosted Top 3 Search Ranking',
      'WhatsApp Catalog & Direct Orders',
      'Dedicated Account Manager & Support',
    ],
    checkClass: 'pink',
    discountLabel: 'Festival Promotion',
    discountValue: '50% OFF',
    discountClass: 'tag-purple',
    btnText: 'Claim Offer',
    btnClass: 'rose',
    phone: '+91 860 60 800 74',
  },
];

export default function ZeashellBusinessNetworkSlider({
  onOpenOnboard,
  promotions = [],
  onSelectPromo,
}) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);

  // Combine default news cards with any live promotions with rich ad designs
  const allCards = React.useMemo(() => {
    return DEFAULT_NEWS_CARDS;
  }, []);

  const totalSlides = allCards.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // 5-second Auto-slide
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, totalSlides, nextSlide]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  return (
    <section className="landing-news-section" style={{ position: 'relative' }}>
      <div
        className="landing-news-header"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div className="news-badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <HiSpeakerphone size={14} />
            <span>LOGO BUSINESS NETWORK</span>
          </div>
          <h2 className="news-title">News &amp; Updates</h2>
          <p className="news-subtitle">Grow Your Business With Kerala's Fastest Growing Local Directory</p>
        </div>

        {/* View All Button & Slide Chevrons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate('/ads')}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background: '#eff6ff',
              color: '#2563eb',
              border: '1.5px solid #bfdbfe',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
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
            <span>View All Ads &amp; Updates</span>
            <HiArrowRight size={14} />
          </button>

          <button
            type="button"
            onClick={prevSlide}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
            }}
            aria-label="Previous Slide"
          >
            <HiChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
            }}
            aria-label="Next Slide"
          >
            <HiChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Auto-sliding Carousel Container */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          overflow: 'hidden',
          borderRadius: 20,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            transition: 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)',
            transform: `translateX(-${currentIndex * 100}%)`,
            width: '100%',
          }}
        >
          {allCards.map((card, idx) => (
            <div
              key={card.id || idx}
              style={{
                minWidth: '100%',
                width: '100%',
                flexShrink: 0,
                padding: '4px',
                boxSizing: 'border-box',
              }}
            >
              <div
                className={`news-card ${card.cardClass}`}
                style={{
                  maxWidth: 720,
                  margin: '0 auto',
                  padding: '24px 28px',
                  borderRadius: 20,
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18)',
                }}
              >
                <div className="news-card-top-row">
                  <span className={`news-card-badge ${card.badgeClass || ''}`}>{card.badge}</span>
                  <span className={`news-card-badge-sub ${card.badgeSubClass || ''}`}>
                    {card.badgeSub}
                  </span>
                </div>
                <div className="news-card-content">
                  <h3 style={{ fontSize: 20, margin: '4px 0' }}>{card.title}</h3>
                  <p className="news-malayalam" style={{ fontSize: 15, margin: '2px 0 8px' }}>
                    {card.malayalam}
                  </p>
                  <h4 style={{ fontSize: 14, margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>
                    {card.subtitle}
                  </h4>
                  <h2
                    className={`news-highlight ${card.highlightClass || ''}`}
                    style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', margin: '4px 0 14px' }}
                  >
                    {card.highlight}
                  </h2>

                  <ul
                    className="news-features"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '8px 16px',
                      padding: 0,
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

                <div className="news-card-footer" style={{ marginTop: 'auto', paddingTop: 12 }}>
                  <div className={`discount-tag ${card.discountClass || ''}`}>
                    <span>{card.discountLabel}</span>
                    <strong>{card.discountValue}</strong>
                  </div>
                  <button
                    type="button"
                    className={`news-join-btn ${card.btnClass || ''}`}
                    onClick={onOpenOnboard}
                    style={{ cursor: 'pointer' }}
                  >
                    {card.btnText}
                  </button>
                </div>
                <div className="news-contact" style={{ marginTop: 12, textAlign: 'center' }}>
                  <a
                    href={`tel:${card.phone.replace(/\s+/g, '')}`}
                    style={{ color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}
                  >
                    📞 Mob: {card.phone}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {totalSlides > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 18,
          }}
        >
          {allCards.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              style={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentIndex ? '#2563eb' : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
