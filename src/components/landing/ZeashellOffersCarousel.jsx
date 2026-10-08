import React, { useRef, useState, useEffect, useCallback } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function ZeashellOffersCarousel({ offers = [], onSelectOffer }) {
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  const scroll = useCallback((direction) => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const cardWidth = 340;
    if (direction === 'next') {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 20) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    } else {
      if (el.scrollLeft <= 20) {
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -cardWidth, behavior: 'smooth' });
      }
    }
  }, []);

  // Auto-scroll every 3.5 seconds
  useEffect(() => {
    if (isPaused || offers.length === 0) return;
    const timer = setInterval(() => {
      scroll('next');
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, offers.length, scroll]);

  if (!offers.length) return null;

  return (
    <section className="zeas-blue-offers-section" aria-label="Featured Offers">
      <div className="zeas-blue-offers-header">
        <h2 className="zeas-blue-section-title">
          <span>🔥 Featured Offers</span>
        </h2>
        <div className="zeas-blue-offers-nav">
          <button
            type="button"
            className="zeas-blue-offers-arrow-btn"
            onClick={() => scroll('prev')}
            aria-label="Previous Offers"
          >
            <HiChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="zeas-blue-offers-arrow-btn"
            onClick={() => scroll('next')}
            aria-label="Next Offers"
          >
            <HiChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="zeas-blue-offers-carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {offers.map((offer, idx) => (
          <div
            key={offer.id || idx}
            className="zeas-blue-offer-card"
            onClick={() => onSelectOffer && onSelectOffer(offer)}
          >
            {/* Banner Top */}
            <div
              className="zeas-blue-offer-banner"
              style={{
                background:
                  offer.bgGradient ||
                  'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
              }}
            >
              {(offer.imageUrl || offer.image_url || offer.bannerUrl) ? (
                <img
                  src={offer.imageUrl || offer.image_url || offer.bannerUrl}
                  alt={offer.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : null}
              <span className="zeas-blue-offer-badge">
                {offer.discount || offer.badge || 'SPECIAL OFFER'}
              </span>
              {!(offer.imageUrl || offer.image_url || offer.bannerUrl) && (
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    textAlign: 'center',
                    margin: 0,
                    textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    padding: '0 16px',
                  }}
                >
                  {offer.title}
                </h3>
              )}
            </div>

            {/* Offer Body */}
            <div className="zeas-blue-offer-body">
              <span className="zeas-blue-offer-merchant">
                {offer.merchant || offer.subtitle || 'Verified Merchant'}
              </span>
              <h4 className="zeas-blue-offer-title">{offer.title}</h4>
              <p className="zeas-blue-offer-desc">
                {offer.description || offer.details || 'Limited time festive offer in your locality.'}
              </p>
              <div className="zeas-blue-offer-footer">
                <span>{offer.validity || (offer.end_date ? `Valid till ${offer.end_date}` : 'Limited Time')}</span>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                >
                  {offer.category || 'Special'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
