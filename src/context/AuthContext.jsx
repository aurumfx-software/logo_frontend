import React, { createContext, useContext, useState, useCallback } from 'react';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('logo_admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const [refreshToken, setRefreshToken] = useState(() => getRefreshToken());

  const login = useCallback((userData, tokenData) => {
    localStorage.setItem('logo_admin_user', JSON.stringify(userData));

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
    setUser(userData);
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

