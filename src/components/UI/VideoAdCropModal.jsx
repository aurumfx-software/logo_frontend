import React, { useEffect, useRef, useState } from 'react';
import { HiCheck, HiOutlinePlay, HiOutlinePause, HiOutlineRefresh, HiX } from 'react-icons/hi';

const VIDEO_CROP_RATIOS = [
  { key: '16:9', label: '16:9 Widescreen', ratio: 16 / 9, width: 1280, height: 720 },
  { key: '16:5', label: '16:5 Wide Banner', ratio: 16 / 5, width: 1280, height: 400 },
  { key: '4:3', label: '4:3 Card Ad', ratio: 4 / 3, width: 960, height: 720 },
  { key: '1:1', label: '1:1 Square', ratio: 1, width: 720, height: 720 },
];

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
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [selectedPreset, setSelectedPreset] = useState(VIDEO_CROP_RATIOS[0]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const [duration, setDuration] = useState(0);
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPreset(VIDEO_CROP_RATIOS[0]);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDuration(0);
    setStartSec(0);
    setEndSec(0);
    setIsPlaying(false);
    setIsProcessing(false);
    setProgressPct(0);
    setLoadError('');
  }, [isOpen, videoSrc]);

  const drawFrame = () => {
    const canvas = previewCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth || !video.videoHeight) return;

    const ctx = canvas.getContext('2d');
    const cW = canvas.width;
    const cH = canvas.height;
    ctx.clearRect(0, 0, cW, cH);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cW, cH);

    const maxBoxW = cW * 0.88;
    const maxBoxH = cH * 0.86;
    let boxW = maxBoxW;
    let boxH = boxW / selectedPreset.ratio;
    if (boxH > maxBoxH) {
      boxH = maxBoxH;
      boxW = boxH * selectedPreset.ratio;
    }
    const boxX = (cW - boxW) / 2;
    const boxY = (cH - boxH) / 2;

    const vAspect = video.videoWidth / video.videoHeight;
    const boxAspect = boxW / boxH;
    const baseScale = vAspect > boxAspect ? boxH / video.videoHeight : boxW / video.videoWidth;
    const currentScale = baseScale * zoom;
    const drawW = video.videoWidth * currentScale;
    const drawH = video.videoHeight * currentScale;
    const drawX = cW / 2 + pan.x - drawW / 2;
    const drawY = cH / 2 + pan.y - drawH / 2;

    ctx.drawImage(video, drawX, drawY, drawW, drawH);

    // Dim exterior
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fillRect(0, 0, cW, boxY);
    ctx.fillRect(0, boxY + boxH, cW, cH - (boxY + boxH));
    ctx.fillRect(0, boxY, boxX, boxH);
    ctx.fillRect(boxX + boxW, boxY, cW - (boxX + boxW), boxH);

    // Crop box outline & thirds grid
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(boxX + (boxW / 3) * i, boxY);
      ctx.lineTo(boxX + (boxW / 3) * i, boxY + boxH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX, boxY + (boxH / 3) * i);
      ctx.lineTo(boxX + boxW, boxY + (boxH / 3) * i);
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    const loop = () => {
      if (!active) return;
      const vid = videoRef.current;
      if (vid && endSec > 0 && vid.currentTime >= endSec && !vid.paused) {
        vid.currentTime = startSec;
      }
      drawFrame();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  });

  if (!isOpen) return null;

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

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    setIsDragging(true);
    dragStartRef.current = { x: t.clientX - pan.x, y: t.clientY - pan.y };
  };

  const handleTouchMove = (e) => {
    const t = e.touches?.[0];
    if (!isDragging || !t) return;
    setPan({ x: t.clientX - dragStartRef.current.x, y: t.clientY - dragStartRef.current.y });
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
      const targetW = selectedPreset.width;
      const targetH = selectedPreset.height;
      const offCanvas = document.createElement('canvas');
      offCanvas.width = targetW;
      offCanvas.height = targetH;
      const offCtx = offCanvas.getContext('2d');

      const cW = prevCanvas.width;
      const cH = prevCanvas.height;
      const maxBoxW = cW * 0.88;
      const maxBoxH = cH * 0.86;
      let boxW = maxBoxW;
      let boxH = boxW / selectedPreset.ratio;
      if (boxH > maxBoxH) {
        boxH = maxBoxH;
        boxW = boxH * selectedPreset.ratio;
      }
      const scaleToOut = targetW / boxW;

      const vAspect = vid.videoWidth / vid.videoHeight;
      const boxAspect = boxW / boxH;
      const baseScale = vAspect > boxAspect ? boxH / vid.videoHeight : boxW / vid.videoWidth;
      const currentScale = baseScale * zoom * scaleToOut;
      const drawW = vid.videoWidth * currentScale;
      const drawH = vid.videoHeight * currentScale;
      const drawX = targetW / 2 + pan.x * scaleToOut - drawW / 2;
      const drawY = targetH / 2 + pan.y * scaleToOut - drawH / 2;

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
        offCtx.drawImage(vid, drawX, drawY, drawW, drawH);
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
              Choose aspect ratio, drag &amp; zoom to frame the video, and optionally trim start/end time.
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
              const dur = Number(e.currentTarget.duration || 0);
              setDuration(dur);
              setStartSec(0);
              setEndSec(dur);
            }}
            onError={() => setLoadError('Preview failed to decode this video. You can still upload original below.')}
            style={{ display: 'none' }}
          />

          {/* Aspect Ratio Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {VIDEO_CROP_RATIOS.map((preset) => {
              const active = selectedPreset.key === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setSelectedPreset(preset);
                    setPan({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: `1.5px solid ${active ? '#2563eb' : '#cbd5e1'}`,
                    background: active ? '#eff6ff' : '#ffffff',
                    color: active ? '#1d4ed8' : '#334155',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
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
              cursor: isDragging ? 'grabbing' : 'grab',
              position: 'relative',
              marginBottom: 14,
            }}
          >
            <canvas
              ref={previewCanvasRef}
              width={660}
              height={320}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
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
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
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
