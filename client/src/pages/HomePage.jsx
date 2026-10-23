import React, { useState, useEffect, useMemo } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { FilterBar } from '../components/FilterBar';
import { MovieGrid } from '../components/MovieGrid';
import { ConfirmModal } from '../components/ConfirmModal';
import { movieApi } from '../services/api';
import { Clapperboard, Sparkles, Layers } from 'lucide-react';

export const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Deletion modal state
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all movies from backend
  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await movieApi.getAll();
      if (res.success) {
        setMovies(res.data);
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load movie library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // Compute unique genres across the collection
  const availableGenres = useMemo(() => {
    const set = new Set();
    movies.forEach((m) => {
      if (m.genre) {
        m.genre.split(',').forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [movies]);

  // Frontend search, filter, and sorting
  const filteredMovies = useMemo(() => {
    let result = [...movies];

    // Search query filter (title, description, genre)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.genre && m.genre.toLowerCase().includes(q))
      );
    }

    // Genre filter
    if (selectedGenre && selectedGenre !== 'All') {
      result = result.filter(
        (m) => m.genre && m.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title_desc') {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === 'year_desc') {
        return (b.releaseYear || 0) - (a.releaseYear || 0);
      }
      if (sortBy === 'year_asc') {
        return (a.releaseYear || 0) - (b.releaseYear || 0);
      }
      return 0;
    });

    return result;
  }, [movies, searchQuery, selectedGenre, sortBy]);

  // The featured movie is the most recently added or first
  const featuredMovie = movies.length > 0 ? movies[0] : null;

  // Handle deletion confirmation
  const handleDeleteConfirm = async () => {
    if (!movieToDelete) return;
    try {
      setIsDeleting(true);
      await movieApi.delete(movieToDelete._id);
      setMovies((prev) => prev.filter((m) => m._id !== movieToDelete._id));
      setMovieToDelete(null);
    } catch (err) {
      alert(`Failed to delete movie: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('All');
  };

  const isFiltered = searchQuery.trim() !== '' || selectedGenre !== 'All';

  return (
    <div>
      {/* Featured Cinematic Hero Section */}
      <HeroBanner movie={featuredMovie} />

      {/* Main Content Area */}
      <div id="movies" className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        {error && (
          <div
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: 'rgba(229, 9, 20, 0.15)',
              border: '1px solid rgba(229, 9, 20, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#ff6b6b',
              marginBottom: '2rem'
            }}
          >
            <strong>Error loading library:</strong> {error}
          </div>
        )}

        {/* Section Heading */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.25rem'
          }}
        >
          <Layers size={22} color="var(--accent-primary)" />
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.6rem',
              fontWeight: 800,
              letterSpacing: '-0.5px'
            }}
          >
            Explore Library
          </h2>
        </div>

        {/* Search, Filter Pills & Sort Controls */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          sortBy={sortBy}
          onSortChange={setSortBy}
          availableGenres={availableGenres}
          totalCount={filteredMovies.length}
        />

        {/* Responsive Movie Grid */}
        <MovieGrid
          movies={filteredMovies}
          loading={loading}
          isFiltered={isFiltered}
          onResetFilters={handleResetFilters}
          onDelete={(m) => setMovieToDelete(m)}
        />
      </div>

      {/* Deletion Confirmation Dialog */}
      <ConfirmModal
        isOpen={!!movieToDelete}
        title={`Delete "${movieToDelete?.title}"?`}
        message="This action will permanently delete this movie record from MongoDB and delete the video and poster files from your local disk. This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setMovieToDelete(null)}
        loading={isDeleting}
      />
    </div>
  );
};
