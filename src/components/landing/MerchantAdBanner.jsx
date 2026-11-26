import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  HiChevronLeft,
  HiChevronRight,
  HiExternalLink,
  HiOutlineSpeakerphone,
  HiOutlineVideoCamera,
} from 'react-icons/hi';
import { fetchMerchantPromotions } from '../../api/promotionApi';
import { formatMediaUrl } from '../../api/merchantApi';
import { useSliderInterval } from '../../utils/useSliderInterval';

function toYoutubeEmbed(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null;
}

const EMPTY_ADS = [];

export default function MerchantAdBanner({ merchantId, merchantName = '', initialAds = EMPTY_ADS }) {
  const [ads, setAds] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const autoSlideMs = useSliderInterval(4, 'merchant_store');

  const swipeStartX = useRef(null);
  const videoRefs = useRef({});

  const initialAdsKey = useMemo(() => {
    if (!Array.isArray(initialAds) || initialAds.length === 0) return '';
    return initialAds
      .map((a) => `${a?.id || ''}|${a?.title || ''}|${a?.image_url || ''}|${a?.video_url || ''}|${a?.status || ''}`)
      .join('||');
  }, [initialAds]);

  useEffect(() => {
    setActiveIdx(0);
  }, [merchantId]);

  useEffect(() => {
    let cancelled = false;
    const baseAds = (Array.isArray(initialAds) ? initialAds : EMPTY_ADS).map((ad) => ({
      ...ad,
      target_url: ad.target_url || ad.link_url || null,
      media_type: ad.media_type || (ad.video_url ? 'video' : ad.image_url ? 'image' : 'text'),
    }));

    if (!merchantId || Number.isNaN(Number(merchantId))) {
      setAds(baseAds);
      return undefined;
    }

    fetchMerchantPromotions(merchantId, { status: 'active', placement: 'Merchant Store' })
      .then((list) => {
        if (cancelled) return;
        const clean = (Array.isArray(list) ? list : []).filter((ad) => {
          const st = String(ad.status || 'active').toLowerCase();
          return st === 'active' || st === 'approved';
        });
        const seen = new Set(clean.map((x) => `${x.title}|${x.image_url || ''}|${x.video_url || ''}`));
        const merged = [...clean];
        baseAds.forEach((b) => {
          const st = String(b.status || 'active').toLowerCase();
          const key = `${b.title}|${b.image_url || ''}|${b.video_url || ''}`;
          if ((st === 'active' || st === 'approved') && !seen.has(key)) {
            merged.push(b);
          }
        });
        setAds(merged);
        setActiveIdx((prev) => (merged.length > 0 ? prev % merged.length : 0));
      })
      .catch(() => {
        if (!cancelled) setAds(baseAds);
      });

    return () => {
      cancelled = true;
    };
  }, [merchantId, initialAdsKey]);

  const safeIdx = ads.length > 0 ? activeIdx % ads.length : 0;
  const activeAd = ads[safeIdx] || null;
  const activeType = activeAd
    ? String(
        activeAd.media_type || (activeAd.video_url ? 'video' : activeAd.image_url ? 'image' : 'text')
      ).toLowerCase()
    : 'image';

  // Auto-scroll reliably across all ads at the configured backend speed (paused only while user plays a video)
  useEffect(() => {
    if (ads.length <= 1 || isVideoPlaying) return undefined;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % ads.length);
    }, autoSlideMs);
    return () => clearInterval(timer);
  }, [ads.length, isVideoPlaying, autoSlideMs]);

  // Pause background HTML5 videos & reset videoPlaying flag when slide changes
  useEffect(() => {
    setIsVideoPlaying(false);
    Object.entries(videoRefs.current).forEach(([idxStr, el]) => {
      if (!el) return;
      if (Number(idxStr) !== safeIdx && typeof el.pause === 'function') {
        try {
          el.pause();
        } catch (_) {}
      }
    });
  }, [safeIdx]);

  if (!ads || ads.length === 0) return null;

  const goPrev = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveIdx((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const goNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveIdx((prev) => (prev + 1) % ads.length);
  };

  const handleTouchStart = (e) => {
    swipeStartX.current = e.touches?.[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e) => {
    if (swipeStartX.current === null || ads.length <= 1) return;
    const endX = e.changedTouches?.[0]?.clientX ?? swipeStartX.current;
    const diff = swipeStartX.current - endX;
    swipeStartX.current = null;
    if (Math.abs(diff) > 35) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const handleMouseDown = (e) => {
    // Only track primary mouse button drags outside interactive video/link controls
    if (e.button !== 0) return;
    swipeStartX.current = e.clientX;
  };

  const handleMouseUp = (e) => {
    if (swipeStartX.current === null || ads.length <= 1) return;
    const diff = swipeStartX.current - e.clientX;
    swipeStartX.current = null;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  return (
    <div
      onMouseLeave={() => {
        swipeStartX.current = null;
      }}
      style={{
        margin: '18px 0 22px',
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
        background: '#ffffff',
        userSelect: 'none',
      }}
    >
      {/* Top Left Badge */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 25,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 999,
          background: 'rgba(15, 23, 42, 0.76)',
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.03em',
          backdropFilter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      >
        <HiOutlineSpeakerphone size={13} />
        <span>Featured Ad{merchantName ? ` • ${merchantName}` : ''}</span>
      </div>

      {/* Top Right Slide Counter */}
      {ads.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 25,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(15, 23, 42, 0.76)',
            color: '#ffffff',
            fontSize: 11.5,
            fontWeight: 800,
            pointerEvents: 'none',
          }}
        >
          {safeIdx + 1} / {ads.length}
        </div>
      )}

      {/* Left / Right Floating Navigation Arrows */}
      {ads.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Previous ad"
            style={{
              position: 'absolute',
              left: 10,
              top: '44%',
              transform: 'translateY(-50%)',
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'rgba(15, 23, 42, 0.72)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 30,
              boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
            }}
          >
            <HiChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={goNext}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Next ad"
            style={{
              position: 'absolute',
              right: 10,
              top: '44%',
              transform: 'translateY(-50%)',
              width: 38,
              height: 38,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'rgba(15, 23, 42, 0.72)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 30,
              boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
            }}
          >
            <HiChevronRight size={22} />
          </button>
        </>
      )}

      {/* Horizontal Sliding Viewport + Track */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{
          overflow: 'hidden',
          width: '100%',
          touchAction: 'pan-y',
          cursor: ads.length > 1 ? 'grab' : 'default',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            transform: `translate3d(-${safeIdx * 100}%, 0, 0)`,
            transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
            alignItems: 'stretch',
          }}
        >
          {ads.map((ad, idx) => {
            const mediaType = String(
              ad.media_type || (ad.video_url ? 'video' : ad.image_url ? 'image' : 'text')
            ).toLowerCase();
            const imgSrc = ad.image_url ? formatMediaUrl(ad.image_url) : '';
            const vidSrc = ad.video_url ? formatMediaUrl(ad.video_url) : '';
            const ytEmbed = toYoutubeEmbed(ad.video_url || '');
            const bgStyle =
              ad.bg_color || 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)';
            const txtColor = ad.text_color || '#ffffff';
            const targetHref = ad.target_url && ad.target_url !== '#' ? ad.target_url : null;

            return (
              <div
                key={ad.id || `${idx}-${ad.title}`}
                style={{
                  minWidth: '100%',
                  width: '100%',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {/* TEXT WITH BACKGROUND AD */}
                {mediaType === 'text' && (
                  <div
                    style={{
                      background: bgStyle,
                      color: txtColor,
                      padding: '50px 54px 30px',
                      minHeight: 220,
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 'clamp(20px, 3vw, 28px)',
                        fontWeight: 900,
                        lineHeight: 1.25,
                        color: txtColor,
                      }}
                    >
                      {ad.title}
                    </h3>
                    {ad.description && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14.5,
                          lineHeight: 1.55,
                          color: txtColor,
                          opacity: 0.95,
                          maxWidth: 740,
                        }}
                      >
                        {ad.description}
                      </p>
                    )}
                    {targetHref && (
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={targetHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          draggable={false}
                          onMouseDown={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 999,
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: 12.5,
                            fontWeight: 800,
                            textDecoration: 'none',
                          }}
                        >
                          <span>View Offer</span>
                          <HiExternalLink size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* VIDEO AD */}
                {mediaType === 'video' && (
                  <div style={{ background: '#0f172a', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {ytEmbed ? (
                      <iframe
                        title={ad.title || 'Merchant Advertisement Video'}
                        src={ytEmbed}
                        style={{
                          width: '100%',
                          height: 'clamp(240px, 36vw, 380px)',
                          border: 'none',
                          display: 'block',
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : vidSrc ? (
                      <video
                        ref={(el) => {
                          videoRefs.current[idx] = el;
                        }}
                        src={vidSrc}
                        controls
                        muted
                        loop={false}
                        playsInline
                        preload="metadata"
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                        onEnded={() => {
                          setIsVideoPlaying(false);
                          if (ads.length > 1) {
                            setActiveIdx((prev) => (prev + 1) % ads.length);
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          height: 'clamp(240px, 36vw, 380px)',
                          objectFit: 'contain',
                          display: 'block',
                          background: '#000000',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: 220,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#cbd5e1',
                          gap: 8,
                        }}
                      >
                        <HiOutlineVideoCamera size={24} />
                        <span>Video unavailable</span>
                      </div>
                    )}
                    {(ad.title || ad.description || targetHref) && (
                      <div
                        style={{
                          padding: '12px 18px',
                          background: '#ffffff',
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{ad.title}</div>
                          {ad.description && (
                            <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{ad.description}</div>
                          )}
                        </div>
                        {targetHref && (
                          <a
                            href={targetHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '7px 14px',
                              borderRadius: 10,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontSize: 12.5,
                              fontWeight: 800,
                              textDecoration: 'none',
                            }}
                          >
                            <span>Visit Link</span>
                            <HiExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* IMAGE AD */}
                {mediaType !== 'text' && mediaType !== 'video' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {imgSrc && (
                      <img
                        src={imgSrc}
                        alt={ad.title || 'Merchant Advertisement'}
                        draggable={false}
                        style={{
                          width: '100%',
                          height: 'clamp(220px, 36vw, 360px)',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    )}
                    {(ad.title || ad.description || targetHref) && (
                      <div
                        style={{
                          padding: '12px 18px',
                          background: '#ffffff',
                          borderTop: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{ad.title}</div>
                          {ad.description && (
                            <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{ad.description}</div>
                          )}
                        </div>
                        {targetHref && (
                          <a
                            href={targetHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '7px 14px',
                              borderRadius: 10,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontSize: 12.5,
                              fontWeight: 800,
                              textDecoration: 'none',
                            }}
                          >
                            <span>Explore</span>
                            <HiExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Slide Switcher Bar (Always Clickable Dots + Prev/Next) */}
      {ads.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '8px 14px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={goPrev}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <HiChevronLeft size={15} />
            <span>Prev</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {ads.map((adItem, dotIdx) => {
              const isCurr = dotIdx === safeIdx;
              const isVidDot = String(adItem.media_type || (adItem.video_url ? 'video' : '')).toLowerCase() === 'video';
              return (
                <button
                  key={adItem.id || dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIdx(dotIdx);
                  }}
                  title={adItem.title || `Ad ${dotIdx + 1}`}
                  style={{
                    height: 10,
                    width: isCurr ? 26 : 10,
                    borderRadius: 999,
                    border: 'none',
                    padding: 0,
                    background: isCurr ? '#2563eb' : isVidDot ? '#94a3b8' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={goNext}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>Next</span>
            <HiChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
