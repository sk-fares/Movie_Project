import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const userRef = useRef(user);
  userRef.current = user;

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

  const login = useCallback(async (identifier, password) => {
    const res = await authApi.login(identifier, password);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('cinevault_token', res.token);
      localStorage.setItem('cinevault_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.error || 'Login failed');
  }, []);

  const register = useCallback(async (username, email, password) => {
    const res = await authApi.register(username, email, password);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('cinevault_token', res.token);
      localStorage.setItem('cinevault_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.error || 'Registration failed');
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem('cinevault_token');
      localStorage.removeItem('cinevault_user');
    } catch {}
  }, []);

  // Sync watch progress to both backend user profile and local cache
  // Note: We don't trigger a React state re-render on every video tick
  // to avoid video player blinking or resetting during active playback!
  const updateWatchProgress = useCallback(async (movieId, currentTime, duration) => {
    saveLocalProgress(movieId, currentTime, duration);
    const storedToken = localStorage.getItem('cinevault_token');
    if (storedToken) {
      try {
        await authApi.updateProgress(movieId, currentTime, duration);
      } catch (err) {
        console.warn('Failed to sync progress to cloud profile:', err);
      }
    }
  }, []);

  // Sync watchlist toggle to both backend user profile and local cache
  const toggleUserWatchlist = useCallback(async (movieId) => {
    const localAdded = toggleLocalWatchlist(movieId);
    const storedToken = localStorage.getItem('cinevault_token');
    if (storedToken && userRef.current) {
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
  }, []);

  const isMovieInWatchlist = useCallback((movieId) => {
    if (!movieId) return false;
    const currentUser = userRef.current;
    if (currentUser && Array.isArray(currentUser.watchlist)) {
      return currentUser.watchlist.some((id) => (typeof id === 'object' ? id._id === movieId : id === movieId));
    }
    return isLocalInWatchlist(movieId);
  }, []);

  const getMovieProgress = useCallback((movieId) => {
    if (!movieId) return null;
    const local = getLocalProgress(movieId);
    if (local) return local;

    const currentUser = userRef.current;
    if (currentUser && Array.isArray(currentUser.watchProgress)) {
      const match = currentUser.watchProgress.find(
        (p) => (typeof p.movieId === 'object' ? p.movieId._id === movieId : p.movieId === movieId)
      );
      if (match) return match;
    }
    return null;
  }, []);

  const isOwner = Boolean(user && user.role === 'owner');
  const isAuthenticated = Boolean(user && token);

  const value = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
