import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/apiConfig';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Super Admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const baseUrl = API_BASE_URL.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          role: role,
        }),
      });

      const resData = await response.json();

      if (!response.ok || resData.success === false) {
        const errorMsg =
          resData.message ||
          resData.detail ||
          (resData.errors && resData.errors[0]) ||
          resData.error ||
          'Invalid credentials or authentication failed.';
        throw new Error(errorMsg);
      }

      // Extract user details, user_code, access token & refresh token from API response structure
      const apiUser = resData.user || resData.data?.user || resData.data || {};
      const accessToken =
        resData.access_token ||
        resData.accessToken ||
        resData.token ||
        resData.data?.access_token ||
        resData.data?.token ||
        '';

      const refreshToken =
        resData.refresh_token ||
        resData.refreshToken ||
        resData.data?.refresh_token ||
        resData.data?.refreshToken ||
        '';

      const userCode =
        resData.user_code ||
        resData.userCode ||
        resData.code ||
        resData.data?.user_code ||
        resData.data?.userCode ||
        resData.data?.code ||
        apiUser.user_code ||
        apiUser.userCode ||
        apiUser.code ||
        'FLS_1';

      const userData = {
        email: apiUser.email || email,
        role: apiUser.role || role,
        name:
          apiUser.name ||
          email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        initials: (apiUser.name || email).charAt(0).toUpperCase(),
        loginTime: new Date().toISOString(),
        id: apiUser.id || apiUser._id,
        user_code: userCode,
        userCode: userCode,
        ...apiUser,
      };

      login(userData, { accessToken, refreshToken });
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Unable to log in. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="login-logo">L</div>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to Logo Admin Dashboard</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--danger-light)',
              color: '#DC2626',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>⚠</span> {error}
          </motion.div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <HiOutlineMail
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                  fontSize: 18,
                }}
              />
              <input
                type="email"
                className="form-input"
                placeholder="admin@aurumfx.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 42 }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <HiOutlineLockClosed
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                  fontSize: 18,
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 42, paddingRight: 42 }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                  fontSize: 18,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
              style={{ fontWeight: 600 }}
            >
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Field Staff">Field Staff</option>
              <option value="User">User</option>
              <option value="Merchant">Merchant</option>
            </select>
          </div>

          <div className="login-options">
            <label className="login-remember">
              <input type="checkbox" defaultChecked />
              Remember me
            </label>
            <span className="login-forgot">Forgot Password?</span>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="login-footer">© 2024 AurumFX Pvt Ltd · All rights reserved</p>
      </motion.div>
    </div>
  );
}
