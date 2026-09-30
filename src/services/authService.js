import { apiFetch, setTokens, setUserSession, clearTokens } from '../api/apiClient';

/**
 * Auth Service — Module 1 (Authentication)
 */
export const authService = {
  /**
   * User Login: POST /api/v1/auth/login
   */
  async login({ email, password, role }) {
    const roleCode = role === 'Staff' || role === 'FIELD_STAFF' ? 'FIELD_STAFF' : 'ADMIN';
    const response = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password: password.trim(),
        role: roleCode,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      const errorMsg =
        data.message ||
        data.detail ||
        (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
        'Login failed. Please check your credentials.';
      throw new Error(errorMsg);
    }

    const token = data.access_token || data.accessToken || data.token || data.data?.access_token;
    const refreshToken = data.refresh_token || data.refreshToken || data.data?.refresh_token || '';
    const user = data.user || data.data?.user || data.data || {};

    if (token) {
      setTokens({ accessToken: token, refreshToken });
    }
    if (user && Object.keys(user).length > 0) {
      setUserSession(user);
    }

    return {
      token,
      accessToken: token,
      refreshToken,
      user,
      expires_in: data.expires_in || 1800,
    };
  },

  /**
   * User Registration: POST /api/v1/auth/register
   */
  async register({ name, email, password, phone, role, city, address }) {
    const response = await apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone ? phone.trim() : null,
        address: address || city ? (address || city).trim() : null,
        role: role === 'Field Staff' || role === 'FIELD_STAFF' ? 'FIELD_STAFF' : 'ADMIN',
      }),
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      const errorMsg =
        data.message ||
        data.detail ||
        (data.errors && Array.isArray(data.errors) ? data.errors.join(', ') : null) ||
        'Registration failed.';
      throw new Error(errorMsg);
    }

    return data.user || data.data?.user || data.data || data;
  },

  /**
   * Current Authenticated User Profile: GET /api/v1/auth/me
   */
  async getMe() {
    const response = await apiFetch('/api/v1/auth/me', {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.message || data.detail || 'Failed to fetch user profile');
    }

    const userObj = data.user || data.data || data;
    setUserSession(userObj);
    return userObj;
  },

  /**
   * Merchant Request OTP: POST /api/v1/merchants/login/send-otp
   */
  async sendMerchantOtp({ email }) {
    const response = await apiFetch('/api/v1/merchants/login/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.message || data.detail || 'Failed to send OTP');
    }

    return data;
  },

  /**
   * Merchant Verify OTP: POST /api/v1/merchants/login/verify-otp
   */
  async verifyMerchantOtp({ email, otp }) {
    const response = await apiFetch('/api/v1/merchants/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.message || data.detail || 'Invalid or expired OTP');
    }

    const token = data.access_token || data.accessToken || data.token;
    const user = data.user || data.merchant || data.data || {};

    if (token) {
      setTokens({ accessToken: token });
    }
    if (user) {
      setUserSession(user);
    }

    return data;
  },

  /**
   * Logout user
   */
  logout() {
    clearTokens();
  },
};

export default authService;
