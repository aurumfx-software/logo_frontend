import React from 'react';

export const PHONE_CROP_PRESETS = [
  { key: 'Free', label: 'Free', ratio: null, specKey: null, boxW: 20, boxH: 20, isFree: true },
  { key: '16:9', label: '16:9', ratio: 16 / 9, specKey: 'Merchant Store', boxW: 24, boxH: 14 },
  { key: '16:5', label: '16:5', ratio: 16 / 5, specKey: 'Home Top', boxW: 26, boxH: 9 },
  { key: '4:3', label: '4:3', ratio: 4 / 3, specKey: 'Special Offer', boxW: 20, boxH: 15 },
  { key: '3:2', label: '3:2', ratio: 3 / 2, specKey: 'Featured Offers', boxW: 22, boxH: 14 },
  { key: '1:1', label: '1:1', ratio: 1, specKey: 'Square Poster', boxW: 17, boxH: 17 },
  { key: '3:4', label: '3:4', ratio: 3 / 4, specKey: 'Business Network', boxW: 14, boxH: 19 },
  { key: '9:16', label: '9:16', ratio: 9 / 16, specKey: null, boxW: 11, boxH: 20 },
];

function AspectThumbIcon({ item, active }) {
  const stroke = active ? '#60a5fa' : '#cbd5e1';
  if (item.isFree) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="7.5"
          y="7.5"
          width="9"
          height="9"
          rx="1.5"
          stroke={stroke}
          strokeWidth="1.4"
          strokeDasharray="2.5 2"
        />
      </svg>
    );
  }
  const x = (28 - item.boxW) / 2;
  const y = (24 - item.boxH) / 2;
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none" aria-hidden="true">
      <rect
        x={x}
        y={y}
        width={item.boxW}
        height={item.boxH}
        rx="2.5"
        stroke={stroke}
        strokeWidth="2"
        fill={active ? 'rgba(96, 165, 250, 0.16)' : 'rgba(255, 255, 255, 0.04)'}
      />
    </svg>
  );
}

export function getFixedCropBox(cw, ch, ratio, margin = 24) {
  const maxBoxW = Math.max(80, cw - margin * 2);
  const maxBoxH = Math.max(80, ch - margin * 2);
  const r = ratio || 16 / 9;
  let boxW = maxBoxW;
  let boxH = boxW / r;
  if (boxH > maxBoxH) {
    boxH = maxBoxH;
    boxW = boxH * r;
  }
  return {
    x: (cw - boxW) / 2,
    y: (ch - boxH) / 2,
    w: boxW,
    h: boxH,
  };
}

export function hitTestCropHandle(cx, cy, box, hitRadius = 18) {
  const { x, y, w, h } = box;
  const handles = [
    { id: 'nw', hx: x, hy: y, cursor: 'nwse-resize' },
    { id: 'ne', hx: x + w, hy: y, cursor: 'nesw-resize' },
    { id: 'sw', hx: x, hy: y + h, cursor: 'nesw-resize' },
    { id: 'se', hx: x + w, hy: y + h, cursor: 'nwse-resize' },
    { id: 'n', hx: x + w / 2, hy: y, cursor: 'ns-resize' },
    { id: 's', hx: x + w / 2, hy: y + h, cursor: 'ns-resize' },
    { id: 'w', hx: x, hy: y + h / 2, cursor: 'ew-resize' },
    { id: 'e', hx: x + w, hy: y + h / 2, cursor: 'ew-resize' },
  ];
  for (const hItem of handles) {
    if (Math.abs(cx - hItem.hx) <= hitRadius && Math.abs(cy - hItem.hy) <= hitRadius) {
      return hItem;
    }
  }
  return null;
}

export function resizeFreeCropBox(origBox, handleId, dx, dy, cw, ch, minSize = 64, pad = 12) {
  let left = origBox.x;
  let right = origBox.x + origBox.w;
  let top = origBox.y;
  let bottom = origBox.y + origBox.h;

  if (handleId.includes('w')) left = Math.max(pad, Math.min(origBox.x + dx, right - minSize));
  if (handleId.includes('e')) right = Math.min(cw - pad, Math.max(origBox.x + origBox.w + dx, left + minSize));
  if (handleId.includes('n')) top = Math.max(pad, Math.min(origBox.y + dy, bottom - minSize));
  if (handleId.includes('s')) bottom = Math.min(ch - pad, Math.max(origBox.y + origBox.h + dy, top + minSize));

  return {
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
  };
}

export function drawCropBoxOverlay(ctx, cw, ch, box, isFreeMode = false) {
  const { x: boxX, y: boxY, w: boxW, h: boxH } = box;

  // Dim outside mask
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fillRect(0, 0, cw, boxY);
  ctx.fillRect(0, boxY + boxH, cw, ch - (boxY + boxH));
  ctx.fillRect(0, boxY, boxX, boxH);
  ctx.fillRect(boxX + boxW, boxY, cw - (boxX + boxW), boxH);

  // Border
  ctx.strokeStyle = isFreeMode ? '#38bdf8' : '#2563eb';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Rule of thirds dashed lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(boxX + boxW / 3, boxY);
  ctx.lineTo(boxX + boxW / 3, boxY + boxH);
  ctx.moveTo(boxX + (boxW * 2) / 3, boxY);
  ctx.lineTo(boxX + (boxW * 2) / 3, boxY + boxH);
  ctx.moveTo(boxX, boxY + boxH / 3);
  ctx.lineTo(boxX + boxW, boxY + boxH / 3);
  ctx.moveTo(boxX, boxY + (boxH * 2) / 3);
  ctx.lineTo(boxX + boxW, boxY + (boxH * 2) / 3);
  ctx.stroke();
  ctx.setLineDash([]);

  // Corner L accents
  const cornerSize = Math.min(18, boxW / 4, boxH / 4);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(boxX, boxY + cornerSize);
  ctx.lineTo(boxX, boxY);
  ctx.lineTo(boxX + cornerSize, boxY);
  ctx.moveTo(boxX + boxW - cornerSize, boxY);
  ctx.lineTo(boxX + boxW, boxY);
  ctx.lineTo(boxX + boxW, boxY + cornerSize);
  ctx.moveTo(boxX, boxY + boxH - cornerSize);
  ctx.lineTo(boxX, boxY + boxH);
  ctx.lineTo(boxX + cornerSize, boxY + boxH);
  ctx.moveTo(boxX + boxW - cornerSize, boxY + boxH);
  ctx.lineTo(boxX + boxW, boxY + boxH);
  ctx.lineTo(boxX + boxW, boxY + boxH - cornerSize);
  ctx.stroke();

  if (isFreeMode) {
    // 8 crisp draggable handles (4 corners + 4 midpoints)
    const pts = [
      [boxX, boxY],
      [boxX + boxW / 2, boxY],
      [boxX + boxW, boxY],
      [boxX + boxW, boxY + boxH / 2],
      [boxX + boxW, boxY + boxH],
      [boxX + boxW / 2, boxY + boxH],
      [boxX, boxY + boxH],
      [boxX, boxY + boxH / 2],
    ];
    pts.forEach(([px, py]) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
}

export default function PhoneCropRatioBar({
  activeKey = 'Free',
  onSelectPreset,
  disabled = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 6,
        overflowX: 'auto',
        padding: '8px 10px',
        background: '#0f172a',
        borderRadius: 14,
        marginBottom: 12,
        scrollbarWidth: 'thin',
      }}
    >
      {PHONE_CROP_PRESETS.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPreset(item)}
            title={`${item.label} Crop`}
            style={{
              flex: '0 0 auto',
              minWidth: 56,
              height: 54,
              padding: '6px 10px',
              borderRadius: 11,
              border: isActive ? '1.5px solid #3b82f6' : '1px solid rgba(148, 163, 184, 0.2)',
              background: isActive ? 'rgba(37, 99, 235, 0.24)' : 'rgba(30, 41, 59, 0.72)',
              color: isActive ? '#93c5fd' : '#e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <AspectThumbIcon item={item} active={isActive} />
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 800 : 600,
                letterSpacing: '0.01em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
