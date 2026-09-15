import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setAccessToken } from '@/lib/api';
import type { CurrentUser } from '@/lib/types';

interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore a session via the refresh cookie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        if (res.ok) {
          const { accessToken } = await res.json();
          setAccessToken(accessToken);
          const me = await api.get<CurrentUser>('/auth/me');
          if (!cancelled) setUser(me);
        }
      } catch {
        /* not logged in */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ accessToken: string; user: CurrentUser }>('/auth/login', { email, password });
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const me = await api.get<CurrentUser>('/auth/me');
    setUser(me);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
