import React, { useEffect, useState } from 'react';
import { HiChevronLeft, HiChevronRight, HiExternalLink, HiOutlineSpeakerphone } from 'react-icons/hi';
import { fetchMerchantPromotions } from '../../api/promotionApi';
import { formatMediaUrl } from '../../api/merchantApi';

function toYoutubeEmbed(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : null;
}

export default function MerchantAdBanner({ merchantId, merchantName = '', initialAds = [] }) {
  const [ads, setAds] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const baseAds = (Array.isArray(initialAds) ? initialAds : []).map((ad) => ({
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
        const seenTitles = new Set(clean.map((x) => `${x.title}|${x.image_url || ''}|${x.video_url || ''}`));
        const merged = [...clean];
        baseAds.forEach((b) => {
          const st = String(b.status || 'active').toLowerCase();
          const key = `${b.title}|${b.image_url || ''}|${b.video_url || ''}`;
          if ((st === 'active' || st === 'approved') && !seenTitles.has(key)) {
            merged.push(b);
          }
        });
        setAds(merged);
        setActiveIdx(0);
      })
      .catch(() => {
        if (!cancelled) setAds(baseAds);
      });
    return () => {
      cancelled = true;
    };
  }, [merchantId, initialAds]);

  if (!ads || ads.length === 0) return null;

  const currentAd = ads[activeIdx] || ads[0];
  const mediaType = String(
    currentAd.media_type || (currentAd.video_url ? 'video' : currentAd.image_url ? 'image' : 'text')
  ).toLowerCase();

  const imgSrc = currentAd.image_url ? formatMediaUrl(currentAd.image_url) : '';
  const vidSrc = currentAd.video_url ? formatMediaUrl(currentAd.video_url) : '';
  const ytEmbed = toYoutubeEmbed(currentAd.video_url || '');
  const bgStyle =
    currentAd.bg_color || 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)';
  const txtColor = currentAd.text_color || '#ffffff';
  const targetHref =
    currentAd.target_url && currentAd.target_url !== '#' ? currentAd.target_url : null;

  return (
    <div
      style={{
        margin: '0 0 20px',
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
        background: '#ffffff',
      }}
    >
      {/* Subtle Top Tag */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 999,
          background: 'rgba(15, 23, 42, 0.72)',
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.03em',
          backdropFilter: 'blur(6px)',
        }}
      >
        <HiOutlineSpeakerphone size={13} />
        <span>Featured Ad{merchantName ? ` • ${merchantName}` : ''}</span>
      </div>

      {/* TEXT WITH BACKGROUND AD */}
      {mediaType === 'text' && (
        <div
          style={{
            background: bgStyle,
            color: txtColor,
            padding: '44px 26px 28px',
            minHeight: 150,
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
              lineHeight: 1.2,
              color: txtColor,
            }}
          >
            {currentAd.title}
          </h3>
          {currentAd.description && (
            <p
              style={{
                margin: 0,
                fontSize: 14.5,
                lineHeight: 1.55,
                color: txtColor,
                opacity: 0.94,
                maxWidth: 740,
              }}
            >
              {currentAd.description}
            </p>
          )}
          {targetHref && (
            <div style={{ marginTop: 6 }}>
              <a
                href={targetHref}
                target="_blank"
                rel="noopener noreferrer"
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
        <div style={{ background: '#0f172a' }}>
          {ytEmbed ? (
            <iframe
              title={currentAd.title || 'Merchant Advertisement Video'}
              src={ytEmbed}
              style={{ width: '100%', height: 'clamp(220px, 36vw, 380px)', border: 'none', display: 'block' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : vidSrc ? (
            <video
              key={vidSrc}
              src={vidSrc}
              controls
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: '100%',
                maxHeight: 400,
                objectFit: 'cover',
                display: 'block',
                background: '#000',
              }}
            />
          ) : null}
          {(currentAd.title || currentAd.description) && (
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
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{currentAd.title}</div>
                {currentAd.description && (
                  <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{currentAd.description}</div>
                )}
              </div>
              {targetHref && (
                <a
                  href={targetHref}
                  target="_blank"
                  rel="noopener noreferrer"
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
        <div>
          {imgSrc && (
            <a
              href={targetHref || undefined}
              target={targetHref ? '_blank' : undefined}
              rel={targetHref ? 'noopener noreferrer' : undefined}
              style={{ display: 'block' }}
            >
              <img
                src={imgSrc}
                alt={currentAd.title || 'Merchant Advertisement'}
                style={{
                  width: '100%',
                  maxHeight: 360,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </a>
          )}
          {(currentAd.title || currentAd.description || targetHref) && (
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
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{currentAd.title}</div>
                {currentAd.description && (
                  <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{currentAd.description}</div>
                )}
              </div>
              {targetHref && (
                <a
                  href={targetHref}
                  target="_blank"
                  rel="noopener noreferrer"
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

      {/* Multiple Ads Controls */}
      {ads.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setActiveIdx((prev) => (prev - 1 + ads.length) % ads.length)}
            aria-label="Previous ad"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(15, 23, 42, 0.62)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 5,
            }}
          >
            <HiChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => setActiveIdx((prev) => (prev + 1) % ads.length)}
            aria-label="Next ad"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(15, 23, 42, 0.62)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 5,
            }}
          >
            <HiChevronRight size={20} />
          </button>
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 5,
              padding: '3px 9px',
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.68)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {activeIdx + 1} / {ads.length}
          </div>
        </>
      )}
    </div>
  );
}
