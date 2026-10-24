import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Download, Sparkles, Film, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { getPosterUrl, getDownloadUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AUTO_SLIDE_INTERVAL_MS = 5000;

export const HeroBanner = ({ banners = [], movies = [], onOpenAdmin }) => {
  const { isOwner } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  // Build slides from custom banners or fallback to top movies in the library
  const slides = React.useMemo(() => {
    if (banners && banners.length > 0) {
      return banners.map((b) => {
        const movieObj = b.movie && typeof b.movie === 'object' ? b.movie : null;
        const movieId = movieObj ? movieObj._id : b.movie;
        let formattedImage = b.imageUrl;
        if (formattedImage && !formattedImage.startsWith('http://') && !formattedImage.startsWith('https://')) {
          formattedImage = getPosterUrl(formattedImage.replace(/^\/?uploads\/posters\//, ''));
        }
        return {
          id: b._id,
          title: b.title,
          tagline: b.tagline || 'Featured',
          description: b.description || (movieObj ? movieObj.description : ''),
          imageUrl: formattedImage,
          watchUrl: b.linkUrl || (movieId ? `/watch/${movieId}` : null),
          infoUrl: movieId ? `/movie/${movieId}` : null,
          downloadUrl: movieId ? getDownloadUrl(movieId) : null
        };
      });
    }

    if (movies && movies.length > 0) {
      return movies.slice(0, 5).map((m) => ({
        id: m._id,
        title: m.title,
        tagline: `${m.genre || 'Action'} • ${m.releaseYear || ''}`,
        description: m.description,
        imageUrl: getPosterUrl(m.posterPath),
        watchUrl: `/watch/${m._id}`,
        infoUrl: `/movie/${m._id}`,
        downloadUrl: getDownloadUrl(m._id)
      }));
    }

    return [];
  }, [banners, movies]);

  // Keep index within bounds if slide count changes
  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Auto-sliding interval with pause on hover
  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, AUTO_SLIDE_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isHovered]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) {
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
            {isOwner && (
              <Link to="/add" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }}>
                <Film size={20} />
                Add Your First Movie
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        minHeight: '78vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '80px',
        paddingBottom: '60px',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Ambient Cinema Gradient Backdrop (shows if image fails or is loading) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 75% 35%, rgba(229, 9, 20, 0.22) 0%, rgba(26, 26, 26, 0.95) 60%, #141414 100%)',
          zIndex: 0
        }}
      />

      {/* Background Images Layer with smooth transition */}
      {slides.map((slide, idx) => {
        const isCurrent = idx === currentIndex;
        return (
          <div
            key={slide.id || idx}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: slide.imageUrl ? `url(${slide.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center 25%',
              filter: 'brightness(0.65)',
              transform: isCurrent ? 'scale(1)' : 'scale(1.04)',
              opacity: isCurrent ? 1 : 0,
              transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s ease',
              zIndex: 0
            }}
          />
        );
      })}

      {/* Cinematic Vignette Overlays */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(to right, #141414 18%, rgba(20, 20, 20, 0.85) 50%, rgba(20, 20, 20, 0.2) 100%),
            linear-gradient(to top, #141414 10%, transparent 60%)
          `,
          zIndex: 1
        }}
      />

      {/* Slide Content */}
      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '850px',
          marginLeft: '0'
        }}
      >
        {/* Top Tagline & Admin Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--accent-primary)',
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}
          >
            <Sparkles size={16} />
            <span>{currentSlide.tagline || 'Featured'}</span>
          </div>

          {/* Quick Admin Carousel Manager Trigger for Owner */}
          {isOwner && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="btn btn-outline"
              style={{
                padding: '0.2rem 0.6rem',
                fontSize: '0.75rem',
                borderRadius: '999px',
                borderColor: 'rgba(229, 9, 20, 0.4)',
                color: '#ff9999',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
              title="Manage hero slides, thumbnails, and headlines"
            >
              <Settings size={12} />
              <span>Carousel Manager</span>
            </button>
          )}
        </div>

        {/* Title */}
        <h1
          key={`title-${currentIndex}`}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '1rem',
            letterSpacing: '-1.5px',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.85)',
            animation: 'fadeInUp 0.4s ease'
          }}
        >
          {currentSlide.title}
        </h1>

        {/* Synopsis */}
        <p
          key={`desc-${currentIndex}`}
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
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)',
            animation: 'fadeInUp 0.5s ease'
          }}
        >
          {currentSlide.description || 'Watch now in high definition on CineVault.'}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.85rem' }}>
          {currentSlide.watchUrl && (
            <Link
              to={currentSlide.watchUrl}
              className="btn btn-primary"
              style={{ padding: '0.85rem 2rem', fontSize: '1rem', fontWeight: 700 }}
            >
              <Play size={20} fill="#ffffff" />
              Watch Now
            </Link>
          )}

          {currentSlide.infoUrl && (
            <Link
              to={currentSlide.infoUrl}
              className="btn btn-secondary"
              style={{ padding: '0.85rem 1.5rem', fontSize: '1rem' }}
            >
              <Info size={20} />
              More Info
            </Link>
          )}

          {currentSlide.downloadUrl && (
            <a
              href={currentSlide.downloadUrl}
              className="btn btn-outline"
              style={{ padding: '0.85rem 1.25rem' }}
              title="Download Movie"
            >
              <Download size={18} />
            </a>
          )}
        </div>
      </div>

      {/* Manual Slide Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              backdropFilter: 'blur(6px)',
              transition: 'all 0.2s ease',
              opacity: isHovered ? 1 : 0.6
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(229, 9, 20, 0.7)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)')}
            title="Previous Slide"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              backdropFilter: 'blur(6px)',
              transition: 'all 0.2s ease',
              opacity: isHovered ? 1 : 0.6
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(229, 9, 20, 0.7)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)')}
            title="Next Slide"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Slide Indicators / Pill Bar (Bottom Right) */}
      {slides.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '25px',
            right: '40px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {slides.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                style={{
                  height: '4px',
                  width: isActive ? '32px' : '14px',
                  borderRadius: '2px',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.35)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? '0 0 10px rgba(229, 9, 20, 0.8)' : 'none'
                }}
                title={`Go to slide ${idx + 1}`}
              />
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};
