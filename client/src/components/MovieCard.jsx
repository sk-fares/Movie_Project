import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Edit, Trash2, Film, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { getPosterUrl, formatMinutes } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const MovieCard = ({ movie, onDelete, onWatchlistChange }) => {
  const { isOwner, isMovieInWatchlist, toggleUserWatchlist, getMovieProgress } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const inWatchlist = isMovieInWatchlist(movie?._id);
  const posterUrl = getPosterUrl(movie.posterPath);
  const watchProgress = getMovieProgress(movie?._id);

  const handleCardClick = () => {
    navigate(`/movie/${movie._id}`);
  };

  const handleBookmarkToggle = async (e) => {
    e.stopPropagation();
    const isAdded = await toggleUserWatchlist(movie._id);
    if (onWatchlistChange) onWatchlistChange(movie._id, isAdded);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        backgroundColor: '#1f1f1f',
        border: isHovered ? '1px solid rgba(229, 9, 20, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isHovered ? '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(229, 9, 20, 0.3)' : 'var(--shadow-sm)',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.2, 0, 0.2, 1)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Poster Media Box (2:3 aspect ratio) */}
      <div
        style={{
          position: 'relative',
          paddingTop: '150%', // 2:3 aspect ratio
          width: '100%',
          overflow: 'hidden',
          backgroundColor: '#181818'
        }}
      >
        {posterUrl && !imageError ? (
          <img
            src={posterUrl}
            alt={movie.title}
            onError={() => setImageError(true)}
            loading="lazy"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isHovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.4s ease'
            }}
          />
        ) : (
          /* Stylized Fallback Placeholder */
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #262626 0%, #151515 100%)'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'rgba(229, 9, 20, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                color: 'var(--accent-primary)'
              }}
            >
              <Film size={26} />
            </div>
            <p
              style={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: '#ffffff',
                lineHeight: 1.3
              }}
            >
              {movie.title}
            </p>
          </div>
        )}

        {/* Top Floating Badges */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2
          }}
        >
          {movie.releaseYear && (
            <span
              className="badge badge-year"
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', backdropFilter: 'blur(4px)' }}
            >
              {movie.releaseYear}
            </span>
          )}

          {/* Bookmark Button */}
          <button
            onClick={handleBookmarkToggle}
            style={{
              width: '34px',
              height: '34px',
              minWidth: '34px',
              minHeight: '34px',
              borderRadius: '50%',
              backgroundColor: inWatchlist ? 'var(--accent-primary)' : 'rgba(0,0,0,0.65)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(6px)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            title={inWatchlist ? 'Remove from My List' : 'Add to My List'}
            aria-label={inWatchlist ? 'Remove from My List' : 'Add to My List'}
          >
            {inWatchlist ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>

        {/* Hover Overlay with Quick Play Button */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3,
            padding: '1rem'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/watch/${movie._id}`);
            }}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(229, 9, 20, 0.6)',
              transform: isHovered ? 'scale(1)' : 'scale(0.8)',
              transition: 'transform 0.25s ease, background-color 0.2s ease',
              marginBottom: '1rem'
            }}
            title="Stream Movie Now"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b80710')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-primary)')}
          >
            <Play size={24} fill="#ffffff" style={{ marginLeft: '3px' }} />
          </button>

          {/* Quick Action Icons Bar on Hover */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(20, 20, 20, 0.85)',
              padding: '0.35rem 0.6rem',
              borderRadius: '999px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => navigate(`/movie/${movie._id}`)}
              className="btn-icon"
              title="Details"
              style={{ width: '32px', height: '32px' }}
            >
              <Info size={15} />
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => navigate(`/edit/${movie._id}`)}
                  className="btn-icon"
                  title="Edit Movie"
                  style={{ width: '32px', height: '32px' }}
                >
                  <Edit size={14} />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(movie)}
                    className="btn-icon"
                    title="Delete Movie"
                    style={{ width: '32px', height: '32px', color: '#ff6b6b' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Watch Progress Underbar if movie was previously watched */}
        {watchProgress && watchProgress.percentage > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              zIndex: 4
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${watchProgress.percentage}%`,
                backgroundColor: 'var(--accent-primary)'
              }}
            />
          </div>
        )}
      </div>

      {/* Card Info Footer */}
      <div
        style={{
          padding: '0.75rem 0.85rem',
          backgroundColor: '#1b1b1b',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <h3
          style={{
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.3,
            marginBottom: '0.3rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={movie.title}
        >
          {movie.title}
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            gap: '0.4rem'
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {movie.genre || 'General'}
          </span>
          {movie.runtime && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
              <Clock size={11} />
              {formatMinutes(movie.runtime)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
