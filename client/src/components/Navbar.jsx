import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Clapperboard, Plus, BarChart2, Smartphone, Menu, X, LogIn, LogOut, Shield, User as UserIcon, Sparkles, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ onOpenStats, onOpenCarouselManager, onOpenRequests }) => {
  const { user, isOwner, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // PWA Install Prompt detection
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install on your phone or desktop: Tap browser menu (⋮ or Share) and select "Add to Home Screen" or "Install App"!');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
        backgroundColor: scrolled ? 'rgba(20, 20, 20, 0.95)' : 'rgba(20, 20, 20, 0.65)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
        boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.7)' : 'none'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px'
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none'
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #E50914 0%, #990000 100%)',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(229, 9, 20, 0.5)'
            }}
          >
            <Clapperboard size={22} color="#ffffff" strokeWidth={2.2} />
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.4rem',
                letterSpacing: '-0.5px',
                color: '#ffffff'
              }}
            >
              CINE<span style={{ color: 'var(--accent-primary)' }}>VAULT</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem'
          }}
          className="hide-mobile"
        >
          <Link
            to="/"
            style={{
              fontSize: '0.95rem',
              fontWeight: location.pathname === '/' ? 600 : 400,
              color: location.pathname === '/' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'color 0.2s ease'
            }}
          >
            Home
          </Link>

          <button
            onClick={onOpenStats}
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              transition: 'color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            title="View Library Statistics"
          >
            <BarChart2 size={16} />
            <span>Library Stats</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Install App button */}
          <button
            onClick={handleInstallClick}
            className="btn btn-outline"
            style={{
              padding: '0.45rem 0.8rem',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-full)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
            title="Install CineVault on Phone or PC"
          >
            <Smartphone size={14} />
            <span className="hide-mobile">Install App</span>
          </button>

          {/* Add Movie Button — ONLY visible to Owner! */}
          {isOwner && (
            <Link
              to="/add"
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem' }}
              title="Add a new movie to CineVault"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span className="hide-mobile">Add Movie</span>
            </Link>
          )}

          {/* User Auth Section */}
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="btn btn-secondary"
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  borderColor: isOwner ? 'rgba(229, 9, 20, 0.4)' : 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: isOwner ? 'var(--accent-primary)' : '#333333',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                >
                  {isOwner ? <Shield size={14} /> : user.username.charAt(0).toUpperCase()}
                </div>
                <span className="hide-mobile" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {user.username}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    backgroundColor: isOwner ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: isOwner ? '#ff6b6b' : 'var(--text-muted)'
                  }}
                >
                  {isOwner ? 'Owner' : 'Viewer'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: '230px',
                    backgroundColor: '#1c1c1c',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
                    zIndex: 100
                  }}
                >
                  <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>{user.username}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </div>
                    <div style={{ marginTop: '0.35rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          backgroundColor: isOwner ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          color: isOwner ? '#ff6b6b' : '#bbbbbb',
                          fontWeight: 700
                        }}
                      >
                        {isOwner ? '👑 CineVault Owner' : '🍿 Viewer Profile'}
                      </span>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onOpenCarouselManager) onOpenCarouselManager();
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: '0.25rem'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Sparkles size={16} color="var(--accent-primary)" />
                      <span>Carousel Manager</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      if (onOpenRequests) onOpenRequests();
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginBottom: '0.25rem'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Film size={16} color="var(--accent-primary)" />
                    <span>Movie Wishlist</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ff6b6b',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(229, 9, 20, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-icon show-mobile-only"
            style={{ width: '38px', height: '38px', display: 'none' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#181818',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {isAuthenticated && (
            <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ fontWeight: 700, color: '#ffffff' }}>{user.username}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {user.email} • {isOwner ? 'Owner' : 'Viewer'}
              </div>
            </div>
          )}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 600 }}
          >
            Home
          </Link>

          {isOwner && (
            <Link
              to="/add"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: 'var(--accent-primary)', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={18} /> Add Movie (Owner)
            </Link>
          )}

          {isOwner && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenCarouselManager) onOpenCarouselManager();
              }}
              style={{
                color: '#ff9999',
                fontSize: '1rem',
                fontWeight: 600,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={16} /> Carousel Manager
            </button>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenStats();
            }}
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <BarChart2 size={16} /> Library Stats
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleInstallClick();
            }}
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Smartphone size={16} /> Install App on Device
          </button>

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              style={{
                color: '#ff6b6b',
                fontSize: '1rem',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              <LogOut size={16} /> Log Out
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                color: 'var(--accent-primary)',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <LogIn size={16} /> Sign In
            </Link>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .show-mobile-only { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
};
