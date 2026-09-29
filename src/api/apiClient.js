import { API_BASE_URL } from '../config/apiConfig';

const ACCESS_TOKEN_KEY = 'logo_admin_access_token';
const REFRESH_TOKEN_KEY = 'logo_admin_refresh_token';
const LEGACY_TOKEN_KEY = 'logo_admin_token';
const USER_KEY = 'logo_admin_user';

/**
 * Get current Access Token from localStorage or sessionStorage
 */
export function getAccessToken() {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_TOKEN_KEY) ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem('access_token') ||
    ''
  );
}

/**
 * Get current Refresh Token from localStorage or sessionStorage
 */
export function getRefreshToken() {
  return (
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    localStorage.getItem('refresh_token') ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem('refresh_token') ||
    ''
  );
}

/**
 * Save access and refresh tokens to localStorage
 */
export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(LEGACY_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Clear all authentication tokens and user session data
 */
export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('user_code');

  sessionStorage.clear();
}

/**
 * Attempt to refresh the access token using the refresh token
 */
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const refreshEndpoints = [
    `${baseUrl}/api/v1/auth/refresh`,
    `${baseUrl}/api/v1/auth/refresh-token`,
    `${baseUrl}/api/v1/auth/token/refresh`,
  ];

  let lastError = null;

  for (const endpoint of refreshEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken, refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken =
          data.access_token || data.accessToken || data.token || data.data?.access_token || data.data?.token;
        const newRefreshToken =
          data.refresh_token || data.refreshToken || data.data?.refresh_token || refreshToken;

        if (newAccessToken) {
          setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
          return newAccessToken;
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  // If refresh failed on all endpoints, clear tokens
  clearTokens();
  throw lastError || new Error('Failed to refresh authentication token');
}

/**
 * Centralized Authenticated Fetch Wrapper (`apiFetch`)
 * Automatically injects Bearer JWT access token and handles token refresh on 401.
 */
export async function apiFetch(endpoint, options = {}) {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const accessToken = getAccessToken();

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  if (accessToken) {
    const rawToken = accessToken.trim();
    const bearer = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
    headers['Authorization'] = bearer;
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, try refreshing token once and retrying
  if (response.status === 401 && getRefreshToken()) {
    try {
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    } catch (refreshErr) {
      console.warn('Token refresh failed:', refreshErr);
    }
  }

  return response;
}
