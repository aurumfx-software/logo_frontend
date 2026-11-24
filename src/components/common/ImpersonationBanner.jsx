import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { switchBackToAdminApi } from '../../api/userApi';
import { setTokens } from '../../api/apiClient';

export default function ImpersonationBanner() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);

  const isImpersonating =
    localStorage.getItem('is_impersonation') === 'true' ||
    Boolean(user?.is_impersonation);

  if (!isImpersonating) {
    return null;
  }

  let impersonatedInfo = null;
  try {
    impersonatedInfo = JSON.parse(localStorage.getItem('impersonated_user') || 'null');
  } catch (_) {}

  const displayName =
    impersonatedInfo?.name ||
    impersonatedInfo?.business_name ||
    user?.name ||
    user?.business_name ||
    user?.user_code ||
    user?.login_id ||
    'Member';

  const displayRole =
    user?.role === 'MERCHANT'
      ? 'Merchant'
      : user?.role === 'FIELD_STAFF'
      ? 'Customer'
      : user?.role || 'User';

  const handleSwitchBack = async () => {
    setIsSwitching(true);
    try {
      const res = await switchBackToAdminApi();

      localStorage.removeItem('is_impersonation');
      localStorage.removeItem('impersonated_user');
      const backupRaw = localStorage.getItem('admin_session_backup');
      localStorage.removeItem('admin_session_backup');

      let adminUser = res.user || { role: 'ADMIN', name: 'Logo Admin' };
      if (backupRaw) {
        try {
          const backup = JSON.parse(backupRaw);
          if (backup.user) {
            adminUser = JSON.parse(backup.user);
          }
        } catch (_) {}
      }

      login(adminUser, {
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });

      window.location.href = '/merchants';
    } catch (err) {
      console.warn('Backend switch-back API notice:', err.message);
      // Fallback: restore from local admin_session_backup if present
      const backupRaw = localStorage.getItem('admin_session_backup');
      if (backupRaw) {
        try {
          const backup = JSON.parse(backupRaw);
          localStorage.removeItem('is_impersonation');
          localStorage.removeItem('impersonated_user');
          localStorage.removeItem('admin_session_backup');

          if (backup.accessToken) {
            setTokens({ accessToken: backup.accessToken, refreshToken: backup.refreshToken || '' });
          }
          if (backup.user) {
            localStorage.setItem('logo_admin_user', backup.user);
          }
          window.location.href = '/merchants';
          return;
        } catch (_) {}
      }
      alert(err.message || 'Failed to switch back to admin session');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        background: 'linear-gradient(90deg, #6366F1 0%, #4F46E5 50%, #7C3AED 100%)',
        color: '#FFFFFF',
        padding: '9px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 15px rgba(79, 70, 229, 0.35)',
        fontSize: 13.5,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            background: 'rgba(255, 255, 255, 0.22)',
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          Viewing As
        </span>
        <span style={{ fontWeight: 500 }}>
          You are currently logged in as{' '}
          <strong style={{ fontWeight: 800, color: '#FEF08A' }}>{displayName}</strong> ({displayRole}).
        </span>
      </div>

      <button
        onClick={handleSwitchBack}
        disabled={isSwitching}
        style={{
          background: '#FFFFFF',
          color: '#4F46E5',
          border: 'none',
          padding: '6px 16px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 12.5,
          cursor: isSwitching ? 'not-allowed' : 'pointer',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s ease',
          opacity: isSwitching ? 0.7 : 1,
        }}
        onMouseOver={(e) => {
          if (!isSwitching) e.currentTarget.style.background = '#F8FAFC';
        }}
        onMouseOut={(e) => {
          if (!isSwitching) e.currentTarget.style.background = '#FFFFFF';
        }}
      >
        {isSwitching ? 'Switching back...' : '← Switch back to Admin'}
      </button>
    </div>
  );
}
