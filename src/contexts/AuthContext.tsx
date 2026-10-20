// AuthContext - Pure Normal Authentication State for SQLite Backend
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AuthUser,
  loginWithCredentials,
  registerWithCredentials,
  signOutUser,
  cacheAuthUser,
  getCachedAuthUser,
} from '../services/authService';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const cached = getCachedAuthUser();
    if (cached) {
      apiService.setUserId(cached.email || cached.uid);
    }
    return cached;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedAuthUser();
    if (cached) {
      setUser(cached);
      apiService.setUserId(cached.email || cached.uid);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const authUser = await loginWithCredentials(email, password);
      setUser(authUser);
      cacheAuthUser(authUser);
      apiService.setUserId(authUser.email);
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setError(null);
      setLoading(true);
      const authUser = await registerWithCredentials(email, password, name);
      setUser(authUser);
      cacheAuthUser(authUser);
      apiService.setUserId(authUser.email);
    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await signOutUser();
      setUser(null);
      cacheAuthUser(null);
      apiService.setUserId(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};
