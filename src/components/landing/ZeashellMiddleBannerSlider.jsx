import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HiChevronLeft, HiChevronRight, HiArrowRight, HiSparkles, HiPlay } from 'react-icons/hi';

const DEFAULT_MIDDLE_FALLBACK = [
  {
    id: 'mid-1',
    badge: '🌟 SMART TECH & LIVING',
    title: 'Kerala Smart Living & Mega Electronics Expo',
    highlightText: 'Smart Living',
    subtitle: 'Explore 5G smart gadgets, next-gen 4K TVs, home automation, and mega electronics festival offers from verified Kerala retailers.',
    tags: ['⚡ 5G Tech Expo', '📺 4K Smart TVs', '🏷️ Up to 45% Off', '📍 All Kerala Multi-Store'],
    ctaText: 'Explore Tech Deals',
    imageUrl: '/banners/sponsored_banner_1_hd.jpg',
    targetUrl: '#establishments-section',
    placement: 'Home Middle',
  },
  {
    id: 'mid-2',
    badge: '💎 BRIDAL FESTIVAL',
    title: 'Kerala Bridal Gold & Diamond Jewellery Festival',
    highlightText: 'Gold & Diamond',
    subtitle: 'Certified 916 BIS Hallmark bridal sets, antique temple jewellery, and zero making charges on lightweight festive collections.',
    tags: ['✨ 916 BIS Hallmark', '💍 Bridal Sets', '🏷️ 0% Making Charge', '📍 Top Kerala Showrooms'],
    ctaText: 'View Jewellery Deals',
    imageUrl: '/banners/kerala_gold_jewellery_fest.png',
    targetUrl: '#establishments-section',
    placement: 'Home Middle',
  },
  {
    id: 'mid-3',
    badge: '🛋️ HOME & INTERIORS',
    title: 'Modern Kerala Furniture, Decor & Home Interiors',
    highlightText: 'Home Interiors',
    subtitle: 'Handcrafted teak wood living sets, modular kitchen packages, aesthetic dining collections and free 3D home design estimates.',
    tags: ['🪵 Solid Teak Wood', '🍳 Modular Kitchens', '🏷️ Flat 30% Festive Off', '📍 Verified Workshops'],
    ctaText: 'Explore Furniture',
    imageUrl: '/banners/sponsored_banner_2_hd.jpg',
    targetUrl: '#establishments-section',
    placement: 'Home Middle',
  },
  {
    id: 'mid-4',
    badge: '🍲 AUTHENTIC DINING',
    title: 'Authentic Malabar Traditional Cuisine & Food Festival',
    highlightText: 'Malabar Traditional',
    subtitle: 'Experience authentic slow-cooked Malabar Dum Biryani, Thalassery snacks, live Arabian grills, and fresh coastal seafood.',
    tags: ['🥘 Malabar Dum Biryani', '🍗 Arabian Grills', '🏷️ Family Platters', '📍 Calicut & Kochi'],
    ctaText: 'Discover Dining Deals',
    imageUrl: '/banners/malabar_food_fest.png',
    targetUrl: '#establishments-section',
    placement: 'Home Middle',
  },
  {
    id: 'mid-5',
    badge: '👗 FESTIVE FASHION',
    title: 'Exclusive Kerala Silk & Festive Designer Fashion',
    highlightText: 'Designer Fashion',
    subtitle: 'Traditional Kasavu sarees, handloom silks, festive bridal wear, and trending designer ethnic collections across Kerala.',
    tags: ['🥻 Kasavu Silk', '✨ Handloom Weaves', '🏷️ Special Festive Prices', '📍 Kerala Boutiques'],
    ctaText: 'Shop Fashion Deals',
    imageUrl: '/banners/top_fashion_lifestyle.png',
    targetUrl: '#establishments-section',
    placement: 'Home Middle',
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
}) {
  const videoRef = useRef(null);

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
      onEnded={onEnded}
      className={className}
      style={style}
    />
  );
}

export default function ZeashellMiddleBannerSlider({ banners = [], onBannerClick, onTagClick }) {
  const validBanners = React.useMemo(() => {
    const withMedia = (banners || []).filter((b) => {
      if (!b) return false;
      const img = (b.imageUrl || b.bannerUrl || b.image_url || '').toLowerCase();
      const title = (b.title || '').toLowerCase();
      const hasMedia = b.videoUrl || b.video_url || b.imageUrl || b.image_url || b.bannerUrl;
      const isOldStreetwear =
        img.includes('b5a16f15933e4fb58c69aaa7d06ada79') ||
        img.includes('f00c66fec5664bccad17d659669f2fb4') ||
        img.includes('f80efa88ad104ec2a90abe26c93799d5') ||
        img.includes('e23ebe757e194b5394e4af370b571f56') ||
        img.includes('1509631179647') ||
        title.includes('aspire to be') ||
        title.includes('dada supreme');
      return hasMedia && !isOldStreetwear;
    });

    if (withMedia.length === 0) return [];

    // Enhance banners with rich fields if missing
    return withMedia.map((b, idx) => {
      const title = b.title || 'Kerala Special Showcase';
      const highlight = b.highlightText || b.highlight_text || title.split(' ')[0] || 'Kerala';
      const subtitle = b.description || b.subtitle || 'Discover verified local merchants, exclusive deals, and top-rated services in Kerala.';
      const badge = b.badge || (b.category ? `🌟 ${b.category.toUpperCase()}` : '📢 SPONSORED SPOTLIGHT');
      const tags = Array.isArray(b.tags) && b.tags.length > 0
        ? b.tags
        : [b.category ? `📍 ${b.category}` : '📍 Kerala', '⭐ Top Rated', '⚡ Limited Deal', '🛍️ Verified Merchant'];
      const ctaText = b.ctaText || b.cta_text || 'Explore Offer & Visit';
      const targetUrl = b.targetUrl || b.target_url || '#establishments-section';
      const imageUrl = b.imageUrl || b.image_url || b.bannerUrl;
      const videoUrl = b.videoUrl || b.video_url;

      return {
        ...b,
        id: b.id || `mid-${idx}`,
        title,
        highlightText: highlight,
        subtitle,
        badge,
        tags,
        ctaText,
        targetUrl,
        imageUrl,
        videoUrl,
      };
    });
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

  const currentBanner = validBanners[current] || validBanners[0];
  const currentVideoUrl = currentBanner ? (currentBanner.videoUrl || currentBanner.video_url) : null;
  const isCurrentVideo = Boolean(
    currentBanner &&
    (currentBanner.mediaType === 'video' || currentBanner.media_type === 'video' || currentVideoUrl) &&
    currentVideoUrl
  );
  const currentImgUrl = currentBanner ? (currentBanner.imageUrl || currentBanner.image_url || currentBanner.bannerUrl) : '';

  // Auto-slide: 3.5s for images; if current ad is video, wait for video onEnded
  useEffect(() => {
    if (isPaused || validBanners.length <= 1) return;
    if (isCurrentVideo) return;

    const timer = setTimeout(() => {
      next();
    }, 3500);

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

  const handleAction = (e) => {
    if (e) e.stopPropagation();
    if (onBannerClick) {
      onBannerClick(currentBanner);
    } else if (currentBanner.targetUrl && currentBanner.targetUrl.startsWith('#')) {
      const el = document.querySelector(currentBanner.targetUrl);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (currentBanner.targetUrl && currentBanner.targetUrl !== '#') {
      window.open(currentBanner.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleTag = (tag, e) => {
    if (e) e.stopPropagation();
    if (onTagClick) {
      onTagClick(tag);
    } else {
      const clean = tag.replace(/^[^\w\s]+/, '').trim();
      const input = document.querySelector('.zeas-blue-search-pill-box input');
      if (input) {
        input.value = clean;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const sec = document.getElementById('establishments-section');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="zeas-middle-hero-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="In-between Sponsored Advertisement"
    >
      <div
        className="zeas-middle-hero-inner"
        onClick={handleAction}
      >
        {/* LEFT SIDE: Full View Image with Ambient Shade & Shadow (Zero White Shade, Zero Cropping) */}
        <div className="zeas-middle-hero-left">
          {/* Ambient Blurred Backdrop for widescreen full-view presentation */}
          {currentImgUrl && (
            <div
              className="zeas-middle-hero-blur-bg"
              style={{ backgroundImage: `url(${currentImgUrl})` }}
              aria-hidden="true"
            />
          )}

          {/* Deep frame shadow / vignette for depth (shade ayitt nikkanam) */}
          <div className="zeas-middle-hero-frame-shade" aria-hidden="true" />

          {isCurrentVideo && currentVideoUrl ? (
            <div className="zeas-middle-hero-media-wrap">
              <SlideVideo
                src={currentVideoUrl}
                poster={currentImgUrl || ''}
                isActive={true}
                isPaused={isPaused}
                onEnded={next}
                className="zeas-middle-hero-video-player"
              />
              <div className="zeas-middle-hero-media-indicator">
                <HiPlay size={12} />
                <span>HD Sponsored Video</span>
              </div>
            </div>
          ) : (
            <div className="zeas-middle-hero-media-wrap">
              <img
                key={`mid-img-${current}-${currentImgUrl}`}
                src={currentImgUrl}
                alt={currentBanner.title || 'Middle Advertisement'}
                className="zeas-middle-hero-img"
                draggable={false}
                onError={(e) => {
                  e.target.src = DEFAULT_MIDDLE_FALLBACK[0].imageUrl;
                }}
              />
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Text & Content (Badge, Title, Description, Tags, CTA button) */}
        <div className="zeas-middle-hero-right">
          {currentBanner.badge && (
            <div className="zeas-middle-hero-badge">
              <HiSparkles className="badge-sparkle" size={14} />
              <span>{currentBanner.badge}</span>
            </div>
          )}

          <h2 className="zeas-middle-hero-title">
            {currentBanner.highlightText && currentBanner.title.includes(currentBanner.highlightText) ? (
              <>
                {currentBanner.title.split(currentBanner.highlightText)[0]}
                <span className="zeas-middle-gradient-text">{currentBanner.highlightText}</span>
                {currentBanner.title.split(currentBanner.highlightText)[1]}
              </>
            ) : (
              currentBanner.title
            )}
          </h2>

          <p className="zeas-middle-hero-desc">
            {currentBanner.subtitle || currentBanner.description}
          </p>

          {/* Interactive Tag Pills */}
          {Array.isArray(currentBanner.tags) && currentBanner.tags.length > 0 && (
            <div className="zeas-middle-tag-pills">
              {currentBanner.tags.map((tag, tIdx) => (
                <button
                  key={tIdx}
                  type="button"
                  className="zeas-middle-pill-btn"
                  onClick={(e) => handleTag(tag, e)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="zeas-middle-hero-actions">
            <button
              type="button"
              className="zeas-middle-cta-btn"
              onClick={handleAction}
            >
              <span>{currentBanner.ctaText || 'Explore Deal & Visit'}</span>
              <HiArrowRight size={16} />
            </button>
            <span className="zeas-middle-badge-verified">
              🛡️ Verified Partner
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Controls: Chevrons */}
      {validBanners.length > 1 && (
        <>
          <button
            type="button"
            className="zeas-middle-nav-arrow prev"
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
            className="zeas-middle-nav-arrow next"
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

      {/* Slide Indicators */}
      {validBanners.length > 1 && (
        <div className="zeas-middle-indicators">
          {validBanners.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`zeas-middle-dot ${i === current ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
