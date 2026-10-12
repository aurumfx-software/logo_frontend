import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

const DEFAULT_BOTTOM_FALLBACK = [
  {
    id: 'bot-1',
    title: 'Jeans Fashion',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/merchants/photos/b5a16f15933e4fb58c69aaa7d06ada79.jpg',
    targetUrl: '#',
    badge: 'EXCLUSIVE HIGHLIGHT',
  },
  {
    id: 'bot-2',
    title: 'Aspire to be Authentic',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/merchants/photos/f00c66fec5664bccad17d659669f2fb4.jpg',
    targetUrl: '#',
    badge: 'SPONSORED BRAND',
  },
  {
    id: 'bot-3',
    title: 'DADA Supreme Streetwear',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/merchants/photos/f80efa88ad104ec2a90abe26c93799d5.jpg',
    targetUrl: '#',
    badge: 'TRENDING COLLECTION',
  },
  {
    id: 'bot-4',
    title: 'Fashion Item Trendy Wear',
    imageUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/merchants/photos/e23ebe757e194b5394e4af370b571f56.jpg',
    targetUrl: '#',
    badge: 'SPECIAL PROMOTION',
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

export default function ZeashellBottomBannerSlider({ banners = [], onBannerClick }) {
  const validBanners = React.useMemo(() => {
    const list = Array.isArray(banners) ? banners : [];
    const withMedia = list.filter(
      (b) => b && (b.videoUrl || b.video_url || b.imageUrl || b.image_url || b.bannerUrl)
    );
    return withMedia.length > 0 ? withMedia : DEFAULT_BOTTOM_FALLBACK;
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
      className="zeas-bottom-ad-wrapper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Sponsored Promotions"
    >
      <div className="zeas-bottom-ad-badge">
        <span>📢 SPONSORED PROMOTION</span>
      </div>

      <div
        className="zeas-bottom-ad-track"
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
              className="zeas-bottom-ad-slide"
              onClick={() => {
                if (onBannerClick) {
                  onBannerClick(banner);
                } else if (target && target !== '#') {
                  window.open(target, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              {isVideo && videoUrl ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <SlideVideo
                    src={videoUrl}
                    poster={imgUrl || ''}
                    isActive={idx === current}
                    isPaused={isPaused}
                    onEnded={next}
                    totalSlides={validBanners.length}
                    className="zeas-bottom-ad-image"
                  />
                </div>
              ) : (
                <img
                  src={imgUrl}
                  alt={banner.title || 'Sponsored Advertisement'}
                  className="zeas-bottom-ad-image"
                  loading="lazy"
                />
              )}
            </div>
          );
        })}
      </div>

      {validBanners.length > 1 && (
        <>
          <button
            type="button"
            className="zeas-bottom-ad-arrow prev"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous Slide"
          >
            <HiChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="zeas-bottom-ad-arrow next"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next Slide"
          >
            <HiChevronRight size={20} />
          </button>

          <div className="zeas-bottom-ad-dots">
            {validBanners.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`zeas-bottom-ad-dot ${i === current ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(i);
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
