import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import {
  saveWatchProgress as saveLocalProgress,
  getWatchProgress as getLocalProgress,
  clearWatchProgress as clearLocalProgress,
  toggleWatchlist as toggleLocalWatchlist,
  isInWatchlist as isLocalInWatchlist
} from '../services/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cinevault_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('cinevault_token') || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('cinevault_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('cinevault_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('[CineVault Auth] Token expired or invalid, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await authApi.login(identifier, password);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('cinevault_token', res.token);
      localStorage.setItem('cinevault_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.error || 'Login failed');
  };

  const register = async (username, email, password) => {
    const res = await authApi.register(username, email, password);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('cinevault_token', res.token);
      localStorage.setItem('cinevault_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.error || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('cinevault_token');
      localStorage.removeItem('cinevault_user');
    } catch {}
  };

  // Sync watch progress to both backend user profile and local cache
  const updateWatchProgress = async (movieId, currentTime, duration) => {
    saveLocalProgress(movieId, currentTime, duration);
    if (token && user) {
      try {
        const res = await authApi.updateProgress(movieId, currentTime, duration);
        if (res.success && res.watchProgress) {
          setUser((prev) => (prev ? { ...prev, watchProgress: res.watchProgress } : prev));
        }
      } catch (err) {
        console.warn('Failed to sync progress to cloud profile:', err);
      }
    }
  };

  // Sync watchlist toggle to both backend user profile and local cache
  const toggleUserWatchlist = async (movieId) => {
    const localAdded = toggleLocalWatchlist(movieId);
    if (token && user) {
      try {
        const res = await authApi.toggleWatchlist(movieId);
        if (res.success && res.watchlist) {
          setUser((prev) => (prev ? { ...prev, watchlist: res.watchlist } : prev));
          return res.inWatchlist;
        }
      } catch (err) {
        console.warn('Failed to sync watchlist to cloud profile:', err);
      }
    }
    return localAdded;
  };

  const isMovieInWatchlist = (movieId) => {
    if (!movieId) return false;
    if (user && Array.isArray(user.watchlist)) {
      return user.watchlist.some((id) => (typeof id === 'object' ? id._id === movieId : id === movieId));
    }
    return isLocalInWatchlist(movieId);
  };

  const getMovieProgress = (movieId) => {
    if (!movieId) return null;
    if (user && Array.isArray(user.watchProgress)) {
      const match = user.watchProgress.find(
        (p) => (typeof p.movieId === 'object' ? p.movieId._id === movieId : p.movieId === movieId)
      );
      if (match) return match;
    }
    return getLocalProgress(movieId);
  };

  const isOwner = Boolean(user && user.role === 'owner');
  const isAuthenticated = Boolean(user && token);

  const value = {
    user,
    token,
    loading,
    isOwner,
    isAuthenticated,
    login,
    register,
    logout,
    updateWatchProgress,
    toggleUserWatchlist,
    isMovieInWatchlist,
    getMovieProgress
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
