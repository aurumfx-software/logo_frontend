import { API_BASE_URL, API_V1_URL } from '../config/apiConfig';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';
const ACCESS_TOKEN_KEY = 'logo_admin_access_token';
const REFRESH_TOKEN_KEY = 'logo_admin_refresh_token';
const LEGACY_TOKEN_KEY = 'logo_admin_token';
const LOGO_USER_KEY = 'logo_admin_user';

/**
 * Get current Access Token from localStorage or sessionStorage
 */
export function getAccessToken() {
  return (
    localStorage.getItem(AUTH_TOKEN_KEY) ||
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem(LEGACY_TOKEN_KEY) ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem(AUTH_TOKEN_KEY) ||
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
    const tokenStr = accessToken.trim();
    localStorage.setItem(AUTH_TOKEN_KEY, tokenStr);
    localStorage.setItem(ACCESS_TOKEN_KEY, tokenStr);
    localStorage.setItem(LEGACY_TOKEN_KEY, tokenStr);
    localStorage.setItem('token', tokenStr);
    localStorage.setItem('access_token', tokenStr);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Save user profile data to localStorage
 */
export function setUserSession(userData) {
  if (userData && typeof userData === 'object') {
    const userJson = JSON.stringify(userData);
    localStorage.setItem(USER_KEY, userJson);
    localStorage.setItem(LOGO_USER_KEY, userJson);

    const resolvedId = userData.id || userData.user_id || userData.userId || userData._id;
    const resolvedCode = userData.user_code || userData.userCode || userData.code;

    if (resolvedId) {
      localStorage.setItem('user_id', String(resolvedId));
      localStorage.setItem('userId', String(resolvedId));
      localStorage.setItem('logo_admin_user_id', String(resolvedId));
    }
    if (resolvedCode) {
      localStorage.setItem('user_code', String(resolvedCode));
      localStorage.setItem('userCode', String(resolvedCode));
    }
  }
}

/**
 * Clear all authentication tokens and user session data
 */
export function clearTokens() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LOGO_USER_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('userId');
  localStorage.removeItem('user_code');
  localStorage.removeItem('userCode');

  sessionStorage.clear();
}

/**
 * Attempt to refresh access token using refresh token
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

  clearTokens();
  throw lastError || new Error('Failed to refresh authentication token');
}

/**
 * Centralized Authenticated Fetch Wrapper (`apiFetch`)
 * Automatically attaches Bearer JWT token and resolves URL endpoints against API_BASE_URL
 */
export async function apiFetch(endpoint, options = {}) {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  
  let url = endpoint;
  if (!endpoint.startsWith('http')) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    url = `${baseUrl}${cleanEndpoint}`;
  }

  const accessToken = getAccessToken();

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

  // Handle 401 Unauthorized token refresh
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
      console.warn('Token refresh notice:', refreshErr);
    }
  }

  return response;
}
