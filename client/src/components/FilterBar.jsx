import React from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

const DEFAULT_GENRES = [
  'All',
  'Action',
  'Sci-Fi',
  'Drama',
  'Comedy',
  'Horror',
  'Thriller',
  'Documentary',
  'Adventure',
  'Animation'
];

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  sortBy,
  onSortChange,
  availableGenres = [],
  totalCount = 0
}) => {
  // Merge default genres with any custom genres in user's library
  const combinedGenres = Array.from(new Set([...DEFAULT_GENRES, ...availableGenres]));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}
    >
      {/* Top Controls Row: Search Input and Sort Selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        {/* Search Input */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 300px',
            maxWidth: '500px'
          }}
        >
          <Search
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
            placeholder="Search by movie title, genre, synopsis..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#1c1c1c',
              border: '1px solid #303030',
              borderRadius: 'var(--radius-full)',
              color: '#ffffff',
              padding: '0.65rem 2.5rem 0.65rem 2.6rem',
              fontSize: '0.92rem',
              outline: 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(229, 9, 20, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#303030';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sort and Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <ArrowUpDown size={16} />
            <span style={{ fontSize: '0.85rem' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              style={{
                backgroundColor: '#1c1c1c',
                border: '1px solid #303030',
                borderRadius: 'var(--radius-sm)',
                color: '#ffffff',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="newest">Recently Added</option>
              <option value="oldest">Oldest Added</option>
              <option value="title_asc">Title (A - Z)</option>
              <option value="title_desc">Title (Z - A)</option>
              <option value="year_desc">Year (Newest First)</option>
              <option value="year_asc">Year (Oldest First)</option>
            </select>
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '0.45rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            {totalCount} {totalCount === 1 ? 'Movie' : 'Movies'}
          </div>
        </div>
      </div>

      {/* Genre Pills Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {combinedGenres.map((genre) => {
          const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase();
          return (
            <button
              key={genre}
              onClick={() => onGenreChange(genre)}
              style={{
                padding: '0.45rem 1.1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: isSelected ? 700 : 500,
                backgroundColor: isSelected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isSelected ? '0 2px 10px rgba(229, 9, 20, 0.35)' : 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
};
