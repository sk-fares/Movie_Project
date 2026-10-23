import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clapperboard, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Please enter both your username/email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'radial-gradient(ellipse at center, #231215 0%, #141414 70%, #0a0a0a 100%)',
        position: 'relative'
      }}
    >
      {/* Background Accent Gradients */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '350px',
          background: 'rgba(229, 9, 20, 0.12)',
          filter: 'blur(120px)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'rgba(24, 24, 24, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(229, 9, 20, 0.15)',
          backdropFilter: 'blur(16px)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              textDecoration: 'none',
              marginBottom: '1rem'
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #E50914 0%, #990000 100%)',
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(229, 9, 20, 0.5)'
              }}
            >
              <Clapperboard size={24} color="#ffffff" strokeWidth={2.2} />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.6rem',
                letterSpacing: '-0.5px',
                color: '#ffffff'
              }}
            >
              CINE<span style={{ color: 'var(--accent-primary)' }}>VAULT</span>
            </span>
          </Link>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Sign in to stream movies and access your library
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(229, 9, 20, 0.15)',
              border: '1px solid rgba(229, 9, 20, 0.4)',
              borderRadius: 'var(--radius-sm)',
              color: '#ff6b6b',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#e5e5e5' }}>
              Username or Gmail
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Enter username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{ paddingLeft: '42px', width: '100%' }}
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#e5e5e5' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '42px', paddingRight: '42px', width: '100%' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '0.85rem',
              fontSize: '1rem',
              fontWeight: 700,
              width: '100%',
              marginTop: '0.5rem',
              justifyContent: 'center'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Redirect */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'underline' }}>
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
};
