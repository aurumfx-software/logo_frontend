import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HiChevronLeft, HiChevronRight, HiSparkles, HiArrowRight, HiPlay } from 'react-icons/hi';

const DEFAULT_ENVATO_SLIDES = [
  {
    id: 'envato-hero-1',
    title: "Discover Kerala's Verified Local Businesses",
    highlightText: "Local Businesses",
    subtitle: "Explore 1,000+ top-rated stores, authentic restaurants, exclusive festival discounts, and verified services across all 14 districts.",
    tags: ['🛍️ Fashion & Textiles', '📱 Mobiles & Electronics', '🍽️ Food & Dining', '💎 Gold & Jewellery', '🚗 Automobiles', '🩺 Healthcare'],
    videoUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/merchants/videos/72552f800b674a65b72dbaf2093165a7.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop&q=80',
    ctaText: 'Explore Verified Shops',
    targetUrl: '#establishments-section',
    badge: '🌟 KERALA HYPERLOCAL HUB',
  },
  {
    id: 'envato-hero-2',
    title: "Exclusive Kerala Festive Shopping & Offers",
    highlightText: "Festive Offers",
    subtitle: "Get up to 60% off on top brands, fashion collections, wedding jewellery, and home essentials with direct merchant contact.",
    tags: ['✨ Flat 50% Off', '👗 Wedding Wear', '⌚ Luxury Watches', '🛋️ Furniture', '📱 5G Smartphones'],
    videoUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/merchants/videos/72552f800b674a65b72dbaf2093165a7.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
    ctaText: 'View Festival Deals',
    targetUrl: '#featured-section',
    badge: '🎉 FESTIVAL SPECIAL',
  },
  {
    id: 'envato-hero-3',
    title: "Authentic Malabar & Kerala Dining Guide",
    highlightText: "Dining & Food",
    subtitle: "Discover iconic cafes, authentic traditional cuisines, fine dining, and fast delivery spots near your exact location.",
    tags: ['🍗 Malabar Dum Biryani', '☕ Traditional Teas', '🍰 Artisan Bakeries', '🥗 Veg Special', '🍦 Desserts'],
    videoUrl: 'https://aurumfx-images.sgp1.digitaloceanspaces.com/merchants/videos/72552f800b674a65b72dbaf2093165a7.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=80',
    ctaText: 'Find Restaurants Near You',
    targetUrl: '#establishments-section',
    badge: '🍽️ FOOD & DINING',
  },
];

export default function ZeashellEnvatoShowcase({ slides = [], onCtaClick, onTagClick }) {
  const validSlides = slides && slides.length > 0 ? slides : DEFAULT_ENVATO_SLIDES;

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStart = useRef(0);
  const videoRef = useRef(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % validSlides.length);
  }, [validSlides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + validSlides.length) % validSlides.length);
  }, [validSlides.length]);

  const currentSlide = validSlides[current] || validSlides[0];
  const videoUrl = currentSlide ? (currentSlide.videoUrl || currentSlide.video_url) : null;
  const isVideo = Boolean(
    currentSlide &&
    (currentSlide.mediaType === 'video' || currentSlide.media_type === 'video' || videoUrl) &&
    videoUrl
  );
  const imgUrl = currentSlide ? (currentSlide.imageUrl || currentSlide.image_url || currentSlide.bannerUrl) : '';

  // Control video playback on hover
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (isPaused) {
      video.pause();
    } else {
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    }
  }, [isPaused, isVideo, current]);

  // Auto-slide: 3 seconds for images; if current slide is a video, wait for full video playback (onEnded)
  useEffect(() => {
    if (isPaused || validSlides.length <= 1) return;
    if (isVideo) return; // Video controls its slide transition when playback finishes

    const timer = setTimeout(() => {
      next();
    }, 3000);

    return () => clearTimeout(timer);
  }, [current, isPaused, isVideo, next, validSlides.length]);

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

  if (!validSlides.length) return null;

  const handleAction = () => {
    if (onCtaClick) {
      onCtaClick(currentSlide);
    } else if (currentSlide.targetUrl && currentSlide.targetUrl.startsWith('#')) {
      const el = document.querySelector(currentSlide.targetUrl);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (currentSlide.targetUrl && currentSlide.targetUrl !== '#') {
      window.open(currentSlide.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section
      className="zeas-envato-hero-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Kerala Discovery Showcase"
      style={{ margin: '40px auto 20px' }}
    >
      <div className="zeas-envato-hero-inner">
        {/* Left Side: Content, Headlines, Filter Tags, Call to Action */}
        <div className="zeas-envato-hero-left">
          {currentSlide.badge && (
            <div className="zeas-envato-hero-badge">
              <HiSparkles className="badge-sparkle" size={14} />
              <span>{currentSlide.badge}</span>
            </div>
          )}

          <h2 className="zeas-envato-hero-title">
            {currentSlide.highlightText && currentSlide.title.includes(currentSlide.highlightText) ? (
              <>
                {currentSlide.title.split(currentSlide.highlightText)[0]}
                <span className="zeas-envato-gradient-text">{currentSlide.highlightText}</span>
                {currentSlide.title.split(currentSlide.highlightText)[1]}
              </>
            ) : (
              currentSlide.title || "Discover Kerala's Best Businesses"
            )}
          </h2>

          <p className="zeas-envato-hero-desc">
            {currentSlide.subtitle || currentSlide.description ||
              "Find verified local merchants, exclusive deals, contact details, and top services across all 14 districts."}
          </p>

          {/* Quick Filter Tag Pills (Matching Envato Reference Screenshot 4) */}
          {Array.isArray(currentSlide.tags) && currentSlide.tags.length > 0 && (
            <div className="zeas-envato-tag-pills">
              {currentSlide.tags.map((tag, tIdx) => (
                <button
                  key={tIdx}
                  type="button"
                  className="zeas-envato-pill-btn"
                  onClick={() => {
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
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="zeas-envato-hero-actions">
            <button
              type="button"
              className="zeas-envato-cta-btn"
              onClick={handleAction}
            >
              <span>{currentSlide.ctaText || 'Explore Kerala Shops'}</span>
              <HiArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Side: High-Definition Video or Ambient Visual with Seamless Gradient Shade */}
        <div className="zeas-envato-hero-right">
          {/* Smooth gradient shadow overlay for seamless join (shade ayit nikkanam) */}
          <div className="zeas-envato-shade-overlay" />

          {isVideo && videoUrl ? (
            <div className="zeas-envato-media-wrap">
              <video
                ref={videoRef}
                key={`envato-vid-${current}-${videoUrl}`}
                src={videoUrl}
                autoPlay
                muted
                playsInline
                poster={imgUrl || ''}
                className="zeas-envato-video-player"
                onEnded={() => {
                  if (validSlides.length > 1) {
                    next();
                  } else {
                    const v = videoRef.current;
                    if (v) {
                      v.currentTime = 0;
                      v.play().catch(() => {});
                    }
                  }
                }}
                onError={() => {
                  setTimeout(next, 3000);
                }}
              />
              <div className="zeas-envato-media-indicator">
                <HiPlay size={12} />
                <span>HD Live Reel</span>
              </div>
            </div>
          ) : (
            <div className="zeas-envato-media-wrap">
              <img
                src={imgUrl}
                alt={currentSlide.title || 'Kerala Showcase'}
                className="zeas-envato-media-img"
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Controls: Prev / Next subtle buttons */}
      {validSlides.length > 1 && (
        <>
          <button
            type="button"
            className="zeas-envato-nav-arrow prev"
            onClick={prev}
            aria-label="Previous Slide"
          >
            <HiChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="zeas-envato-nav-arrow next"
            onClick={next}
            aria-label="Next Slide"
          >
            <HiChevronRight size={20} />
          </button>

          {/* Indicator Dot Bars */}
          <div className="zeas-envato-indicators">
            {validSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`zeas-envato-dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
