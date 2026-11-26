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
import PhoneCropRatioBar, {
  PHONE_CROP_PRESETS,
  getFixedCropBox,
  hitTestCropHandle,
  resizeFreeCropBox,
  drawCropBoxOverlay,
} from './PhoneCropRatioBar';

export const PLACEMENT_SPECS = {
  Free: {
    label: 'Free Size Crop',
    ratio: null,
    ratioLabel: 'Freeform Custom Aspect',
    idealWidth: 1600,
    idealHeight: 900,
    minWidth: 300,
    minHeight: 300,
    description: 'Drag corners or edges freely to crop any custom size and aspect ratio.',
    tips: 'Drag the 8 corner/edge handles to adjust crop area, or drag inside to move the image.',
    videoSpecs: 'Custom Freeform Crop (MP4/WebM)',
  },
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
  'Business Network': {
    label: 'Business Network Poster',
    ratio: 3 / 4,
    ratioLabel: '3:4 / 1:1 (Poster Card)',
    idealWidth: 900,
    idealHeight: 1200,
    minWidth: 450,
    minHeight: 600,
    description: 'Poster card shown in the LOGO Business Network News & Updates multi-card slider and listed on All Ads page.',
    tips: 'Recommended size: 900 × 1200 px (3:4) or 1080 × 1080 px (1:1 Square).',
    videoSpecs: 'Poster or Square format MP4/WebM, Max 30MB',
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
  'Merchant Store': {
    label: 'Merchant Store Advertisement',
    ratio: 16 / 9,
    ratioLabel: '16:9 (Merchant Store Banner)',
    idealWidth: 1280,
    idealHeight: 720,
    minWidth: 800,
    minHeight: 450,
    description: 'Store advertisement displayed directly above Location on the merchant store details page.',
    tips: 'Recommended size: 1280 × 720 px (16:9) or 1080 × 1080 px (1:1). Crop and zoom for a crisp storefront banner.',
    videoSpecs: '16:9 MP4/WebM video (1280×720 px), Max 50MB',
  },
};

function presetKeyForPlacement(placement) {
  if (placement === 'Free') return 'Free';
  const found = PHONE_CROP_PRESETS.find((p) => p.specKey === placement);
  if (found) return found.key;
  if (placement === 'Above Footer' || placement === 'Home Middle' || placement === 'Merchant Store') return '16:9';
  return 'Free';
}

export default function PromotionImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  placement = 'Free',
  onCropSave,
  onUseOriginal,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [activePresetKey, setActivePresetKey] = useState(() => presetKeyForPlacement(placement));
  const [selectedRatioKey, setSelectedRatioKey] = useState(
    placement in PLACEMENT_SPECS ? placement : 'Free'
  );
  const [selectedRatio, setSelectedRatio] = useState(
    (PLACEMENT_SPECS[placement] || PLACEMENT_SPECS.Free).ratio
  );

  const [imgObj, setImgObj] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [freeBox, setFreeBox] = useState(null);
  const [hoverCursor, setHoverCursor] = useState('grab');
  const [isDragging, setIsDragging] = useState(false);
  const dragModeRef = useRef({ type: 'pan', x: 0, y: 0, origBox: null, handle: null });
  const [isProcessing, setIsProcessing] = useState(false);

  const getWorkspaceSize = useCallback(() => {
    const container = containerRef.current;
    const cw = container?.clientWidth || 560;
    const ch = Math.min(400, Math.max(250, Math.round(window.innerHeight * 0.44)));
    return { cw, ch };
  }, []);

  // Sync placement on open
  useEffect(() => {
    if (isOpen) {
      const pKey = presetKeyForPlacement(placement);
      const spec = PLACEMENT_SPECS[placement] || PLACEMENT_SPECS.Free;
      setActivePresetKey(pKey);
      setSelectedRatioKey(placement in PLACEMENT_SPECS ? placement : 'Free');
      setSelectedRatio(pKey === 'Free' ? null : spec.ratio);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setFreeBox(null);
    }
  }, [isOpen, placement]);

  // Initialize free crop box when canvas mounts or image loads in Free mode
  useEffect(() => {
    if (!isOpen || activePresetKey !== 'Free' || freeBox) return;
    const { cw, ch } = getWorkspaceSize();
    const fallbackRatio = imgObj ? imgObj.width / imgObj.height : 16 / 9;
    setFreeBox(getFixedCropBox(cw, ch, Math.max(0.5, Math.min(2.6, fallbackRatio)), 32));
  }, [isOpen, activePresetKey, freeBox, imgObj, getWorkspaceSize]);

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

  const getActiveBox = useCallback(
    (cw, ch) => {
      if (activePresetKey === 'Free' && freeBox) {
        return freeBox;
      }
      return getFixedCropBox(cw, ch, selectedRatio || 16 / 9, 24);
    },
    [activePresetKey, freeBox, selectedRatio]
  );

  // Draw crop preview canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgObj) return;

    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    if (!container) return;

    const { cw, ch } = getWorkspaceSize();
    canvas.width = cw;
    canvas.height = ch;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cw, ch);

    const box = getActiveBox(cw, ch);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cw, ch);
    ctx.clip();

    ctx.translate(cw / 2 + pan.x, ch / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);

    const imgAspect = imgObj.width / imgObj.height;
    const baseBox = getFixedCropBox(cw, ch, selectedRatio || (imgAspect || 16 / 9), 24);
    const baseAspect = baseBox.w / baseBox.h;

    let baseScale;
    if (rotation === 90 || rotation === 270) {
      baseScale = imgAspect > 1 / baseAspect ? baseBox.h / imgObj.width : baseBox.w / imgObj.height;
    } else {
      baseScale = imgAspect > baseAspect ? baseBox.h / imgObj.height : baseBox.w / imgObj.width;
    }

    const currentScale = baseScale * zoom;
    const drawW = imgObj.width * currentScale;
    const drawH = imgObj.height * currentScale;

    ctx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    drawCropBoxOverlay(ctx, cw, ch, box, activePresetKey === 'Free');
  }, [imgObj, selectedRatio, zoom, pan, rotation, activePresetKey, getWorkspaceSize, getActiveBox]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const toCanvasCoords = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { cx: 0, cy: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || canvas.width);
    const scaleY = canvas.height / (rect.height || canvas.height);
    return {
      cx: (clientX - rect.left) * scaleX,
      cy: (clientY - rect.top) * scaleY,
    };
  };

  const beginInteraction = (clientX, clientY) => {
    const { cw, ch } = getWorkspaceSize();
    const box = getActiveBox(cw, ch);
    const { cx, cy } = toCanvasCoords(clientX, clientY);

    if (activePresetKey === 'Free') {
      const hit = hitTestCropHandle(cx, cy, box, 18);
      if (hit) {
        setIsDragging(true);
        dragModeRef.current = {
          type: 'resize',
          handle: hit.id,
          startX: cx,
          startY: cy,
          origBox: { ...box },
        };
        return;
      }
    }
    setIsDragging(true);
    dragModeRef.current = {
      type: 'pan',
      x: clientX - pan.x,
      y: clientY - pan.y,
    };
  };

  const moveInteraction = (clientX, clientY) => {
    const { cw, ch } = getWorkspaceSize();
    const { cx, cy } = toCanvasCoords(clientX, clientY);

    if (!isDragging) {
      if (activePresetKey === 'Free') {
        const hit = hitTestCropHandle(cx, cy, getActiveBox(cw, ch), 18);
        setHoverCursor(hit ? hit.cursor : 'grab');
      } else {
        setHoverCursor('grab');
      }
      return;
    }

    const mode = dragModeRef.current;
    if (mode.type === 'resize' && mode.origBox) {
      const nextBox = resizeFreeCropBox(
        mode.origBox,
        mode.handle,
        cx - mode.startX,
        cy - mode.startY,
        cw,
        ch
      );
      setFreeBox(nextBox);
      return;
    }

    setPan({
      x: clientX - mode.x,
      y: clientY - mode.y,
    });
  };

  // Mouse & Touch Handling
  const handleMouseDown = (e) => beginInteraction(e.clientX, e.clientY);
  const handleMouseMove = (e) => moveInteraction(e.clientX, e.clientY);
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (!e.touches[0]) return;
    beginInteraction(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!e.touches[0]) return;
    moveInteraction(e.touches[0].clientX, e.touches[0].clientY);
  };

  // Perform Final High-Resolution Crop Export
  const handleApplyCrop = async () => {
    if (!imgObj) return;

    try {
      setIsProcessing(true);

      const { cw, ch } = getWorkspaceSize();
      const box = getActiveBox(cw, ch);
      const boxRatio = box.w / box.h;

      const spec = PLACEMENT_SPECS[selectedRatioKey] || PLACEMENT_SPECS.Free;
      let targetW;
      let targetH;
      if (activePresetKey === 'Free') {
        if (boxRatio >= 1) {
          targetW = 1440;
          targetH = Math.max(240, Math.round(1440 / boxRatio));
        } else {
          targetH = 1440;
          targetW = Math.max(240, Math.round(1440 * boxRatio));
        }
      } else {
        targetW = spec.idealWidth || 1600;
        targetH = spec.idealHeight || Math.round(targetW / (selectedRatio || boxRatio));
      }

      const offCanvas = document.createElement('canvas');
      offCanvas.width = targetW;
      offCanvas.height = targetH;
      const offCtx = offCanvas.getContext('2d');

      offCtx.fillStyle = '#0f172a';
      offCtx.fillRect(0, 0, targetW, targetH);
      offCtx.imageSmoothingEnabled = true;
      offCtx.imageSmoothingQuality = 'high';

      const scaleToOutput = targetW / box.w;
      const dx = (cw / 2 + pan.x) - (box.x + box.w / 2);
      const dy = (ch / 2 + pan.y) - (box.y + box.h / 2);

      offCtx.save();
      offCtx.translate(targetW / 2 + dx * scaleToOutput, targetH / 2 + dy * scaleToOutput);
      offCtx.rotate((rotation * Math.PI) / 180);

      const imgAspect = imgObj.width / imgObj.height;
      const baseBox = getFixedCropBox(cw, ch, selectedRatio || (imgAspect || 16 / 9), 24);
      const baseAspect = baseBox.w / baseBox.h;

      let baseScale;
      if (rotation === 90 || rotation === 270) {
        baseScale = imgAspect > 1 / baseAspect ? baseBox.h / imgObj.width : baseBox.w / imgObj.height;
      } else {
        baseScale = imgAspect > baseAspect ? baseBox.h / imgObj.height : baseBox.w / imgObj.width;
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

          {/* Phone-style Straight Horizontal Aspect Ratio Icon Toolbar */}
          <PhoneCropRatioBar
            activeKey={activePresetKey}
            disabled={isProcessing}
            onSelectPreset={(preset) => {
              setActivePresetKey(preset.key);
              setPan({ x: 0, y: 0 });
              if (preset.isFree) {
                setSelectedRatioKey('Free');
                setSelectedRatio(null);
                const { cw, ch } = getWorkspaceSize();
                const fallbackRatio = imgObj ? imgObj.width / imgObj.height : 16 / 9;
                setFreeBox(getFixedCropBox(cw, ch, Math.max(0.5, Math.min(2.6, fallbackRatio)), 32));
              } else {
                setSelectedRatioKey(preset.specKey && preset.specKey in PLACEMENT_SPECS ? preset.specKey : 'Merchant Store');
                setSelectedRatio(preset.ratio);
              }
            }}
          />

          {/* Interactive Canvas Workspace */}
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : hoverCursor,
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
              {activePresetKey === 'Free'
                ? '✂️ Drag corners/edges to resize freely • Drag inside to move image'
                : '✋ Drag image to reposition within crop box'}
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
              {activePresetKey === 'Free'
                ? `Free Crop (${freeBox ? `${Math.round(freeBox.w)}:${Math.round(freeBox.h)}` : 'Custom'})`
                : `Output: ${currentSpec.idealWidth} × ${currentSpec.idealHeight} px`}
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
                  if (activePresetKey === 'Free') {
                    const { cw, ch } = getWorkspaceSize();
                    const fallbackRatio = imgObj ? imgObj.width / imgObj.height : 16 / 9;
                    setFreeBox(getFixedCropBox(cw, ch, Math.max(0.5, Math.min(2.6, fallbackRatio)), 32));
                  }
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

          {typeof onUseOriginal === 'function' && (
            <button
              type="button"
              onClick={() => {
                onUseOriginal();
                onClose();
              }}
              disabled={isProcessing}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Use Original Image
            </button>
          )}

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
