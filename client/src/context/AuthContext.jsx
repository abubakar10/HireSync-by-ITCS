import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('hiresync_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('hiresync_token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('hiresync_token'));

  const persist = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextToken) localStorage.setItem('hiresync_token', nextToken);
    else localStorage.removeItem('hiresync_token');
    if (nextUser) localStorage.setItem('hiresync_user', JSON.stringify(nextUser));
    else localStorage.removeItem('hiresync_user');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authApi.me();
        if (!cancelled) persist(data.data.user, token);
      } catch {
        if (!cancelled) persist(null, null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token, persist]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    persist(data.data.user, data.data.token);
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    persist(data.data.user, data.data.token);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    persist(null, null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!user && !!token,
      isAdmin: user?.role === 'admin',
      isRecruiter: user?.role === 'recruiter',
      login,
      register,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
