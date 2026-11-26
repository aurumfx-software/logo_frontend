import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiClient';

export const SLIDER_STORAGE_KEY = 'logo_ad_slider_interval_sec';
export const SLIDER_SETTINGS_KEY = 'logo_ad_slider_settings_v2';
export const DEFAULT_SLIDER_INTERVAL_SEC = 4;

export const SLIDER_AD_TYPE_KEYS = [
  'home_top',
  'home_middle',
  'above_footer',
  'featured_offers',
  'business_network',
  'moving_text',
  'merchant_store',
];

function clampSec(val, fallback = DEFAULT_SLIDER_INTERVAL_SEC) {
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.max(2, Math.min(60, Math.round(num)));
}

export function normalizeSliderSettings(raw = {}, fallback = DEFAULT_SLIDER_INTERVAL_SEC) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const globalSec = clampSec(src.interval_seconds, fallback);
  const rawMap = src.per_type_seconds && typeof src.per_type_seconds === 'object' ? src.per_type_seconds : {};
  const perType = {};
  SLIDER_AD_TYPE_KEYS.forEach((key) => {
    const defKey = key === 'business_network' ? 5 : globalSec;
    const candidate = src[`${key}_seconds`] ?? rawMap[key];
    perType[key] = clampSec(candidate, defKey);
  });
  const out = {
    interval_seconds: globalSec,
    per_type_seconds: perType,
  };
  SLIDER_AD_TYPE_KEYS.forEach((k) => {
    out[`${k}_seconds`] = perType[k];
  });
  return out;
}

export function getStoredSliderIntervalSec(fallback = DEFAULT_SLIDER_INTERVAL_SEC, adType = null) {
  try {
    const settingsRaw = localStorage.getItem(SLIDER_SETTINGS_KEY);
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      const norm = normalizeSliderSettings(parsed, fallback);
      if (adType && norm.per_type_seconds[adType]) {
        return norm.per_type_seconds[adType];
      }
      return norm.interval_seconds;
    }
    const val = localStorage.getItem(SLIDER_STORAGE_KEY);
    if (val !== null) {
      return clampSec(val, fallback);
    }
  } catch {}
  return fallback;
}

export function getStoredSliderSettings() {
  try {
    const raw = localStorage.getItem(SLIDER_SETTINGS_KEY);
    if (raw) {
      return normalizeSliderSettings(JSON.parse(raw));
    }
  } catch {}
  return normalizeSliderSettings({ interval_seconds: getStoredSliderIntervalSec(DEFAULT_SLIDER_INTERVAL_SEC) });
}

export function setStoredSliderIntervalSec(secondsOrSettings) {
  const isObj = secondsOrSettings && typeof secondsOrSettings === 'object';
  const normalized = isObj
    ? normalizeSliderSettings(secondsOrSettings)
    : normalizeSliderSettings({
        ...getStoredSliderSettings(),
        interval_seconds: clampSec(secondsOrSettings, DEFAULT_SLIDER_INTERVAL_SEC),
      });

  try {
    localStorage.setItem(SLIDER_STORAGE_KEY, String(normalized.interval_seconds));
    localStorage.setItem(SLIDER_SETTINGS_KEY, JSON.stringify(normalized));
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('logo:slider_interval_updated', {
        detail: {
          intervalSec: normalized.interval_seconds,
          settings: normalized,
        },
      })
    );
  }
  return normalized.interval_seconds;
}

export function useSliderInterval(defaultSec = DEFAULT_SLIDER_INTERVAL_SEC, adType = null) {
  const [intervalSec, setIntervalSec] = useState(() =>
    getStoredSliderIntervalSec(defaultSec, adType)
  );

  useEffect(() => {
    let isMounted = true;
    apiFetch('/api/v1/promotions/settings/slider', { method: 'GET' })
      .then((res) => (res && res.ok ? res.json() : null))
      .then((payload) => {
        if (!isMounted || !payload) return;
        const raw = payload?.data || payload;
        const norm = normalizeSliderSettings(raw, defaultSec);
        try {
          localStorage.setItem(SLIDER_STORAGE_KEY, String(norm.interval_seconds));
          localStorage.setItem(SLIDER_SETTINGS_KEY, JSON.stringify(norm));
        } catch {}
        const chosen = adType ? norm.per_type_seconds[adType] || norm.interval_seconds : norm.interval_seconds;
        if (chosen) setIntervalSec(chosen);
      })
      .catch(() => {});

    const handleUpdate = (e) => {
      const settingsObj = e?.detail?.settings;
      if (settingsObj) {
        const norm = normalizeSliderSettings(settingsObj, defaultSec);
        setIntervalSec(adType ? norm.per_type_seconds[adType] || norm.interval_seconds : norm.interval_seconds);
      } else {
        setIntervalSec(getStoredSliderIntervalSec(defaultSec, adType));
      }
    };

    window.addEventListener('logo:slider_interval_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('logo:slider_interval_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [defaultSec, adType]);

  return intervalSec * 1000;
}
