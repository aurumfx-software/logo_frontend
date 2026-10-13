const resolveBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.protocol === 'https:') {
    return window.location.origin;
  }
  return (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    'http://168.144.18.149:8000'
  );
};

export const API_BASE_URL = resolveBaseUrl();

export const API_V1_URL =
  typeof window !== 'undefined' && window.location && window.location.protocol === 'https:'
    ? `${window.location.origin}/api/v1`
    : (import.meta.env.VITE_API_URL || `${API_BASE_URL.replace(/\/$/, '')}/api/v1`);

export const STATIC_BASE_URL = `${API_BASE_URL.replace(/\/$/, '')}/static`;

export default API_BASE_URL;

