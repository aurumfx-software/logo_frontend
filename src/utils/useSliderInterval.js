import { useState, useEffect, useCallback } from 'react';

export const SLIDER_STORAGE_KEY = 'logo_ad_slider_interval_sec';
export const DEFAULT_SLIDER_INTERVAL_SEC = 4;

/**
 * Read the current slider speed in seconds from localStorage
 */
export function getStoredSliderIntervalSec(fallback = DEFAULT_SLIDER_INTERVAL_SEC) {
  try {
    const val = localStorage.getItem(SLIDER_STORAGE_KEY);
    if (val !== null) {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= 2 && parsed <= 30) {
        return parsed;
      }
    }
  } catch {}
  return fallback;
}

/**
 * Save the slider speed in seconds to localStorage and broadcast to all components
 */
export function setStoredSliderIntervalSec(seconds) {
  const safeSec = Math.max(2, Math.min(30, Number(seconds) || DEFAULT_SLIDER_INTERVAL_SEC));
  try {
    localStorage.setItem(SLIDER_STORAGE_KEY, String(safeSec));
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('logo:slider_interval_updated', {
        detail: { intervalSec: safeSec },
      })
    );
  }
  return safeSec;
}

/**
 * React Hook for sliders to get the auto-slide duration in milliseconds
 * Syncs automatically with Super Admin settings and real-time custom events.
 */
export function useSliderInterval(defaultSec = DEFAULT_SLIDER_INTERVAL_SEC) {
  const [intervalSec, setIntervalSec] = useState(() => getStoredSliderIntervalSec(defaultSec));

  useEffect(() => {
    // 1. Fetch public settings from backend API
    let isMounted = true;
    fetch('/api/v1/promotions/settings/slider')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const s = data?.data?.interval_seconds ?? data?.interval_seconds;
        if (s && s >= 2 && s <= 30) {
          setIntervalSec(s);
          try {
            localStorage.setItem(SLIDER_STORAGE_KEY, String(s));
          } catch {}
        }
      })
      .catch(() => {
        // Silently fall back to localStorage / defaultSec
      });

    // 2. Real-time event listener for updates made from Admin panel
    const handleUpdate = (e) => {
      const updated = e?.detail?.intervalSec ?? getStoredSliderIntervalSec(defaultSec);
      setIntervalSec(updated);
    };

    window.addEventListener('logo:slider_interval_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('logo:slider_interval_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [defaultSec]);

  // Return milliseconds
  return intervalSec * 1000;
}
