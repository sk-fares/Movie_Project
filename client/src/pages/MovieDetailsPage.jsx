import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Download,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  Calendar,
  HardDrive,
  FileVideo,
  Film
} from 'lucide-react';
import { movieApi, getPosterUrl, getDownloadUrl, formatBytes, formatMinutes } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

export const MovieDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await movieApi.getById(id);
        if (res.success) {
          setMovie(res.data);
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError(err.response?.data?.error || 'Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await movieApi.delete(id);
      navigate('/');
    } catch (err) {
      alert(`Failed to delete movie: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '100px', minHeight: '80vh' }}>
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
          <div className="skeleton" style={{ width: '320px', height: '480px', borderRadius: 'var(--radius-lg)' }} />
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ height: '40px', width: '60%' }} />
            <div className="skeleton" style={{ height: '24px', width: '30%' }} />
            <div className="skeleton" style={{ height: '120px', width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container" style={{ paddingTop: '120px', minHeight: '70vh', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>Movie Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {error || "The movie you are looking for doesn't exist or has been removed."}
        </p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={18} />
          Back to Movies
        </Link>
      </div>
    );
  }

  const posterUrl = getPosterUrl(movie.posterPath);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* Subtle Ambient Glow from Movie Poster */}
      {posterUrl && !imageError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '450px',
            backgroundImage: `url(${posterUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 20%',
            filter: 'blur(70px) brightness(0.22)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
      )}

      <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '100px' }}>
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline"
          style={{ marginBottom: '2rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Content Layout */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '3rem',
            alignItems: 'flex-start'
          }}
        >
          {/* Left Column: Poster (2:3 aspect ratio) */}
          <div
            style={{
              width: '100%',
              maxWidth: '340px',
              flexShrink: 0,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: '#1b1b1b',
              aspectRatio: '2/3',
              position: 'relative'
            }}
          >
            {posterUrl && !imageError ? (
              <img
                src={posterUrl}
                alt={movie.title}
                onError={() => setImageError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #262626 0%, #151515 100%)'
                }}
              >
                <Film size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{movie.title}</h3>
              </div>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Title */}
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-1px',
                  marginBottom: '1rem'
                }}
              >
                {movie.title}
              </h1>

              {/* Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                {movie.releaseYear && (
                  <span className="badge badge-year" style={{ fontSize: '0.85rem', padding: '0.3rem 0.7rem' }}>
                    <Calendar size={14} style={{ marginRight: '4px' }} />
                    {movie.releaseYear}
                  </span>
                )}
                {movie.genre && (
                  <span className="badge badge-accent" style={{ fontSize: '0.85rem', padding: '0.3rem 0.7rem' }}>
                    {movie.genre}
                  </span>
                )}
                {movie.runtime && (
                  <span className="badge badge-genre" style={{ fontSize: '0.85rem', padding: '0.3rem 0.7rem' }}>
                    <Clock size={14} style={{ marginRight: '4px' }} />
                    {formatMinutes(movie.runtime)}
                  </span>
                )}
                {movie.videoSize > 0 && (
                  <span className="badge badge-genre" style={{ fontSize: '0.85rem', padding: '0.3rem 0.7rem' }}>
                    <HardDrive size={14} style={{ marginRight: '4px' }} />
                    {formatBytes(movie.videoSize)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <Link
                to={`/watch/${movie._id}`}
                className="btn btn-primary"
                style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', fontWeight: 700 }}
              >
                <Play size={22} fill="#ffffff" />
                Watch Now
              </Link>

              <a
                href={getDownloadUrl(movie._id)}
                className="btn btn-secondary"
                style={{ padding: '0.85rem 1.6rem', fontSize: '1rem' }}
                title="Download original movie video file"
              >
                <Download size={18} />
                Download Movie
              </a>

              <Link
                to={`/edit/${movie._id}`}
                className="btn btn-outline"
                style={{ padding: '0.85rem 1.25rem' }}
                title="Edit Movie Details"
              >
                <Edit size={18} />
                Edit
              </Link>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-outline"
                style={{ padding: '0.85rem 1.25rem', color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.3)' }}
                title="Delete Movie"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Synopsis */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem', color: '#ffffff' }}>
                Overview
              </h3>
              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                  maxWidth: '750px'
                }}
              >
                {movie.description || 'No description provided for this movie.'}
              </p>
            </div>

            {/* Technical File Metadata Panel */}
            <div
              style={{
                backgroundColor: '#1c1c1c',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginTop: '1rem',
                maxWidth: '650px'
              }}
            >
              <h4
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'var(--text-muted)',
                  marginBottom: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <FileVideo size={16} /> File Details
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Format / MIME: </span>
                  <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>{movie.videoMimeType || 'video/mp4'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Stored File: </span>
                  <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>{movie.videoPath}</span>
                </div>
                {movie.videoOriginalName && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Original Name: </span>
                    <span style={{ color: '#ffffff' }}>{movie.videoOriginalName}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Added On: </span>
                  <span style={{ color: '#ffffff' }}>
                    {movie.createdAt ? new Date(movie.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title={`Delete "${movie.title}"?`}
        message="This will delete this movie entry and permanently remove the video and poster files from disk."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        loading={isDeleting}
      />
    </div>
  );
};
