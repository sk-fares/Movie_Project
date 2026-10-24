import React from 'react';
import { Link } from 'react-router-dom';
import { MovieCard } from './MovieCard';
import { Film, Plus, SearchX, RefreshCw } from 'lucide-react';

export const MovieGrid = ({
  movies = [],
  loading = false,
  isFiltered = false,
  onResetFilters,
  onDelete
}) => {
  // Loading Skeleton
  if (loading) {
    return (
      <div className="movie-grid" style={{ marginBottom: '3rem' }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundColor: '#1b1b1b',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="skeleton" style={{ paddingTop: '150%', width: '100%' }} />
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="skeleton" style={{ height: '18px', width: '75%', borderRadius: '4px' }} />
              <div className="skeleton" style={{ height: '14px', width: '45%', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filtered empty state
  if (movies.length === 0 && isFiltered) {
    return (
      <div
        style={{
          padding: '4rem 1.5rem',
          textAlign: 'center',
          backgroundColor: '#181818',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
          margin: '2rem 0'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            color: 'var(--text-muted)'
          }}
        >
          <SearchX size={32} />
        </div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          No Matching Movies Found
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
          We couldn't find any movies in your collection matching your search or active genre filters.
        </p>
        <button onClick={onResetFilters} className="btn btn-outline">
          <RefreshCw size={16} />
          Reset Search & Filters
        </button>
      </div>
    );
  }

  // Completely empty library state
  if (movies.length === 0) {
    return (
      <div
        style={{
          padding: '5rem 1.5rem',
          textAlign: 'center',
          backgroundColor: '#181818',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          margin: '2rem 0'
        }}
      >
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            backgroundColor: 'rgba(229, 9, 20, 0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            color: 'var(--accent-primary)'
          }}
        >
          <Film size={38} />
        </div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: 800,
            marginBottom: '0.75rem'
          }}
        >
          Your Movie Library is Empty
        </h3>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            maxWidth: '500px',
            margin: '0 auto 2rem auto',
            lineHeight: 1.6
          }}
        >
          You haven't added any movies yet. Upload your legally owned movie files and custom poster
          art to begin building your private cinema.
        </p>
        <Link to="/add" className="btn btn-primary" style={{ padding: '0.75rem 1.8rem', fontSize: '1rem' }}>
          <Plus size={20} />
          Add Your First Movie
        </Link>
      </div>
    );
  }

  // Standard Movie Grid
  return (
    <div className="movie-grid" style={{ marginBottom: '3.5rem' }}>
      {movies.map((movie) => (
        <MovieCard key={movie._id} movie={movie} onDelete={onDelete} />
      ))}
    </div>
  );
};
