import React, { useState } from 'react';
import { Sparkles, Film } from 'lucide-react';

export const FloatingRequestButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.75rem 1.25rem',
        borderRadius: '999px',
        backgroundColor: '#1b1b1b',
        color: '#ffffff',
        border: isHovered ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: isHovered
          ? '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(229, 9, 20, 0.45)'
          : '0 8px 24px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)',
        transform: isHovered ? 'translateY(-3px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.25s cubic-bezier(0.2, 0, 0.2, 1)',
        cursor: 'pointer',
        userSelect: 'none'
      }}
      title="Recommend a movie to add to CineVault"
    >
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: 'rgba(229, 9, 20, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-primary)'
        }}
      >
        <Sparkles size={16} />
      </div>
      <span style={{ fontSize: '0.88rem', fontWeight: 700, letterSpacing: '-0.2px' }}>
        Suggest Movie
      </span>
    </button>
  );
};
