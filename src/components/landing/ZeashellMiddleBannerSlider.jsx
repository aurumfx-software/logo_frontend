import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const DEFAULT_MIDDLE_FALLBACK = [
  {
    id: 'mid-1',
    title: 'Grand Malabar Food Festival',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/aa95cf6a6a1e4ca69e2ec8c7df871d92.jpg',
    targetUrl: '#',
    placement: 'Home Middle',
  },
  {
    id: 'mid-2',
    title: 'VR HERO MOTORS — Onam Mega Exchange',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/f8e526085d604b85a677e96cc18c00e7.png',
    targetUrl: '#',
    placement: 'Home Middle',
  },
  {
    id: 'mid-3',
    title: 'Life Medicals — 20% Health Discount',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/banners/df515a74b6b746a8bb961f1b71097873.jpeg',
    targetUrl: '#',
    placement: 'Home Middle',
  },
];

export default function ZeashellMiddleBannerSlider({ banners = [], onBannerClick }) {
  const validBanners = React.useMemo(() => {
    const withImages = banners.filter((b) => b && (b.imageUrl || b.image_url || b.bannerUrl));
    return withImages.length > 0 ? withImages : DEFAULT_MIDDLE_FALLBACK;
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

  // Auto-slide every 4.0 seconds
  useEffect(() => {
    if (isPaused || validBanners.length <= 1) return;
    const timer = setInterval(next, 4000);
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
    <div
      className="zeas-middle-ad-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="In-between Advertisement"
    >
      <div className="zeas-middle-ad-badge">
        <span>📢 SPONSORED HIGHLIGHT</span>
      </div>

      <div
        className="zeas-middle-ad-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {validBanners.map((banner, idx) => {
          const imgUrl = banner.imageUrl || banner.image_url || banner.bannerUrl;
          const target = banner.targetUrl || banner.target_url || '#';

          return (
            <div
              key={banner.id || idx}
              className="zeas-middle-ad-slide"
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
                alt={banner.title || 'Middle Advertisement'}
                className="zeas-middle-ad-image"
                draggable={false}
                onError={(e) => {
                  e.target.src = DEFAULT_MIDDLE_FALLBACK[0].imageUrl;
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Chevrons */}
      {validBanners.length > 1 && (
        <>
          <button
            type="button"
            className="zeas-middle-ad-arrow prev"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous Ad"
          >
            <HiChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="zeas-middle-ad-arrow next"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next Ad"
          >
            <HiChevronRight size={22} />
          </button>
        </>
      )}

      {/* Dots */}
      {validBanners.length > 1 && (
        <div className="zeas-middle-ad-dots">
          {validBanners.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`zeas-middle-ad-dot ${i === current ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
