import React, { useState, useEffect } from 'react';
import { X, HardDrive, Film, Clock, Tags, Folder, AlertCircle } from 'lucide-react';
import { movieApi, formatBytes, formatMinutes } from '../services/api';

export const StatsModal = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      movieApi
        .getStats()
        .then((res) => {
          if (res.success) {
            setStats(res.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load library stats', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(229, 9, 20, 0.15)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HardDrive size={20} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Library Overview & Storage</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading statistics...
          </div>
        ) : stats ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Stat Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '1rem'
              }}
            >
              {/* Movies Count */}
              <div
                style={{
                  backgroundColor: '#262626',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <Film size={14} /> Total Movies
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                  {stats.totalMovies}
                </div>
              </div>

              {/* Disk Space Used */}
              <div
                style={{
                  backgroundColor: '#262626',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <HardDrive size={14} /> Disk Storage
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {formatBytes(stats.totalStorageBytes)}
                </div>
              </div>

              {/* Total Watch Time */}
              <div
                style={{
                  backgroundColor: '#262626',
                  padding: '1.1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <Clock size={14} /> Total Runtime
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                  {formatMinutes(stats.totalRuntimeMinutes) || '0m'}
                </div>
              </div>
            </div>

            {/* Storage Locations */}
            <div
              style={{
                backgroundColor: '#1a1a1a',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.6rem', color: 'var(--text-secondary)' }}>
                <Folder size={16} /> Storage Path Configuration
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                <div><span style={{ color: '#ffffff' }}>Videos:</span> {stats.storagePaths?.videos || 'server/uploads/videos'}</div>
                <div><span style={{ color: '#ffffff' }}>Posters:</span> {stats.storagePaths?.posters || 'server/uploads/posters'}</div>
              </div>
            </div>

            {/* Genres Tag List */}
            {stats.genres && stats.genres.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <Tags size={15} /> Active Genres in Collection
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {stats.genres.map((g) => (
                    <span key={g} className="badge badge-genre" style={{ fontSize: '0.75rem' }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Config Notice */}
            <div
              style={{
                display: 'flex',
                gap: '0.6rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 160, 10, 0.1)',
                border: '1px solid rgba(255, 160, 10, 0.25)',
                color: '#ffa00a',
                fontSize: '0.8rem',
                lineHeight: 1.4
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                To adjust the upload size limit for 4K / ultra-large movie files, configure the{' '}
                <code>MAX_FILE_SIZE_MB</code> variable in <code>server/.env</code>.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Failed to load stats.
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
