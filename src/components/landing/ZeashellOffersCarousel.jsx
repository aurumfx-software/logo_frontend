import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { HiChevronLeft, HiChevronRight, HiFilter, HiLocationMarker, HiSparkles } from 'react-icons/hi';
import { useSliderInterval } from '../../utils/useSliderInterval';

const POPULAR_OFFER_CATEGORIES = [
  'All Categories',
  'Retail & Shopping',
  'Shopping & Fashion',
  'Interiors & Furniture',
  'Electronics & Gadgets',
  'Food & Dining',
];

const KERALA_DISTRICTS_FILTER = [
  'All Locations',
  'Kozhikode',
  'Kannur',
  'Ernakulam',
  'Malappuram',
  'Thiruvananthapuram',
  'Thrissur',
  'Kollam',
  'Palakkad',
  'Alappuzha',
  'Kottayam',
  'Kasaragod',
  'Wayanad',
  'Idukki',
  'Pathanamthitta',
];

export default function ZeashellOffersCarousel({ offers = [], onSelectOffer }) {
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  // Filter States
  const [activeSort, setActiveSort] = useState('all'); // 'all' | 'latest' | 'discount'
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');

  // Dynamically extract categories present in offers
  const availableCategories = useMemo(() => {
    const set = new Set();
    offers.forEach((o) => {
      if (o.category) set.add(o.category);
    });
    const fromOffers = Array.from(set);
    return ['All Categories', ...fromOffers];
  }, [offers]);

  // Filtered and Sorted Offers List
  const filteredOffers = useMemo(() => {
    let list = [...offers];

    // Category Filter
    if (selectedCategory !== 'All Categories') {
      list = list.filter((o) =>
        (o.category || '').toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Location Filter
    if (selectedLocation !== 'All Locations') {
      const locQ = selectedLocation.toLowerCase();
      list = list.filter((o) => {
        const text = `${o.location || ''} ${o.district || ''} ${o.address || ''} ${o.merchant || ''} ${o.description || ''} ${o.title || ''}`.toLowerCase();
        return text.includes(locQ);
      });
    }

    // Sort Filter
    if (activeSort === 'latest') {
      list = [...list].reverse();
    } else if (activeSort === 'discount') {
      list = [...list].sort((a, b) => {
        const discA = (a.discount || a.badge || '').toLowerCase();
        const discB = (b.discount || b.badge || '').toLowerCase();
        const scoreA = discA.includes('free') || discA.includes('buy 1 get 1') ? 100 : (parseInt(discA) || 0);
        const scoreB = discB.includes('free') || discB.includes('buy 1 get 1') ? 100 : (parseInt(discB) || 0);
        return scoreB - scoreA;
      });
    }

    return list;
  }, [offers, selectedCategory, selectedLocation, activeSort]);

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

  const autoSlideInterval = useSliderInterval(4, 'featured_offers');

  // Auto-scroll based on Super Admin backend interval when not paused
  useEffect(() => {
    if (isPaused || filteredOffers.length <= 1) return;
    const timer = setInterval(() => {
      scroll('next');
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [isPaused, filteredOffers.length, scroll, autoSlideInterval]);

  if (!offers.length) return null;

  return (
    <section className="zeas-blue-offers-section" aria-label="Featured Offers" style={{ margin: '36px auto' }}>
      <div className="zeas-blue-offers-header" style={{ flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 className="zeas-blue-section-title" style={{ margin: 0 }}>
            <span>🔥 Featured Offers</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
            Exclusive discounts, festive deals and special promotions across Kerala
          </p>
        </div>

        {/* Navigation Arrows */}
        <div className="zeas-blue-offers-nav" style={{ marginLeft: 'auto' }}>
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

      {/* Modern Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          marginBottom: 18,
        }}
      >
        {/* Sort & Quick Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveSort('all')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: activeSort === 'all' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
              background: activeSort === 'all' ? '#2563eb' : '#ffffff',
              color: activeSort === 'all' ? '#ffffff' : '#334155',
              transition: 'all 0.15s',
            }}
          >
            All Offers
          </button>
          <button
            type="button"
            onClick={() => setActiveSort('latest')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: activeSort === 'latest' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
              background: activeSort === 'latest' ? '#2563eb' : '#ffffff',
              color: activeSort === 'latest' ? '#ffffff' : '#334155',
              transition: 'all 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <HiSparkles size={14} />
            <span>Latest</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSort('discount')}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              border: activeSort === 'discount' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
              background: activeSort === 'discount' ? '#2563eb' : '#ffffff',
              color: activeSort === 'discount' ? '#ffffff' : '#334155',
              transition: 'all 0.15s',
            }}
          >
            🏷️ Top Discounts
          </button>
        </div>

        {/* Dropdowns for Location & Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Location Filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <HiLocationMarker size={14} style={{ position: 'absolute', left: 10, color: '#64748b', pointerEvents: 'none' }} />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                padding: '6px 12px 6px 28px',
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                color: '#1e293b',
                background: '#ffffff',
                border: selectedLocation !== 'All Locations' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {KERALA_DISTRICTS_FILTER.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: '#1e293b',
              background: '#ffffff',
              border: selectedCategory !== 'All Categories' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Reset Filters if changed */}
          {(selectedCategory !== 'All Categories' || selectedLocation !== 'All Locations' || activeSort !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setActiveSort('all');
                setSelectedCategory('All Categories');
                setSelectedLocation('All Locations');
              }}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#ef4444',
                background: '#fee2e2',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Offers Carousel / Grid */}
      {filteredOffers.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1.5px dashed #cbd5e1',
            padding: '36px 20px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <div style={{ fontSize: 24, marginBottom: 8 }}>🏷️</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>
            No offers match your selected filter
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 13 }}>
            Try selecting "All Locations" or "All Categories" to view available deals.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveSort('all');
              setSelectedCategory('All Categories');
              setSelectedLocation('All Locations');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            View All Offers
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="zeas-blue-offers-carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {filteredOffers.map((offer, idx) => (
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
      )}
    </section>
  );
}
