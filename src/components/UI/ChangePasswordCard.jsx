import React, { useState, useEffect } from 'react';
import { HiLockClosed, HiCheckCircle } from 'react-icons/hi';

/**
 * Shared OTP Password Reset / Change Password card for both Customer & Merchant profiles.
 * Uses the exact same /api/v1/auth/forgot-password & /api/v1/auth/reset-password flow.
 */
export default function ChangePasswordCard({
  defaultEmail = '',
  title = 'Change Account Password',
  subtitle = 'Verify with a 6-digit email OTP to set a new password (min 8 characters).',
  onSendOtp,
  onResetPassword,
}) {
  const cleanInitial =
    defaultEmail && !String(defaultEmail).includes('@customer.logoapp.local')
      ? String(defaultEmail).trim()
      : '';

  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState(cleanInitial);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (cleanInitial && !email) {
      setEmail(cleanInitial);
    }
  }, [cleanInitial]);

  const handleSendOtp = async () => {
    setError('');
    setSuccess('');
    const target = email.trim().toLowerCase();
    if (!target || !target.includes('@')) {
      setError('Please enter your registered email address.');
      return;
    }
    setSending(true);
    try {
      const res = await onSendOtp(target);
      setOtpSent(true);
      const devNote = res?.dev_otp ? ` (OTP: ${res.dev_otp})` : '';
      setSuccess(`Reset OTP sent to ${target}.${devNote}`);
    } catch (err) {
      setError(err?.message || 'Failed to send reset OTP.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const target = email.trim().toLowerCase();
    if (!target || !target.includes('@')) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setUpdating(true);
    try {
      await onResetPassword({
        email: target,
        otp: otp.trim(),
        new_password: newPassword,
      });
      setSuccess('Password changed successfully! Use your new password on your next sign-in.');
      setOtpSent(false);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 20,
        padding: 18,
        borderRadius: 12,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <HiLockClosed size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{title}</h4>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setExpanded((v) => !v);
            setError('');
            setSuccess('');
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: expanded ? '1px solid #cbd5e1' : 'none',
            background: expanded ? '#ffffff' : '#0f172a',
            color: expanded ? '#334155' : '#ffffff',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {expanded ? 'Close' : 'Change Password'}
        </button>
      </div>

      {expanded && (
        <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
          {error && (
            <div style={{ padding: '9px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12.5, fontWeight: 700 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '9px 12px', borderRadius: 8, background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiCheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              Registered Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13.5,
                background: '#ffffff',
              }}
            />
          </div>

          {!otpSent ? (
            <button
              type="button"
              disabled={sending}
              onClick={handleSendOtp}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              {sending ? 'Sending...' : 'Send Reset OTP'}
            </button>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    6-Digit OTP *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, background: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    New Password (min 8 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, background: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13.5, background: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {updating ? 'Updating Password...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={handleSendOtp}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {sending ? 'Resending...' : 'Resend OTP'}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
