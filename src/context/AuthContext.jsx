import React, { createContext, useContext, useState, useCallback } from 'react';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('logo_admin_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const resolvedId = parsed.id || parsed.user_id || parsed.userId || parsed._id || 1;
        const resolvedCode =
          parsed.user_code ||
          parsed.userCode ||
          parsed.code ||
          localStorage.getItem('user_code') ||
          localStorage.getItem('userCode') ||
          'FLS_1';
        const enrichedUser = {
          id: resolvedId,
          user_id: resolvedId,
          userId: resolvedId,
          user_code: resolvedCode,
          userCode: resolvedCode,
          ...parsed,
        };
        localStorage.setItem('logo_admin_user', JSON.stringify(enrichedUser));
        localStorage.setItem('user_id', String(resolvedId));
        localStorage.setItem('userId', String(resolvedId));
        localStorage.setItem('logo_admin_user_id', String(resolvedId));
        if (resolvedCode) {
          localStorage.setItem('user_code', String(resolvedCode));
          localStorage.setItem('userCode', String(resolvedCode));
        }
        return enrichedUser;
      } catch (err) {
        return null;
      }
    }
    return null;
  });
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const [refreshToken, setRefreshToken] = useState(() => getRefreshToken());

  const login = useCallback((userData, tokenData) => {
    const resolvedId = userData?.id || userData?.user_id || userData?.userId || userData?._id || 1;
    const resolvedCode = userData?.user_code || userData?.userCode || userData?.code || localStorage.getItem('user_code') || 'FLS_1';

    const enrichedUser = {
      id: resolvedId,
      user_id: resolvedId,
      userId: resolvedId,
      user_code: resolvedCode,
      userCode: resolvedCode,
      ...userData,
    };

    localStorage.setItem('logo_admin_user', JSON.stringify(enrichedUser));
    localStorage.setItem('user_id', String(resolvedId));
    localStorage.setItem('userId', String(resolvedId));
    localStorage.setItem('logo_admin_user_id', String(resolvedId));
    if (resolvedCode) {
      localStorage.setItem('user_code', String(resolvedCode));
      localStorage.setItem('userCode', String(resolvedCode));
    }

    let access = '';
    let refresh = '';

    if (typeof tokenData === 'string') {
      access = tokenData;
    } else if (tokenData && typeof tokenData === 'object') {
      access = tokenData.accessToken || tokenData.access_token || tokenData.token || '';
      refresh = tokenData.refreshToken || tokenData.refresh_token || '';
    }

    setTokens({ accessToken: access, refreshToken: refresh });
    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(enrichedUser);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setAccessToken('');
    setRefreshToken('');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token: accessToken,
        accessToken,
        refreshToken,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

