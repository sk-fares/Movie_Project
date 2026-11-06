import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Lock, AlertCircle, ArrowRight, Loader2, Sparkles, User, CheckCircle2 } from 'lucide-react';
import { useInvite } from '../context/InviteContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export const InviteGateModal = () => {
  const { isGateOpen, validateCode, loading } = useInvite();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);

  // Owner direct sign-in form state
  const [ownerIdentifier, setOwnerIdentifier] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);

  // Lock body scroll when the gate is active
  useEffect(() => {
    if (!isGateOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isGateOpen]);

  // If gate is unlocked, render nothing
  if (isGateOpen) {
    return null;
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanCode = code.trim();
    if (!cleanCode) {
      setError('Please enter your CineVault invite code.');
      return;
    }

    try {
      const res = await validateCode(cleanCode);
      if (res.success) {
        setSuccessMsg('Access granted! Unlocking CineVault...');
        showToast('Invite verified! 7 days full access unlocked.', 'success');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Invalid invite code. Access denied.';
      setError(msg);
    }
  };

  const handleOwnerLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!ownerIdentifier.trim() || !ownerPassword) {
      setError('Please enter your owner username/email and password.');
      return;
    }

    setOwnerSubmitting(true);
    try {
      const user = await login(ownerIdentifier.trim(), ownerPassword);
      if (user.role === 'owner') {
        showToast('Welcome back, Owner! CineVault unlocked.', 'success');
      } else {
        showToast(`Signed in as ${user.username}.`, 'info');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Owner authentication failed.';
      setError(msg);
    } finally {
      setOwnerSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0a0a0a',
        backgroundImage: `
          radial-gradient(circle at 50% 20%, rgba(229, 9, 20, 0.18) 0%, transparent 60%),
          radial-gradient(circle at 80% 80%, rgba(30, 30, 40, 0.8) 0%, transparent 70%)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#141414',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '2.25rem 2rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(229, 9, 20, 0.15)',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {/* Shield & Lock glowing icon badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'rgba(229, 9, 20, 0.12)',
            border: '1px solid rgba(229, 9, 20, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            color: 'var(--accent-primary)',
            boxShadow: '0 8px 25px rgba(229, 9, 20, 0.25)'
          }}
        >
          <Lock size={30} strokeWidth={2.2} />
        </div>

        {/* Title */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '0.75rem'
          }}
        >
          <Shield size={12} color="var(--accent-primary)" />
          <span>Private Member Access Only</span>
        </div>

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            marginBottom: '0.5rem',
            letterSpacing: '-0.5px',
            color: '#ffffff'
          }}
        >
          CINE<span style={{ color: 'var(--accent-primary)' }}>VAULT</span>
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            marginBottom: '1.75rem'
          }}
        >
          {showOwnerLogin
            ? 'Sign in with your CineVault Owner credentials to bypass gate and manage library.'
            : 'Access is restricted to invited friends & family. Please enter your 7-day invite pass to enter.'}
        </p>

        {/* Error notification banner */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.25rem',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              color: '#86efac',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.25rem',
              textAlign: 'left'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {!showOwnerLogin ? (
          /* Normal Invite Code Form */
          <form onSubmit={handleVerifyCode}>
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <label
                htmlFor="inviteCodeInput"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                7-Day Invite Code
              </label>

              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <input
                  id="inviteCodeInput"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  placeholder="e.g. CINEVAULT2026"
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem 0.9rem 3rem',
                    backgroundColor: '#1f1f1f',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(229, 9, 20, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !code.trim() ? 0.6 : 1
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Enter CineVault</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Note about 7 days persistence */}
            <div
              style={{
                marginTop: '1.25rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                lineHeight: 1.4
              }}
            >
              🔒 Invite codes grant <strong>7 days</strong> of continuous access and are safely stored in your browser's local storage.
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setShowOwnerLogin(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
              >
                Are you the CineVault Owner? Sign in here
              </button>
            </div>
          </form>
        ) : (
          /* Direct Owner Login Form */
          <form onSubmit={handleOwnerLogin}>
            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <label
                htmlFor="ownerIdInput"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.4rem'
                }}
              >
                Owner Username or Email
              </label>
              <input
                id="ownerIdInput"
                type="text"
                value={ownerIdentifier}
                onChange={(e) => setOwnerIdentifier(e.target.value)}
                placeholder="owner / email"
                autoFocus
                disabled={ownerSubmitting}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#1f1f1f',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <label
                htmlFor="ownerPassInput"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.4rem'
                }}
              >
                Owner Password
              </label>
              <input
                id="ownerPassInput"
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={ownerSubmitting}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#1f1f1f',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={ownerSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: ownerSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {ownerSubmitting ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Verifying Owner Credentials...</span>
                </>
              ) : (
                <>
                  <User size={18} />
                  <span>Sign In as Owner</span>
                </>
              )}
            </button>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setShowOwnerLogin(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ← Back to Invite Code entry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
