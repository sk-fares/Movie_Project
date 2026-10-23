import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Download,
  Loader2,
  Film
} from 'lucide-react';
import { movieApi, getStreamUrl, getDownloadUrl } from '../services/api';

export const VideoPlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoBuffering, setVideoBuffering] = useState(true);
  const [playbackError, setPlaybackError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef(null);

  // Fetch movie metadata
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const res = await movieApi.getById(id);
        if (res.success) {
          setMovie(res.data);
        }
      } catch (err) {
        console.error('Failed to load movie for player:', err);
        setPlaybackError('Could not find movie record or video file.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Handle overlay auto-hide when mouse is stationary
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3500);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ': // Space: Play/Pause
          e.preventDefault();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;
        case 'ArrowRight': // Seek forward 10s
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 10, video.duration || 0);
          break;
        case 'ArrowLeft': // Seek backward 10s
          e.preventDefault();
          video.currentTime = Math.max(video.currentTime - 10, 0);
          break;
        case 'ArrowUp': // Volume +10%
          e.preventDefault();
          video.volume = Math.min(video.volume + 0.1, 1);
          break;
        case 'ArrowDown': // Volume -10%
          e.preventDefault();
          video.volume = Math.max(video.volume - 0.1, 0);
          break;
        case 'f':
        case 'F': // Fullscreen toggle
          e.preventDefault();
          if (!document.fullscreenElement) {
            video.parentElement?.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
          break;
        case 'm':
        case 'M': // Mute toggle
          e.preventDefault();
          video.muted = !video.muted;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, []);

  const handleVideoError = (e) => {
    console.error('Video playback error:', e);
    const mediaError = videoRef.current?.error;
    let message = 'Failed to play video. The file might be corrupted or in an unsupported codec.';
    if (mediaError) {
      switch (mediaError.code) {
        case mediaError.MEDIA_ERR_ABORTED:
          message = 'Video playback was aborted.';
          break;
        case mediaError.MEDIA_ERR_NETWORK:
          message = 'A network error caused the video download to fail.';
          break;
        case mediaError.MEDIA_ERR_DECODE:
          message = 'The video could not be decoded. Your browser might not support this specific video/audio codec.';
          break;
        case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = 'Video source not supported or video file could not be found on the server.';
          break;
        default:
          break;
      }
    }
    setPlaybackError(message);
    setVideoBuffering(false);
  };

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          backgroundColor: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}
      >
        <Loader2 size={44} className="spin" style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Loading theater mode...</p>
      </div>
    );
  }

  const streamUrl = getStreamUrl(id);

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Top Floating Control Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1.5rem 2rem',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            onClick={() => navigate(`/movie/${id}`)}
            className="btn btn-secondary"
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <ArrowLeft size={18} />
            <span>Back to Movies</span>
          </button>

          <div>
            <h1
              style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.2
              }}
            >
              {movie?.title || 'Watch Movie'}
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
              {movie?.releaseYear && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{movie.releaseYear}</span>
              )}
              {movie?.genre && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• {movie.genre}</span>
              )}
            </div>
          </div>
        </div>

        <div>
          <a
            href={getDownloadUrl(id)}
            className="btn btn-secondary"
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.85rem'
            }}
            title="Download video file to device"
          >
            <Download size={16} />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Buffering Indicator */}
      {videoBuffering && !playbackError && (
        <div
          style={{
            position: 'absolute',
            zIndex: 15,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            padding: '1.25rem 2rem',
            borderRadius: 'var(--radius-md)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '3px solid rgba(229, 9, 20, 0.25)',
              borderTopColor: 'var(--accent-primary)',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <span style={{ fontSize: '0.9rem', color: '#e5e5e5', fontWeight: 500 }}>
            Streaming video...
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {playbackError && (
        <div
          style={{
            position: 'absolute',
            zIndex: 25,
            maxWidth: '520px',
            padding: '2.5rem',
            backgroundColor: 'rgba(25, 25, 25, 0.95)',
            border: '1px solid rgba(229, 9, 20, 0.5)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(229, 9, 20, 0.15)',
              color: 'var(--accent-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}
          >
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Playback Issue
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
            {playbackError}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button onClick={() => navigate(`/movie/${id}`)} className="btn btn-secondary">
              Back to Details
            </button>
            <a href={getDownloadUrl(id)} className="btn btn-primary">
              <Download size={18} />
              Download Video File
            </a>
          </div>
        </div>
      )}

      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={streamUrl}
        controls
        autoPlay
        playsInline
        preload="auto"
        onWaiting={() => setVideoBuffering(true)}
        onPlaying={() => setVideoBuffering(false)}
        onCanPlay={() => setVideoBuffering(false)}
        onError={handleVideoError}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100vh',
          objectFit: 'contain',
          backgroundColor: '#000000',
          outline: 'none'
        }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
