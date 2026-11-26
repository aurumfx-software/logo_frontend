import React, { useEffect, useRef, useState } from 'react';
import { HiCheck, HiOutlinePlay, HiOutlinePause, HiOutlineRefresh, HiX } from 'react-icons/hi';
import PhoneCropRatioBar, {
  PHONE_CROP_PRESETS,
  drawCropBoxOverlay,
  getFixedCropBox,
  hitTestCropHandle,
  resizeFreeCropBox,
} from './PhoneCropRatioBar';

const PREVIEW_W = 660;
const PREVIEW_H = 320;
const DEFAULT_FREE_BOX = { x: 70, y: 24, w: 520, h: 272 };

const toEven = (val) => Math.max(240, Math.round(val / 2) * 2);

const getTargetDimensions = (boxW, boxH) => {
  const boxRatio = boxW / Math.max(1, boxH);
  if (boxRatio > 1.05) {
    return { targetW: 1280, targetH: toEven(1280 / boxRatio) };
  }
  if (boxRatio < 0.95) {
    return { targetW: toEven(1280 * boxRatio), targetH: 1280 };
  }
  return { targetW: 960, targetH: toEven(960 / boxRatio) };
};

export default function VideoAdCropModal({
  isOpen,
  onClose,
  videoSrc,
  videoFile = null,
  onCropSave,
  onUseOriginal,
}) {
  const videoRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const hasResizedFreeRef = useRef(false);
  const dragActionRef = useRef(null);

  const [selectedPreset, setSelectedPreset] = useState(PHONE_CROP_PRESETS[0]);
  const [freeBox, setFreeBox] = useState(DEFAULT_FREE_BOX);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoverCursor, setHoverCursor] = useState('grab');

  const [duration, setDuration] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [loadError, setLoadError] = useState('');

  // Latest render parameters read by RAF loop without restarting it on every drag pixel
  const stateRef = useRef({ selectedPreset, freeBox, zoom, pan, startSec, endSec });
  stateRef.current = { selectedPreset, freeBox, zoom, pan, startSec, endSec };

  useEffect(() => {
    if (!isOpen) return;
    hasResizedFreeRef.current = false;
    dragActionRef.current = null;
    setSelectedPreset(PHONE_CROP_PRESETS[0]);
    setFreeBox(DEFAULT_FREE_BOX);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHoverCursor('grab');
    setDuration(0);
    setStartSec(0);
    setEndSec(0);
    setIsPlaying(false);
    setIsProcessing(false);
    setProgressPct(0);
    setLoadError('');
  }, [isOpen, videoSrc]);

  const computeVideoLayout = (vid, cW, cH, preset, curFreeBox, curZoom, curPan) => {
    const isFree = Boolean(preset?.isFree);
    const box = isFree
      ? curFreeBox
      : getFixedCropBox(cW, cH, preset?.ratio || 16 / 9, 22);

    const vAspect = vid.videoWidth / vid.videoHeight;
    let baseScale;
    if (isFree) {
      // Keep entire video visible & static while handles are dragged freely
      baseScale = Math.min((cW - 48) / vid.videoWidth, (cH - 48) / vid.videoHeight);
    } else {
      const boxAspect = box.w / box.h;
      baseScale = vAspect > boxAspect ? box.h / vid.videoHeight : box.w / vid.videoWidth;
    }

    const currentScale = baseScale * curZoom;
    const drawW = vid.videoWidth * currentScale;
    const drawH = vid.videoHeight * currentScale;
    const drawX = cW / 2 + curPan.x - drawW / 2;
    const drawY = cH / 2 + curPan.y - drawH / 2;
    return { box, isFree, drawX, drawY, drawW, drawH };
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;

    const loop = () => {
      if (!active) return;
      const canvas = previewCanvasRef.current;
      const vid = videoRef.current;
      const {
        selectedPreset: preset,
        freeBox: curFreeBox,
        zoom: curZoom,
        pan: curPan,
        startSec: sSec,
        endSec: eSec,
      } = stateRef.current;

      if (vid && eSec > 0 && vid.currentTime >= eSec && !vid.paused) {
        vid.currentTime = sSec;
      }

      if (canvas && vid && vid.videoWidth && vid.videoHeight) {
        const ctx = canvas.getContext('2d');
        const cW = canvas.width;
        const cH = canvas.height;
        ctx.clearRect(0, 0, cW, cH);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, cW, cH);

        const { box, isFree, drawX, drawY, drawW, drawH } = computeVideoLayout(
          vid,
          cW,
          cH,
          preset,
          curFreeBox,
          curZoom,
          curPan
        );
        ctx.drawImage(videoRef.current, drawX, drawY, drawW, drawH);
        drawCropBoxOverlay(ctx, cW, cH, box, isFree);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toCanvasCoords = (clientX, clientY) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return { cx: 0, cy: 0, scaleX: 1, scaleY: 1 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    return {
      cx: (clientX - rect.left) * scaleX,
      cy: (clientY - rect.top) * scaleY,
      scaleX,
      scaleY,
    };
  };

  const togglePlayPreview = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      if (vid.currentTime < startSec || (endSec > 0 && vid.currentTime >= endSec)) {
        vid.currentTime = startSec;
      }
      vid.play().catch(() => {});
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const startPointerDrag = (clientX, clientY) => {
    const { cx, cy } = toCanvasCoords(clientX, clientY);
    if (selectedPreset.isFree) {
      const hit = hitTestCropHandle(cx, cy, freeBox, 18);
      if (hit) {
        dragActionRef.current = {
          type: 'handle',
          handleId: hit.id,
          startCx: cx,
          startCy: cy,
          origBox: { ...freeBox },
        };
        setIsDragging(true);
        return;
      }
    }
    dragActionRef.current = {
      type: 'pan',
      startClientX: clientX,
      startClientY: clientY,
      origPan: { ...pan },
    };
    setIsDragging(true);
  };

  const movePointerDrag = (clientX, clientY) => {
    const action = dragActionRef.current;
    const { cx, cy, scaleX, scaleY } = toCanvasCoords(clientX, clientY);

    if (!action) {
      if (selectedPreset.isFree) {
        const hit = hitTestCropHandle(cx, cy, freeBox, 18);
        setHoverCursor(hit ? hit.cursor : 'grab');
      } else {
        setHoverCursor('grab');
      }
      return;
    }

    if (action.type === 'handle') {
      const dx = cx - action.startCx;
      const dy = cy - action.startCy;
      hasResizedFreeRef.current = true;
      setFreeBox(resizeFreeCropBox(action.origBox, action.handleId, dx, dy, PREVIEW_W, PREVIEW_H, 64, 14));
      return;
    }

    setPan({
      x: action.origPan.x + (clientX - action.startClientX) * scaleX,
      y: action.origPan.y + (clientY - action.startClientY) * scaleY,
    });
  };

  const endPointerDrag = () => {
    dragActionRef.current = null;
    setIsDragging(false);
  };

  const handleSelectPreset = (preset) => {
    const vid = videoRef.current;
    if (preset.isFree) {
      if (selectedPreset.isFree && vid?.videoWidth) {
        setFreeBox(getFixedCropBox(PREVIEW_W, PREVIEW_H, vid.videoWidth / vid.videoHeight, 24));
      } else if (!selectedPreset.isFree && selectedPreset.ratio) {
        setFreeBox(getFixedCropBox(PREVIEW_W, PREVIEW_H, selectedPreset.ratio, 22));
      }
    } else {
      hasResizedFreeRef.current = false;
    }
    setSelectedPreset(preset);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleResetCrop = () => {
    const vid = videoRef.current;
    hasResizedFreeRef.current = false;
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (selectedPreset.isFree) {
      setFreeBox(
        vid?.videoWidth
          ? getFixedCropBox(PREVIEW_W, PREVIEW_H, vid.videoWidth / vid.videoHeight, 24)
          : DEFAULT_FREE_BOX
      );
    }
  };

  const handleApplyVideoCrop = async () => {
    const vid = videoRef.current;
    const prevCanvas = previewCanvasRef.current;
    if (!vid || !prevCanvas || !vid.videoWidth) {
      setLoadError('Video is still loading. Try again in a moment.');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      if (videoFile && onCropSave) {
        onCropSave(videoFile, videoSrc);
        onClose();
      } else {
        setLoadError('Video cropping requires a modern Chromium/Edge browser.');
      }
      return;
    }

    setIsProcessing(true);
    setProgressPct(1);
    setLoadError('');

    try {
      const cW = prevCanvas.width;
      const cH = prevCanvas.height;
      const { box, drawX, drawY, drawW, drawH } = computeVideoLayout(
        vid,
        cW,
        cH,
        selectedPreset,
        freeBox,
        zoom,
        pan
      );

      const { targetW, targetH } = getTargetDimensions(box.w, box.h);
      const offCanvas = document.createElement('canvas');
      offCanvas.width = targetW;
      offCanvas.height = targetH;
      const offCtx = offCanvas.getContext('2d');

      const outScaleX = targetW / box.w;
      const outScaleY = targetH / box.h;
      const outW = drawW * outScaleX;
      const outH = drawH * outScaleY;
      const outX = (drawX - box.x) * outScaleX;
      const outY = (drawY - box.y) * outScaleY;

      const clipStart = Math.max(0, Number(startSec) || 0);
      const clipEnd = Math.max(clipStart + 0.5, Number(endSec) || duration || 10);
      const clipSpan = Math.max(0.5, clipEnd - clipStart);

      const stream = offCanvas.captureStream(30);
      try {
        const vidStream = typeof vid.captureStream === 'function' ? vid.captureStream() : null;
        if (vidStream) {
          vidStream.getAudioTracks().forEach((track) => stream.addTrack(track));
        }
      } catch (_) {}

      const mimeCandidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      const chosenMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
      const chunks = [];
      const recorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime, videoBitsPerSecond: 2500000 })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      const donePromise = new Promise((resolve, reject) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: chosenMime || 'video/webm' });
          if (blob.size === 0) {
            reject(new Error('Cropped video output was empty.'));
            return;
          }
          resolve(blob);
        };
        recorder.onerror = (err) => reject(err?.error || new Error('Video recording failed'));
      });

      vid.pause();
      vid.currentTime = clipStart;
      await new Promise((res) => {
        const onSeeked = () => {
          vid.removeEventListener('seeked', onSeeked);
          res();
        };
        vid.addEventListener('seeked', onSeeked);
        setTimeout(res, 600);
      });

      let rafId = null;
      const renderExport = () => {
        offCtx.fillStyle = '#000000';
        offCtx.fillRect(0, 0, targetW, targetH);
        offCtx.drawImage(vid, outX, outY, outW, outH);
        const elapsed = Math.max(0, vid.currentTime - clipStart);
        setProgressPct(Math.min(99, Math.max(5, Math.round((elapsed / clipSpan) * 100))));
        if (vid.currentTime >= clipEnd || vid.ended) {
          vid.pause();
          if (recorder.state === 'recording') recorder.stop();
          return;
        }
        rafId = requestAnimationFrame(renderExport);
      };

      recorder.start(200);
      vid.muted = true;
      await vid.play();
      renderExport();

      const croppedBlob = await donePromise;
      if (rafId) cancelAnimationFrame(rafId);

      const outFile = new File(
        [croppedBlob],
        `cropped_ad_${selectedPreset.key.replace(':', 'x')}_${Date.now()}.webm`,
        { type: 'video/webm' }
      );
      const outUrl = URL.createObjectURL(croppedBlob);
      setIsProcessing(false);
      setProgressPct(100);
      if (onCropSave) await onCropSave(outFile, outUrl);
      onClose();
    } catch (err) {
      setIsProcessing(false);
      setLoadError(err?.message || 'Could not crop this video (CORS or codec restriction). Try uploading directly.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.86)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
      onClick={() => !isProcessing && onClose()}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 740,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.38)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              ✂️ Crop &amp; Trim Video Advertisement
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
              {selectedPreset.isFree
                ? 'Free Size Crop active — drag any corner/edge circle handle to resize freely, or drag inside to reposition video.'
                : `Locked to ${selectedPreset.label} — drag video to frame and adjust zoom/trim sliders below.`}
            </p>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: '#f1f5f9', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <HiX size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 22px', overflowY: 'auto', flex: 1 }}>
          {/* Hidden source video element */}
          <video
            ref={videoRef}
            src={videoSrc}
            crossOrigin="anonymous"
            playsInline
            muted
            onLoadedMetadata={(e) => {
              const vidEl = e.currentTarget;
              const dur = Number(vidEl.duration || 0);
              setDuration(dur);
              setStartSec(0);
              setEndSec(dur);
              if (!hasResizedFreeRef.current && vidEl.videoWidth && vidEl.videoHeight) {
                setFreeBox(getFixedCropBox(PREVIEW_W, PREVIEW_H, vidEl.videoWidth / vidEl.videoHeight, 24));
              }
            }}
            onError={() => setLoadError('Preview failed to decode this video. You can still upload original below.')}
            style={{ display: 'none' }}
          />

          {/* Phone-editor-style horizontal aspect ratio bar */}
          <div style={{ marginBottom: 12 }}>
            <PhoneCropRatioBar
              activeKey={selectedPreset.key}
              disabled={isProcessing}
              onSelectPreset={handleSelectPreset}
            />
          </div>

          {loadError && (
            <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
              {loadError}
            </div>
          )}

          {/* Cropped Interactive Canvas */}
          <div
            style={{
              background: '#0f172a',
              borderRadius: 14,
              overflow: 'hidden',
              cursor: isDragging ? (dragActionRef.current?.type === 'handle' ? hoverCursor : 'grabbing') : hoverCursor,
              position: 'relative',
              marginBottom: 14,
            }}
          >
            <canvas
              ref={previewCanvasRef}
              width={PREVIEW_W}
              height={PREVIEW_H}
              onMouseDown={(e) => startPointerDrag(e.clientX, e.clientY)}
              onMouseMove={(e) => movePointerDrag(e.clientX, e.clientY)}
              onMouseUp={endPointerDrag}
              onMouseLeave={endPointerDrag}
              onTouchStart={(e) => {
                const t = e.touches?.[0];
                if (t) startPointerDrag(t.clientX, t.clientY);
              }}
              onTouchMove={(e) => {
                const t = e.touches?.[0];
                if (t) movePointerDrag(t.clientX, t.clientY);
              }}
              onTouchEnd={endPointerDrag}
              style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
            />
            {isProcessing && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.78)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Cropping Video... {progressPct}%</div>
                <div style={{ fontSize: 12, color: '#cbd5e1' }}>Please keep this window open while rendering cropped clip</div>
              </div>
            )}
          </div>

          {/* Playback + Zoom + Trim Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>Frame &amp; Zoom ({zoom.toFixed(1)}x)</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={togglePlayPreview}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: 'none', background: '#2563eb', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {isPlaying ? <HiOutlinePause size={14} /> : <HiOutlinePlay size={14} />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleResetCrop}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 9px', borderRadius: 7, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <HiOutlineRefresh size={13} /> Reset
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                disabled={isProcessing}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {duration > 0 && (
              <div style={{ padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8 }}>
                  Trim Length: {startSec.toFixed(1)}s → {endSec.toFixed(1)}s (Total {duration.toFixed(1)}s)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#475569' }}>
                    <span style={{ width: 38 }}>Start:</span>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0.5, endSec - 0.5)}
                      step="0.1"
                      value={startSec}
                      disabled={isProcessing}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setStartSec(v);
                        if (videoRef.current) videoRef.current.currentTime = v;
                      }}
                      style={{ flex: 1 }}
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#475569' }}>
                    <span style={{ width: 38 }}>End:</span>
                    <input
                      type="range"
                      min={Math.min(duration, startSec + 0.5)}
                      max={duration}
                      step="0.1"
                      value={endSec}
                      disabled={isProcessing}
                      onChange={(e) => setEndSec(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: '#f1f5f9', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Cancel
          </button>
          {typeof onUseOriginal === 'function' && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                onUseOriginal();
                onClose();
              }}
              style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Upload Original Without Crop
            </button>
          )}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleApplyVideoCrop}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              color: '#ffffff',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: isProcessing ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <HiCheck size={17} />
            <span>{isProcessing ? `Cropping (${progressPct}%)...` : 'Apply Crop & Upload Video'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
