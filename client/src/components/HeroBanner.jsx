import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Download, Sparkles, Film } from 'lucide-react';
import { getPosterUrl, getDownloadUrl, formatMinutes } from '../services/api';

export const HeroBanner = ({ movie }) => {
  if (!movie) {
    return (
      <section
        style={{
          position: 'relative',
          paddingTop: '120px',
          paddingBottom: '80px',
          background: 'linear-gradient(180deg, rgba(229, 9, 20, 0.08) 0%, rgba(20, 20, 20, 1) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="container" style={{ textAlign: 'center', maxWidth: '750px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(229, 9, 20, 0.15)',
              border: '1px solid rgba(229, 9, 20, 0.3)',
              color: '#ff6b6b',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}
          >
            <Sparkles size={16} />
            <span>Welcome to CineVault</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1rem',
              letterSpacing: '-1px'
            }}
          >
            Your Private Cinema, Streamed Locally.
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '2rem'
            }}
          >
            Catalog your personal movie collection, stream with fast seeking right in your browser,
            and download your movies anytime.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/add" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}>
              <Film size={20} />
              Add Your First Movie
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const posterBg = getPosterUrl(movie.posterPath);

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '80px',
        paddingBottom: '60px',
        overflow: 'hidden'
      }}
    >
      {/* Background Poster with Cinematic Gradient Overlays */}
      {posterBg && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${posterBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            filter: 'brightness(0.65)',
            transform: 'scale(1.02)',
            zIndex: 0
          }}
        />
      )}

      {/* Cinematic Vignette Overlays */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(to right, #141414 15%, rgba(20, 20, 20, 0.8) 50%, rgba(20, 20, 20, 0.3) 100%),
            linear-gradient(to top, #141414 8%, transparent 60%)
          `,
          zIndex: 1
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '850px', marginLeft: '0' }}>
        {/* Featured Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginBottom: '0.75rem',
            color: 'var(--accent-primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}
        >
          <Sparkles size={16} />
          Featured Movie
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '1rem',
            letterSpacing: '-1.5px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)'
          }}
        >
          {movie.title}
        </h1>

        {/* Metadata Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem',
            marginBottom: '1.25rem'
          }}
        >
          {movie.releaseYear && <span className="badge badge-year">{movie.releaseYear}</span>}
          {movie.genre && <span className="badge badge-accent">{movie.genre}</span>}
          {movie.runtime && (
            <span className="badge badge-genre">{formatMinutes(movie.runtime)}</span>
          )}
          <span className="badge badge-genre" style={{ color: '#46d369', borderColor: 'rgba(70, 211, 105, 0.3)' }}>
            1080p HD
          </span>
        </div>

        {/* Synopsis */}
        <p
          style={{
            fontSize: '1.05rem',
            color: '#e5e5e5',
            lineHeight: 1.6,
            marginBottom: '2rem',
            maxWidth: '650px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)'
          }}
        >
          {movie.description || 'No description available for this movie.'}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.85rem' }}>
          <Link
            to={`/watch/${movie._id}`}
            className="btn btn-primary"
            style={{ padding: '0.8rem 1.8rem', fontSize: '1rem', fontWeight: 700 }}
          >
            <Play size={20} fill="#ffffff" />
            Watch Now
          </Link>

          <Link
            to={`/movie/${movie._id}`}
            className="btn btn-secondary"
            style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}
          >
            <Info size={20} />
            More Info
          </Link>

          <a
            href={getDownloadUrl(movie._id)}
            className="btn btn-outline"
            style={{ padding: '0.8rem 1.25rem' }}
            title="Download Movie"
          >
            <Download size={18} />
          </a>
        </div>
      </div>
    </section>
  );
};
