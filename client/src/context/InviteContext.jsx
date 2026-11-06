import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { inviteApi } from '../services/api';
import { useAuth } from './AuthContext';

const INVITE_STORAGE_KEY = 'cinevault_invite_pass';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const InviteContext = createContext(null);

export const InviteProvider = ({ children }) => {
  const { user, isOwner } = useAuth();

  // Helper to read and validate the stored invite pass
  const getStoredPass = () => {
    try {
      const raw = localStorage.getItem(INVITE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.code || !parsed.expiresAt) {
        localStorage.removeItem(INVITE_STORAGE_KEY);
        return null;
      }
      // Check if 7 days have passed
      if (Date.now() >= parsed.expiresAt) {
        localStorage.removeItem(INVITE_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(INVITE_STORAGE_KEY);
      return null;
    }
  };

  const [invitePass, setInvitePass] = useState(getStoredPass);
  const [loading, setLoading] = useState(false);

  // Sync state if storage changes in another browser tab
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === INVITE_STORAGE_KEY) {
        setInvitePass(getStoredPass());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Periodic check (every 5 minutes) to auto-expire pass when 7 days lapse
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getStoredPass();
      if (!current && invitePass) {
        setInvitePass(null);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [invitePass]);

  // If user is logged in as Owner, grant/refresh owner 7-day pass automatically
  useEffect(() => {
    if (isOwner && user) {
      const current = getStoredPass();
      if (!current) {
        const ownerPass = {
          code: 'OWNER-ACCESS',
          label: `Owner (${user.username})`,
          verifiedAt: Date.now(),
          expiresAt: Date.now() + SEVEN_DAYS_MS
        };
        try {
          localStorage.setItem(INVITE_STORAGE_KEY, JSON.stringify(ownerPass));
          setInvitePass(ownerPass);
        } catch {}
      }
    }
  }, [isOwner, user]);

  // Calculate days/hours remaining on the current 7-day pass
  const daysRemaining = useMemo(() => {
    if (!invitePass || !invitePass.expiresAt) return 0;
    const diffMs = invitePass.expiresAt - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  }, [invitePass]);

  // Verify and activate an invite code
  const validateCode = useCallback(async (code) => {
    setLoading(true);
    try {
      const res = await inviteApi.validate(code);
      if (res.success && res.data) {
        const pass = {
          code: res.data.code,
          label: res.data.label || '',
          verifiedAt: Date.now(),
          expiresAt: res.data.expiresAt || (Date.now() + SEVEN_DAYS_MS)
        };
        localStorage.setItem(INVITE_STORAGE_KEY, JSON.stringify(pass));
        setInvitePass(pass);
        return res;
      }
      throw new Error(res.error || 'Invalid invite code.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual reset of invite pass
  const clearInvite = useCallback(() => {
    try {
      localStorage.removeItem(INVITE_STORAGE_KEY);
    } catch {}
    setInvitePass(null);
  }, []);

  // True if user holds an unexpired 7-day invite pass or is the CineVault owner
  const hasValidInvite = Boolean(invitePass && Date.now() < invitePass.expiresAt);
  const isGateOpen = hasValidInvite || isOwner;

  const value = useMemo(
    () => ({
      invitePass,
      hasValidInvite,
      isGateOpen,
      daysRemaining,
      loading,
      validateCode,
      clearInvite
    }),
    [invitePass, hasValidInvite, isGateOpen, daysRemaining, loading, validateCode, clearInvite]
  );

  return <InviteContext.Provider value={value}>{children}</InviteContext.Provider>;
};

export const useInvite = () => {
  const context = useContext(InviteContext);
  if (!context) {
    throw new Error('useInvite must be used within an InviteProvider');
  }
  return context;
};
