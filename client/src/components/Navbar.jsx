import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Plus, BarChart2, Search, Clapperboard } from 'lucide-react';

export const Navbar = ({ onOpenStats }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
        backgroundColor: scrolled ? 'rgba(20, 20, 20, 0.95)' : 'rgba(20, 20, 20, 0.6)',
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

        {/* Center / Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <Link
            to="/"
            style={{
              fontSize: '0.95rem',
              fontWeight: location.pathname === '/' ? 600 : 400,
              color: location.pathname === '/' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'color 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
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
            <span className="hide-mobile">Library Stats</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/add"
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem' }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Movie</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
