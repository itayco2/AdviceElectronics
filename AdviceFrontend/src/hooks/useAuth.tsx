import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getUser } from '../lib/api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      // Try to fetch user info if token exists
      const fetchUser = async () => {
        try {
          // Decode token to get user id (simple base64 decode, not secure, but works for demo)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userId = payload.user?.id || payload["user"]?.id;
          if (userId) {
            const userData = await getUser(userId);
            setUser(userData);
          }
        } catch {
          setUser(null);
        }
      };
      fetchUser();
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      localStorage.setItem('token', res.token);
      setToken(res.token);
      // Fetch user info
      const payload = JSON.parse(atob(res.token.split('.')[1]));
      const userId = payload.user?.id || payload["user"]?.id;
      if (userId) {
        const userData = await getUser(userId);
        setUser(userData);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      await apiRegister({ email, password });
      // Auto-login after register
      await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}; 