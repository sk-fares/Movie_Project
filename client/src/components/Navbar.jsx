import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Clapperboard, Plus, BarChart2, Smartphone, Menu, X, Bookmark } from 'lucide-react';

export const Navbar = ({ onOpenStats }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
              gap: '0.4rem'
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

          {/* Add Movie */}
          <Link
            to="/add"
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem' }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="hide-mobile">Add Movie</span>
          </Link>

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
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 600 }}
          >
            Home
          </Link>
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
              gap: '0.5rem'
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
              gap: '0.5rem'
            }}
          >
            <Smartphone size={16} /> Install App on Device
          </button>
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
