import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const DEFAULT_BANNER_FALLBACK = [
  {
    id: 'def-wide-1',
    title: 'Kerala Festive Mega Grand Shopping Festival — Up to 50% Off',
    imageUrl: '/banners/top_grand_festival.png',
    targetUrl: '#',
    placement: 'Home Top',
  },
  {
    id: 'def-wide-2',
    title: 'Exclusive Kerala Silk & Festive Designer Fashion Collection',
    imageUrl: '/banners/top_fashion_lifestyle.png',
    targetUrl: '#',
    placement: 'Home Top',
  },
  {
    id: 'def-wide-3',
    title: 'Kerala 5G Smart Tech & Mega Electronics Expo',
    imageUrl: '/banners/kerala_electronics_fest.png',
    targetUrl: '#',
    placement: 'Home Top',
  },
  {
    id: 'def-wide-4',
    title: 'Kerala Bridal Gold & Diamond Jewellery Fest',
    imageUrl: '/banners/kerala_gold_jewellery_fest.png',
    targetUrl: '#',
    placement: 'Home Top',
  },
  {
    id: 'def-wide-5',
    title: 'Malabar Traditional Food & Dining Festival',
    imageUrl: '/banners/malabar_food_fest.png',
    targetUrl: '#',
    placement: 'Home Top',
  },
];

function SlideVideo({
  src,
  poster,
  isActive,
  isPaused,
  onEnded,
  className,
  style,
  totalSlides = 1,
}) {
  const videoRef = useRef(null);

  // Play / reset when active state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      try {
        video.currentTime = 0;
      } catch (err) {}
      if (!isPaused) {
        const p = video.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      }
    } else {
      video.pause();
      try {
        video.currentTime = 0;
      } catch (err) {}
    }
  }, [isActive]);

  // Handle pause / resume when user hovers
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;

    if (isPaused) {
      video.pause();
    } else {
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    }
  }, [isPaused, isActive]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      playsInline
      className={className}
      style={style}
      onEnded={() => {
        if (isActive) {
          if (totalSlides > 1 && onEnded) {
            onEnded();
          } else {
            const v = videoRef.current;
            if (v) {
              v.currentTime = 0;
              v.play().catch(() => {});
            }
          }
        }
      }}
      onError={() => {
        if (isActive && onEnded) {
          setTimeout(onEnded, 3000);
        }
      }}
    />
  );
}

export default function ZeashellBannerSlider({ banners = [], onBannerClick }) {
  // Purge any old low-quality or irrelevant banners from API data
  const validBanners = React.useMemo(() => {
    const list = Array.isArray(banners) ? banners : [];
    const filtered = list.filter((b) => {
      if (!b) return false;
      const title = (b.title || '').toLowerCase();
      const img = (b.imageUrl || b.bannerUrl || b.image_url || '').toLowerCase();
      const hasMedia = b.videoUrl || b.video_url || b.imageUrl || b.image_url || b.bannerUrl;
      const isBadOldImage =
        img.includes('4adc352793f74a30873381a9aa97dddb') ||
        img.includes('f183f22512ae4d35990bbef9cbb018fe') ||
        img.includes('264078ee513f48cb9bfdbdcc0698d330') ||
        img.includes('a700b5903440478bab885e729bf0e67a') ||
        img.includes('e763c69e5ccb420eb42f7ef46db960de');
      return hasMedia && !title.includes('bag bazaar') && !isBadOldImage;
    });
    return filtered.length > 0 ? filtered : DEFAULT_BANNER_FALLBACK;
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

  const currentBanner = validBanners[current];
  const currentVideoUrl = currentBanner ? (currentBanner.videoUrl || currentBanner.video_url) : null;
  const isCurrentVideo = Boolean(
    currentBanner &&
    (currentBanner.mediaType === 'video' || currentBanner.media_type === 'video' || currentVideoUrl) &&
    currentVideoUrl
  );

  // Auto-slide: 3 seconds for images; if current ad is a video, wait for full video playback (onEnded)
  useEffect(() => {
    if (isPaused || validBanners.length <= 1) return;
    if (isCurrentVideo) return; // Video controls its slide transition when playback finishes

    const timer = setTimeout(() => {
      next();
    }, 3000);

    return () => clearTimeout(timer);
  }, [current, isPaused, isCurrentVideo, next, validBanners.length]);

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
          const videoUrl = banner.videoUrl || banner.video_url;
          const isVideo = banner.mediaType === 'video' || banner.media_type === 'video' || !!videoUrl;
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
              {/* Blurred Ambient Backdrop for widescreen edge-to-edge aesthetic */}
              {imgUrl && (
                <div
                  className="zeas-blue-banner-blur-backdrop"
                  style={{ backgroundImage: `url(${imgUrl})` }}
                  aria-hidden="true"
                />
              )}

              {isVideo && videoUrl ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <SlideVideo
                    src={videoUrl}
                    poster={imgUrl || ''}
                    isActive={idx === current}
                    isPaused={isPaused}
                    onEnded={next}
                    totalSlides={validBanners.length}
                    className="zeas-blue-banner-image"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      position: 'absolute',
                      inset: 0,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '16px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px',
                      zIndex: 3,
                    }}
                  >
                    VIDEO
                  </div>
                </div>
              ) : (
                <img
                  src={imgUrl}
                  alt={banner.title || 'Advertisement'}
                  className="zeas-blue-banner-image"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                  draggable={false}
                  onError={(e) => {
                    e.target.src = DEFAULT_BANNER_FALLBACK[0].imageUrl;
                  }}
                />
              )}
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
