import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const DEFAULT_BANNER_FALLBACK = [
  {
    id: 'def-1',
    title: 'BAG BAZAAR',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/f183f22512ae4d35990bbef9cbb018fe.jpeg',
    targetUrl: '#',
    placement: 'Home Top',
  },
  {
    id: 'def-2',
    title: 'VR HERO MOTORS',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/f8e526085d604b85a677e96cc18c00e7.png',
    targetUrl: '#',
    placement: 'Home Top',
  },
  {
    id: 'def-3',
    title: 'Pavizham Associates',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/aa95cf6a6a1e4ca69e2ec8c7df871d92.jpg',
    targetUrl: '#',
    placement: 'Home Top',
  },
  {
    id: 'def-4',
    title: 'Life Medicals',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/df515a74b6b746a8bb961f1b71097873.jpeg',
    targetUrl: '#',
    placement: 'Home Top',
  },
];

export default function ZeashellBannerSlider({ banners = [], onBannerClick }) {
  // Filter active banners with images, or fallback
  const validBanners = React.useMemo(() => {
    const withImages = banners.filter((b) => b && (b.imageUrl || b.image_url || b.bannerUrl));
    return withImages.length > 0 ? withImages : DEFAULT_BANNER_FALLBACK;
  }, [banners]);

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStart = useRef(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % validBanners.length);
  }, [validBanners.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + validBanners.length) % validBanners.length);
  }, [validBanners.length]);

  // Auto-slide every 4.5 seconds
  useEffect(() => {
    if (isPaused || validBanners.length <= 1) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [isPaused, next, validBanners.length]);

  // Touch Swipe
  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  if (!validBanners.length) return null;

  return (
    <section
      className="zeas-blue-banner-slider-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Advertisement Banners"
    >
      <div
        className="zeas-blue-banner-slider-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {validBanners.map((banner, idx) => {
          const imgUrl = banner.imageUrl || banner.image_url || banner.bannerUrl;
          const target = banner.targetUrl || banner.target_url || '#';

          return (
            <div
              key={banner.id || idx}
              className="zeas-blue-banner-slide"
              onClick={() => {
                if (onBannerClick) {
                  onBannerClick(banner);
                } else if (target && target !== '#') {
                  window.open(target, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              <img
                src={imgUrl}
                alt={banner.title || 'Advertisement'}
                className="zeas-blue-banner-image"
                draggable={false}
                onError={(e) => {
                  e.target.src = DEFAULT_BANNER_FALLBACK[0].imageUrl;
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Navigation Chevrons */}
      {validBanners.length > 1 && (
        <>
          <button
            type="button"
            className="zeas-blue-banner-arrow prev"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous Banner"
          >
            <HiChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="zeas-blue-banner-arrow next"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next Banner"
          >
            <HiChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {validBanners.length > 1 && (
        <div className="zeas-blue-banner-dots">
          {validBanners.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`zeas-blue-banner-dot ${i === current ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
