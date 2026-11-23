import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiChevronLeft, HiChevronRight, HiArrowRight, HiSpeakerphone } from 'react-icons/hi';
import { useSliderInterval } from '../../utils/useSliderInterval';

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
  {
    id: 'news-4',
    cardClass: 'card-emerald',
    badge: '🌾 AGRO & B2B HUB',
    badgeClass: 'dark',
    badgeSub: 'DIRECT FARM CONNECT',
    badgeSubClass: 'emerald',
    title: 'Kerala Farmers Mart',
    malayalam: 'ഉൽപ്പാദകരിൽ നിന്ന് നേരിട്ട് വിപണിയിലേക്ക്',
    subtitle: 'കേരളത്തിലെ ഏറ്റവും വലിയ',
    highlight: 'ORGANIC & WHOLESALE',
    highlightClass: 'yellow',
    features: [
      'Zero Middleman Direct Pricing',
      'Bulk Buyers & Hotel Supply Links',
      'Cold Chain & Logistics Access',
      'Organic Farm Verification Badge',
    ],
    checkClass: 'gold',
    discountLabel: 'Agro Special',
    discountValue: 'FREE 30 DAYS',
    discountClass: 'tag-green',
    btnText: 'Join Agro Hub',
    btnClass: 'gold',
    phone: '+91 860 60 800 74',
  },
  {
    id: 'news-5',
    cardClass: 'card-amber',
    badge: '✨ GOLD & JEWELLERY',
    badgeClass: 'dark',
    badgeSub: 'VERIFIED CIRCLE',
    badgeSubClass: 'emerald',
    title: 'Kerala Gold Exchange',
    malayalam: 'വിശ്വസ്തരായ സ്വർണ്ണ വ്യാപാരികൾ',
    subtitle: 'ആഭരണ പ്രേമികളിലേക്ക് നേരിട്ട്',
    highlight: 'BRIDAL & JEWELLERY',
    highlightClass: 'yellow',
    features: [
      '916 BIS Hallmark Verification',
      'Daily Live Gold Rate Display',
      'Bridal Booking Lead Network',
      'Showroom Video Showcase Link',
    ],
    checkClass: 'gold',
    discountLabel: 'Festive Promo',
    discountValue: '40% OFF',
    discountClass: 'tag-green',
    btnText: 'List Showroom',
    btnClass: 'gold',
    phone: '+91 860 60 800 74',
  },
  {
    id: 'news-6',
    cardClass: 'card-violet',
    badge: '🚀 TECH & AGENCIES',
    badgeClass: '',
    badgeSub: 'IT SOLUTIONS',
    badgeSubClass: 'rose',
    title: 'Kerala Digital Network',
    malayalam: 'ഐടി & ബിസിനസ്സ് സർവീസുകൾ',
    subtitle: 'നിങ്ങളുടെ സാങ്കേതിക സേവനങ്ങൾ',
    highlight: 'B2B DIGITAL SOLUTIONS',
    highlightClass: 'pink',
    features: [
      'Verified Software & Web Agencies',
      'Global Malayali Client Enquiries',
      'Portfolio & Live Project Showcase',
      'Priority B2B RFQ Leads',
    ],
    checkClass: 'pink',
    discountLabel: 'Startup Boost',
    discountValue: '60% OFF',
    discountClass: 'tag-purple',
    btnText: 'Register Agency',
    btnClass: 'rose',
    phone: '+91 860 60 800 74',
  },
  {
    id: 'news-7',
    cardClass: 'card-teal',
    badge: '🌴 TOURISM & STAYS',
    badgeClass: 'dark',
    badgeSub: 'GODS OWN COUNTRY',
    badgeSubClass: 'emerald',
    title: 'Kerala Tourism Direct',
    malayalam: 'റിസോർട്ടുകൾ & ഹൗസ് ബോട്ടുകൾ',
    subtitle: 'സഞ്ചാരികൾ നിങ്ങളെ തേടിയെത്തട്ടെ',
    highlight: 'RESORTS & TRAVEL',
    highlightClass: 'yellow',
    features: [
      'Wayanad & Munnar Stays Listing',
      'Zero Commission Direct Bookings',
      'Tourist Cab & Houseboat Link',
      'Google Review Integration',
    ],
    checkClass: 'gold',
    discountLabel: 'Holiday Package',
    discountValue: 'FLAT 50%',
    discountClass: 'tag-green',
    btnText: 'List Property',
    btnClass: 'gold',
    phone: '+91 860 60 800 74',
  },
  {
    id: 'news-8',
    cardClass: 'card-orange',
    badge: '🚚 EXPRESS LOGISTICS',
    badgeClass: 'dark',
    badgeSub: 'SAME-DAY PARCEL',
    badgeSubClass: 'emerald',
    title: 'Hyperlocal Delivery',
    malayalam: 'ഡോർസ്റ്റെപ് ഡെലിവറി വേഗത്തിൽ',
    subtitle: 'സംസ്ഥാനത്തുടനീളം അതിവേഗം',
    highlight: 'KERALA CARGO LINK',
    highlightClass: 'yellow',
    features: [
      '14 Districts Express Network',
      'Live Package Tracking for Buyers',
      'Hyperlocal 2-Hour Courier Option',
      'Integrated Merchant Dispatch Hub',
    ],
    checkClass: 'gold',
    discountLabel: 'Delivery Special',
    discountValue: 'FIRST 50 FREE',
    discountClass: 'tag-green',
    btnText: 'Book Delivery',
    btnClass: 'gold',
    phone: '+91 860 60 800 74',
  },
  {
    id: 'news-9',
    cardClass: 'card-ruby',
    badge: '🌿 AYURVEDA & HEALTH',
    badgeClass: '',
    badgeSub: 'TRADITIONAL HEALING',
    badgeSubClass: 'rose',
    title: 'AyurKerala Directory',
    malayalam: 'പാരമ്പര്യ ആയുർവേദ കേന്ദ്രങ്ങൾ',
    subtitle: 'ആരോഗ്യ പരിചരണ രംഗത്തെ വിശ്വസ്തർ',
    highlight: 'HERBAL & WELLNESS',
    highlightClass: 'pink',
    features: [
      'Certified Vaidyas & Clinics List',
      'Doctor Appointment Booking Link',
      'Authentic Herbal Pharmacy Store',
      'Verified Patient Ratings',
    ],
    checkClass: 'pink',
    discountLabel: 'Wellness Pass',
    discountValue: '35% OFF',
    discountClass: 'tag-purple',
    btnText: 'Enlist Clinic',
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

  // Hook into live Super Admin slider speed (default 5s for multi-card business network)
  const autoSlideInterval = useSliderInterval(5);

  // Responsive items per view: 3 on desktop, 2 on tablet, 1 on mobile
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardsPerPage = windowWidth >= 1024 ? 3 : windowWidth >= 640 ? 2 : 1;

  const allCards = useMemo(() => {
    return DEFAULT_NEWS_CARDS;
  }, []);

  // Group into pages of 3 cards on desktop
  const pages = useMemo(() => {
    const res = [];
    for (let i = 0; i < allCards.length; i += cardsPerPage) {
      res.push(allCards.slice(i, i + cardsPerPage));
    }
    return res;
  }, [allCards, cardsPerPage]);

  const totalPages = pages.length;

  useEffect(() => {
    if (currentIndex >= totalPages) {
      setCurrentIndex(0);
    }
  }, [currentIndex, totalPages]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  // Dynamic Auto-slide with Super Admin speed setting
  useEffect(() => {
    if (isPaused || totalPages <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, autoSlideInterval);
    return () => clearInterval(interval);
  }, [isPaused, totalPages, nextSlide, autoSlideInterval]);

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
            aria-label="Previous Set"
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
            aria-label="Next Set"
          >
            <HiChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Auto-sliding Multi-Poster Container (3 Posters at a time on desktop) */}
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
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
            transform: `translateX(-${currentIndex * 100}%)`,
            width: '100%',
          }}
        >
          {pages.map((pageCards, pageIdx) => (
            <div
              key={pageIdx}
              style={{
                minWidth: '100%',
                width: '100%',
                flexShrink: 0,
                padding: '4px',
                boxSizing: 'border-box',
                display: 'grid',
                gridTemplateColumns: `repeat(${cardsPerPage}, 1fr)`,
                gap: 16,
              }}
            >
              {pageCards.map((card, idx) => (
                <div key={card.id || idx} style={{ height: '100%', display: 'flex' }}>
                  <div
                    className={`news-card ${card.cardClass}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '22px 24px',
                      borderRadius: 20,
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.16)',
                    }}
                  >
                    <div>
                      <div className="news-card-top-row">
                        <span className={`news-card-badge ${card.badgeClass || ''}`}>{card.badge}</span>
                        <span className={`news-card-badge-sub ${card.badgeSubClass || ''}`}>
                          {card.badgeSub}
                        </span>
                      </div>
                      <div className="news-card-content">
                        <h3 style={{ fontSize: 18, margin: '4px 0' }}>{card.title}</h3>
                        <p className="news-malayalam" style={{ fontSize: 13, margin: '2px 0 8px' }}>
                          {card.malayalam}
                        </p>
                        <h4 style={{ fontSize: 13, margin: 0, color: 'rgba(255, 255, 255, 0.9)' }}>
                          {card.subtitle}
                        </h4>
                        <h2
                          className={`news-highlight ${card.highlightClass || ''}`}
                          style={{ fontSize: 'clamp(19px, 2.2vw, 24px)', margin: '4px 0 12px' }}
                        >
                          {card.highlight}
                        </h2>

                        <ul
                          className="news-features"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            padding: '8px 12px',
                            margin: '0 0 14px',
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
                                fontSize: 12.5,
                                color: '#ffffff',
                              }}
                            >
                              <HiCheckCircle
                                className={`feat-check ${card.checkClass || ''}`}
                                size={15}
                                style={{ flexShrink: 0 }}
                              />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
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
                      <div className="news-contact" style={{ marginTop: 10, textAlign: 'center' }}>
                        <a
                          href={`tel:${card.phone.replace(/\s+/g, '')}`}
                          style={{ color: 'rgba(255,255,255,0.95)', textDecoration: 'none', fontWeight: 700, fontSize: 12.5 }}
                        >
                          📞 Mob: {card.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 18,
          }}
        >
          {pages.map((_, i) => (
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
              aria-label={`Slide group ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
