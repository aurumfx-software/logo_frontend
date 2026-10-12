import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  HiX,
  HiCheck,
  HiOutlinePhotograph,
  HiOutlineRefresh,
  HiZoomIn,
  HiZoomOut,
  HiInformationCircle,
} from 'react-icons/hi';

export const PLACEMENT_SPECS = {
  'Home Top': {
    label: 'Home Top Banner',
    ratio: 16 / 5,
    ratioLabel: '16:5 (Panoramic Top Banner)',
    idealWidth: 1920,
    idealHeight: 600,
    minWidth: 1200,
    minHeight: 375,
    description: 'Full-width top slider banner shown at the very top of the landing page.',
    tips: 'Recommended size: 1920 × 600 px. Full-width uncropped view. Leave 20px safe margin from edges for logos/text.',
    videoSpecs: '16:9 (1920×1080 px) or 16:5 (1920×600 px), MP4/WebM, Max 50MB',
  },
  'Home Middle': {
    label: 'Home Middle Ad Showcase',
    ratio: 16 / 9,
    ratioLabel: '16:9 / Full View (Uncropped Showcase)',
    idealWidth: 1280,
    idealHeight: 720,
    minWidth: 800,
    minHeight: 450,
    description: 'In-between split showcase banner (Left full-view visual with ambient shade, Right title, description & CTA).',
    tips: 'Full-view uncropped display with depth shade. Recommended size: 1280 × 720 px (16:9) or 1080 × 1080 px.',
    videoSpecs: '16:9 Full HD 1920×1080 px or 1280×720 px, MP4/WebM, Max 50MB',
  },
  'Above Footer': {
    label: 'Above Footer Showcase',
    ratio: 16 / 9,
    ratioLabel: '16:9 (Widescreen Showcase)',
    idealWidth: 1920,
    idealHeight: 1080,
    minWidth: 1280,
    minHeight: 720,
    description: 'High-impact split layout showcase banner and video placed immediately above the footer.',
    tips: 'Recommended size: 1920 × 1080 px (16:9 Full HD). High resolution images and video clips.',
    videoSpecs: '16:9 Full HD 1920×1080 px, 30/60 fps, MP4/WebM, Max 60MB',
  },
  'Featured Offers': {
    label: 'Featured Offers Card',
    ratio: 3 / 2,
    ratioLabel: '3:2 (Deals Card)',
    idealWidth: 600,
    idealHeight: 400,
    minWidth: 450,
    minHeight: 300,
    description: 'Deals & discount cards displayed inside the auto-scrolling special offers carousel.',
    tips: 'Recommended size: 600 × 400 px. Card format with clear discount or product focus.',
    videoSpecs: 'Card format 600×400 px or 1:1 Square, Max 25MB',
  },
  'Special Offer': {
    label: 'Special Deals Widget',
    ratio: 4 / 3,
    ratioLabel: '4:3 (Floating Widget)',
    idealWidth: 600,
    idealHeight: 450,
    minWidth: 400,
    minHeight: 300,
    description: 'High-conversion floating deals popup card on the bottom-right of the screen.',
    tips: 'Recommended size: 600 × 450 px or 500 × 500 px. Punchy, eye-catching visual.',
    videoSpecs: 'Short highlight clip, Max 20MB',
  },
  'Square Poster': {
    label: 'Square Festival Poster',
    ratio: 1 / 1,
    ratioLabel: '1:1 (Square Poster)',
    idealWidth: 1080,
    idealHeight: 1080,
    minWidth: 800,
    minHeight: 800,
    description: 'Traditional square flyer or festival graphic poster.',
    tips: 'Recommended size: 1080 × 1080 px. Displays with ambient letterbox backdrop on widescreen.',
    videoSpecs: 'Square MP4 video (1080×1080 px), Max 40MB',
  },
};

export default function PromotionImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  placement = 'Home Top',
  onCropSave,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const initialSpec = PLACEMENT_SPECS[placement] || PLACEMENT_SPECS['Home Top'];
  const [selectedRatioKey, setSelectedRatioKey] = useState(
    placement in PLACEMENT_SPECS ? placement : 'Home Top'
  );
  const [selectedRatio, setSelectedRatio] = useState(initialSpec.ratio);

  const [imgObj, setImgObj] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync placement on open
  useEffect(() => {
    if (isOpen) {
      const spec = PLACEMENT_SPECS[placement] || PLACEMENT_SPECS['Home Top'];
      setSelectedRatioKey(placement in PLACEMENT_SPECS ? placement : 'Home Top');
      setSelectedRatio(spec.ratio);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    }
  }, [isOpen, placement]);

  // Load image object
  useEffect(() => {
    if (!imageSrc || !isOpen) return;

    let isCancelled = false;
    let localBlobUrl = null;

    const loadImage = async () => {
      try {
        // 1. Strip any URL fragment/hash like #pos=...
        const cleanUrl = imageSrc.split('#')[0];

        // 2. Rewrite DO Spaces CDN url to Vite proxy endpoint if running locally
        const isDOSpaces = /^https?:\/\/aurumfx-images\.sgp1\.digitaloceanspaces\.com\//i.test(cleanUrl);
        const resolvedUrl = isDOSpaces
          ? cleanUrl.replace(/^https?:\/\/aurumfx-images\.sgp1\.digitaloceanspaces\.com\//i, '/proxy-media/')
          : cleanUrl;

        // 3. If it's already a blob or data URI, load directly
        if (resolvedUrl.startsWith('blob:') || resolvedUrl.startsWith('data:')) {
          const img = new Image();
          img.onload = () => {
            if (!isCancelled) {
              setImgObj(img);
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }
          };
          img.src = resolvedUrl;
          return;
        }

        // 4. For remote or proxied URLs, fetch as blob to guarantee CORS compliance
        try {
          const fetchUrl = (resolvedUrl.startsWith('http') || resolvedUrl.startsWith('/proxy'))
            ? (resolvedUrl.includes('?') ? `${resolvedUrl}&cors_ts=${Date.now()}` : `${resolvedUrl}?cors_ts=${Date.now()}`)
            : resolvedUrl;
          const resp = await fetch(fetchUrl);
          if (resp.ok) {
            const blob = await resp.blob();
            localBlobUrl = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
              if (!isCancelled) {
                setImgObj(img);
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }
            };
            img.src = localBlobUrl;
            return;
          }
        } catch (fetchErr) {
          console.warn('Direct blob fetch failed, falling back to Image with anonymous CORS:', fetchErr);
        }

        // 5. Fallback with crossOrigin = 'anonymous' and cache buster
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const cacheBusted = resolvedUrl.includes('?') ? `${resolvedUrl}&_cb=${Date.now()}` : `${resolvedUrl}?_cb=${Date.now()}`;
        img.onload = () => {
          if (!isCancelled) {
            setImgObj(img);
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }
        };
        img.onerror = () => {
          console.warn('Anonymous CORS failed, trying direct src');
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            if (!isCancelled) {
              setImgObj(fallbackImg);
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }
          };
          fallbackImg.src = resolvedUrl;
        };
        img.src = cacheBusted;
      } catch (err) {
        console.error('Failed to load image in cropper:', err);
      }
    };

    loadImage();

    return () => {
      isCancelled = true;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [imageSrc, isOpen]);

  // Draw crop preview canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgObj) return;

    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    if (!container) return;

    const cw = container.clientWidth || 560;
    const ch = Math.min(420, Math.max(260, window.innerHeight * 0.45));

    canvas.width = cw;
    canvas.height = ch;

    // Background workspace
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cw, ch);

    // Compute crop box inside canvas
    const margin = 24;
    const maxBoxW = cw - margin * 2;
    const maxBoxH = ch - margin * 2;

    let boxW = maxBoxW;
    let boxH = maxBoxW / (selectedRatio || 16 / 5);

    if (boxH > maxBoxH) {
      boxH = maxBoxH;
      boxW = maxBoxH * (selectedRatio || 16 / 5);
    }

    const boxX = (cw - boxW) / 2;
    const boxY = (ch - boxH) / 2;

    // Draw image transformed
    ctx.save();
    // Clip image rendering inside canvas workspace
    ctx.beginPath();
    ctx.rect(0, 0, cw, ch);
    ctx.clip();

    // Transform center to canvas center + pan
    ctx.translate(cw / 2 + pan.x, ch / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);

    // Scale image
    // Compute base scale so image covers crop box
    const imgAspect = imgObj.width / imgObj.height;
    const boxAspect = boxW / boxH;

    let baseScale;
    if (rotation === 90 || rotation === 270) {
      baseScale = imgAspect > 1 / boxAspect ? boxH / imgObj.width : boxW / imgObj.height;
    } else {
      baseScale = imgAspect > boxAspect ? boxH / imgObj.height : boxW / imgObj.width;
    }

    const currentScale = baseScale * zoom;
    const drawW = imgObj.width * currentScale;
    const drawH = imgObj.height * currentScale;

    ctx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Darkened Dim Mask outside crop box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    // Top
    ctx.fillRect(0, 0, cw, boxY);
    // Bottom
    ctx.fillRect(0, boxY + boxH, cw, ch - (boxY + boxH));
    // Left
    ctx.fillRect(0, boxY, boxX, boxH);
    // Right
    ctx.fillRect(boxX + boxW, boxY, cw - (boxX + boxW), boxH);

    // Crop box outline
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Rule of Thirds Guidelines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    // Vertical thirds
    ctx.moveTo(boxX + boxW / 3, boxY);
    ctx.lineTo(boxX + boxW / 3, boxY + boxH);
    ctx.moveTo(boxX + (boxW * 2) / 3, boxY);
    ctx.lineTo(boxX + (boxW * 2) / 3, boxY + boxH);
    // Horizontal thirds
    ctx.moveTo(boxX, boxY + boxH / 3);
    ctx.lineTo(boxX + boxW, boxY + boxH / 3);
    ctx.moveTo(boxX, boxY + (boxH * 2) / 3);
    ctx.lineTo(boxX + boxW, boxY + (boxH * 2) / 3);
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner Accents
    const cornerSize = 16;
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(boxX, boxY + cornerSize);
    ctx.lineTo(boxX, boxY);
    ctx.lineTo(boxX + cornerSize, boxY);
    // Top-right
    ctx.moveTo(boxX + boxW - cornerSize, boxY);
    ctx.lineTo(boxX + boxW, boxY);
    ctx.lineTo(boxX + boxW, boxY + cornerSize);
    // Bottom-left
    ctx.moveTo(boxX, boxY + boxH - cornerSize);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.lineTo(boxX + cornerSize, boxY + boxH);
    // Bottom-right
    ctx.moveTo(boxX + boxW - cornerSize, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH - cornerSize);
    ctx.stroke();
  }, [imgObj, selectedRatio, zoom, pan, rotation]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse & Touch Pan Handling
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (!e.touches[0]) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX - pan.x,
      y: e.touches[0].clientY - pan.y,
    };
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !e.touches[0]) return;
    setPan({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  // Perform Final High-Resolution Crop Export
  const handleApplyCrop = async () => {
    if (!imgObj) return;

    try {
      setIsProcessing(true);

      const spec = PLACEMENT_SPECS[selectedRatioKey] || PLACEMENT_SPECS['Home Top'];
      const targetW = spec.idealWidth || 1920;
      const targetH = spec.idealHeight || Math.round(targetW / selectedRatio);

      const offCanvas = document.createElement('canvas');
      offCanvas.width = targetW;
      offCanvas.height = targetH;
      const offCtx = offCanvas.getContext('2d');

      // Fill background for any transparent edge
      offCtx.fillStyle = '#0f172a';
      offCtx.fillRect(0, 0, targetW, targetH);
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';

      // Compute matching transform on target canvas
      const container = containerRef.current;
      const cw = container?.clientWidth || 560;
      const ch = Math.min(420, Math.max(260, window.innerHeight * 0.45));

      const margin = 24;
      const maxBoxW = cw - margin * 2;
      const maxBoxH = ch - margin * 2;

      let boxW = maxBoxW;
      let boxH = maxBoxW / selectedRatio;
      if (boxH > maxBoxH) {
        boxH = maxBoxH;
        boxW = maxBoxH * selectedRatio;
      }

      // Scaling factor from preview box to final high-res canvas
      const scaleToOutput = targetW / boxW;

      offCtx.save();
      offCtx.translate(targetW / 2 + pan.x * scaleToOutput, targetH / 2 + pan.y * scaleToOutput);
      offCtx.rotate((rotation * Math.PI) / 180);

      const imgAspect = imgObj.width / imgObj.height;
      const boxAspect = boxW / boxH;

      let baseScale;
      if (rotation === 90 || rotation === 270) {
        baseScale = imgAspect > 1 / boxAspect ? boxH / imgObj.width : boxW / imgObj.height;
      } else {
        baseScale = imgAspect > boxAspect ? boxH / imgObj.height : boxW / imgObj.width;
      }

      const currentScale = baseScale * zoom * scaleToOutput;
      const drawW = imgObj.width * currentScale;
      const drawH = imgObj.height * currentScale;

      offCtx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);
      offCtx.restore();

      // Convert to high-quality JPEG Blob
      offCanvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (blob) {
            const previewUrl = URL.createObjectURL(blob);
            // Name file appropriately
            const croppedFile = new File(
              [blob],
              `cropped_${selectedRatioKey.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`,
              { type: 'image/jpeg' }
            );
            if (onCropSave) {
              onCropSave(croppedFile, previewUrl);
            }
            onClose();
          } else {
            alert('Failed to generate cropped image. Please retry.');
          }
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Crop export failed:', err);
      setIsProcessing(false);
      alert('Error during image crop: ' + err.message);
    }
  };

  if (!isOpen) return null;

  const currentSpec = PLACEMENT_SPECS[selectedRatioKey] || PLACEMENT_SPECS['Home Top'];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 720,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>✂️</span>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Crop Ad Image for Proper Fit View
              </h3>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
              Crop and adjust your ad image to match the exact placement aspect ratio for zero edge cuts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: 34,
              height: 34,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
            }}
          >
            <HiX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Sizing Description Card */}
          <div
            style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <HiInformationCircle size={22} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 800, color: '#1e40af', marginBottom: 2 }}>
                {currentSpec.label} — Optimal Fit: {currentSpec.idealWidth} × {currentSpec.idealHeight} px (
                {currentSpec.ratioLabel})
              </div>
              <div>{currentSpec.tips}</div>
              <div style={{ fontSize: 11.5, color: '#3b82f6', marginTop: 4 }}>
                <strong>Video Specification:</strong> {currentSpec.videoSpecs}
              </div>
            </div>
          </div>

          {/* Aspect Ratio Preset Selector Pills */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11.5,
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Select Placement Aspect Ratio:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(PLACEMENT_SPECS).map(([key, spec]) => {
                const isActive = selectedRatioKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedRatioKey(key);
                      setSelectedRatio(spec.ratio);
                      setPan({ x: 0, y: 0 });
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      border: isActive ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: isActive ? '#eff6ff' : '#f8fafc',
                      color: isActive ? '#2563eb' : '#334155',
                      fontSize: 12,
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{spec.label}</span>
                    <span
                      style={{
                        fontSize: 10,
                        background: isActive ? '#2563eb' : '#e2e8f0',
                        color: isActive ? '#ffffff' : '#475569',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {spec.idealWidth}×{spec.idealHeight}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Canvas Workspace */}
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              background: '#0f172a',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />

            {/* Drag helper hint */}
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 12,
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 6,
                backdropFilter: 'blur(4px)',
                pointerEvents: 'none',
              }}
            >
              ✋ Drag image to reposition within crop box
            </div>

            {/* Target output resolution indicator badge */}
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                right: 12,
                background: 'rgba(37, 99, 235, 0.9)',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 6,
                pointerEvents: 'none',
              }}
            >
              Output: {currentSpec.idealWidth} × {currentSpec.idealHeight} px
            </div>
          </div>

          {/* Cropper Toolbar (Zoom, Rotate, Reset) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 14,
              padding: '10px 14px',
              background: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Zoom Slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220 }}>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.15).toFixed(2)))}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Zoom Out"
              >
                <HiZoomOut size={16} color="#475569" />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ flex: 1, cursor: 'pointer' }}
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.15).toFixed(2)))}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Zoom In"
              >
                <HiZoomIn size={16} color="#475569" />
              </button>

              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', minWidth: 42 }}>
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotate & Reset Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>⟳ Rotate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  setRotation(0);
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>↺ Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            background: '#ffffff',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              background: '#f1f5f9',
              border: 'none',
              color: '#475569',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing || !imgObj}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: isProcessing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            }}
          >
            <HiCheck size={18} />
            <span>{isProcessing ? 'Processing Crop...' : 'Apply & Save Crop'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
