import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Download,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture,
  Settings,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { movieApi, getStreamUrl, getDownloadUrl } from '../services/api';
import { clearWatchProgress } from '../services/storage';
import { useAuth } from '../context/AuthContext';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

const QUALITY_OPTIONS = [
  { label: 'Auto (Original)', value: 'auto' },
  { label: '1080p FHD', value: '1080p' },
  { label: '720p HD', value: '720p' },
  { label: '480p SD (Data Saver)', value: '480p' },
  { label: '360p Low', value: '360p' }
];

export const getEmbedPlayerUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  // Google Drive preview embed
  const gdriveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
  }
  // Archive.org details -> embed
  if (url.includes('archive.org/details/')) {
    return url.replace('archive.org/details/', 'archive.org/embed/');
  }
  if (url.includes('archive.org/embed/')) {
    return url;
  }
  // YouTube embed
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1`;
  }
  return null;
};

export const VideoPlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMovieProgress, updateWatchProgress } = useAuth();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideControlsTimeout = useRef(null);

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoBuffering, setVideoBuffering] = useState(true);
  const [playbackError, setPlaybackError] = useState(null);
  const [showControls, setShowControls] = useState(true);

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Quality State
  const [quality, setQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const pendingSeekTime = useRef(null);

  // Resume prompt state
  const [resumePrompt, setResumePrompt] = useState(null);

  // Keep stable references to avoid re-triggering effects
  const getMovieProgressRef = useRef(getMovieProgress);
  getMovieProgressRef.current = getMovieProgress;
  const updateProgressRef = useRef(updateWatchProgress);
  updateProgressRef.current = updateWatchProgress;

  // Fetch movie metadata once per movie ID
  useEffect(() => {
    let isMounted = true;
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const res = await movieApi.getById(id);
        if (isMounted && res.success) {
          setMovie(res.data);

          // Check saved watch progress once on initial load
          const saved = getMovieProgressRef.current(id);
          if (saved && saved.currentTime > 10 && saved.currentTime < (saved.duration - 15)) {
            setResumePrompt(saved.currentTime);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load movie for player:', err);
          setPlaybackError('Could not find movie record or video file.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMovie();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Periodic progress saving on a steady interval without restarting
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && videoRef.current.duration) {
        updateProgressRef.current(id, videoRef.current.currentTime, videoRef.current.duration);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (videoRef.current && videoRef.current.duration) {
        updateProgressRef.current(id, videoRef.current.currentTime, videoRef.current.duration);
      }
    };
  }, [id]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Controls auto-hiding
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }
    }, 3500);
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ': // Space: toggle play
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight': // Seek +10s
          e.preventDefault();
          seekBy(10);
          break;
        case 'ArrowLeft': // Seek -10s
          e.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowUp': // Volume +10%
          e.preventDefault();
          changeVolume(Math.min(video.volume + 0.1, 1));
          break;
        case 'ArrowDown': // Volume -10%
          e.preventDefault();
          changeVolume(Math.max(video.volume - 0.1, 0));
          break;
        case 'f':
        case 'F': // Fullscreen
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M': // Mute
          e.preventDefault();
          toggleMute();
          break;
        case 'p':
        case 'P': // Picture-in-Picture
          e.preventDefault();
          togglePiP();
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
  }, [volume, isMuted]);

  // Controls actions
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(handleVideoError);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
      updateWatchProgress(id, video.currentTime, video.duration);
    }
  };

  const seekBy = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.max(0, Math.min(video.currentTime + seconds, video.duration || 0));
    video.currentTime = target;
    setCurrentTime(target);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(clickX / rect.width, 1));
    const newTime = percentage * video.duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeVolume = (val) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    setVolume(val);
    if (val === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRateChange = (rate) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const handleQualityChange = (newQuality) => {
    if (newQuality === quality) {
      setShowQualityMenu(false);
      return;
    }
    if (videoRef.current) {
      pendingSeekTime.current = videoRef.current.currentTime;
    }
    setQuality(newQuality);
    setShowQualityMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP not available:', err);
    }
  };

  const applyResume = () => {
    if (videoRef.current && resumePrompt) {
      videoRef.current.currentTime = resumePrompt;
      videoRef.current.play().catch(() => {});
    }
    setResumePrompt(null);
  };

  const dismissResume = () => {
    clearWatchProgress(id);
    setResumePrompt(null);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVideoError = (e) => {
    console.error('Video playback error:', e);
    const mediaError = videoRef.current?.error;
    const isMkv =
      movie?.videoOriginalName?.toLowerCase().endsWith('.mkv') ||
      movie?.videoPath?.toLowerCase().endsWith('.mkv') ||
      movie?.videoMimeType?.includes('matroska');

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
          message = isMkv
            ? 'The video could not be decoded. Web browsers cannot decode .mkv or DTS/AC3 audio tracks natively. Please convert or re-upload as an MP4 (H.264 / AAC) file.'
            : 'The video could not be decoded. Your browser might not support this specific video or audio codec.';
          break;
        case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          if (isMkv) {
            message = 'Browser codec not supported: Web browsers (Chrome, Edge, Safari, iOS) cannot play .mkv video containers. Please re-upload as standard .mp4, or provide a direct MP4 streaming link.';
          } else if (movie?.storageType === 'local') {
            message = 'Video file not found on server storage. If hosted on a free cloud platform (like Render), local files are temporary and cleared on sleep. Please use a permanent Direct Video URL (Archive.org, Cloudinary, etc.).';
          } else {
            message = 'Video source not supported or video file could not be found.';
          }
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

  const embedUrl = movie?.videoPath ? getEmbedPlayerUrl(movie.videoPath) : null;
  const streamUrl = getStreamUrl(id, quality);
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Top Floating Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1.25rem 2rem',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
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
              padding: '0.55rem 1rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <ArrowLeft size={18} />
            <span>Back to Movies</span>
          </button>

          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
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
              padding: '0.55rem 1rem',
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

      {/* Resume Playback Prompt Banner */}
      {!embedUrl && resumePrompt && (
        <div
          style={{
            position: 'absolute',
            top: '85px',
            zIndex: 25,
            backgroundColor: 'rgba(25, 25, 25, 0.95)',
            border: '1px solid rgba(229, 9, 20, 0.5)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow-lg)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontSize: '0.9rem' }}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <span>Resume from {formatTime(resumePrompt)}?</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={applyResume}
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
            >
              Resume
            </button>
            <button
              onClick={dismissResume}
              className="btn btn-outline"
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Buffering Indicator */}
      {!embedUrl && videoBuffering && !playbackError && (
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
      {!embedUrl && playbackError && (
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

      {/* Video Stream: Embed Player (Google Drive / Archive.org) or Native HTML5 Video */}
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={movie?.title || 'Video Player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000000',
            zIndex: 5
          }}
        />
      ) : (
        <>
          {/* Native HTML5 Video Element */}
          <video
        ref={videoRef}
        src={streamUrl}
        autoPlay
        playsInline
        preload="auto"
        onClick={togglePlay}
        onLoadedMetadata={() => {
          if (pendingSeekTime.current !== null && videoRef.current) {
            videoRef.current.currentTime = pendingSeekTime.current;
            pendingSeekTime.current = null;
            if (isPlaying) videoRef.current.play().catch(() => {});
          }
        }}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onDurationChange={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
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
          cursor: showControls ? 'default' : 'none'
        }}
      />

      {/* Custom Bottom Controls Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1.5rem 2rem 1.25rem 2rem',
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      >
        {/* Scrubber Progress Bar */}
        <div
          onClick={handleSeek}
          style={{
            position: 'relative',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '3px',
            cursor: 'pointer',
            transition: 'height 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.height = '10px')}
          onMouseLeave={(e) => (e.currentTarget.style.height = '6px')}
        >
          {/* Active progress */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${progressPercent}%`,
              backgroundColor: 'var(--accent-primary)',
              borderRadius: '3px'
            }}
          />
          {/* Thumb marker */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${progressPercent}%`,
              transform: 'translate(-50%, -50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 6px rgba(0,0,0,0.6)'
            }}
          />
        </div>

        {/* Buttons Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="btn-icon"
              style={{ width: '40px', height: '40px', backgroundColor: 'transparent' }}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={24} fill="#ffffff" /> : <Play size={24} fill="#ffffff" />}
            </button>

            {/* Seek -10s */}
            <button
              onClick={() => seekBy(-10)}
              className="btn-icon"
              style={{ width: '36px', height: '36px', backgroundColor: 'transparent' }}
              title="Seek back 10s (Left Arrow)"
            >
              <RotateCcw size={20} />
            </button>

            {/* Seek +10s */}
            <button
              onClick={() => seekBy(10)}
              className="btn-icon"
              style={{ width: '36px', height: '36px', backgroundColor: 'transparent' }}
              title="Seek forward 10s (Right Arrow)"
            >
              <RotateCw size={20} />
            </button>

            {/* Volume Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={toggleMute}
                className="btn-icon"
                style={{ width: '36px', height: '36px', backgroundColor: 'transparent' }}
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                style={{
                  width: '75px',
                  height: '4px',
                  accentColor: 'var(--accent-primary)',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Time Display */}
            <div style={{ fontSize: '0.85rem', color: '#e5e5e5', fontFamily: 'monospace' }}>
              <span>{formatTime(currentTime)}</span>
              <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
              <span style={{ color: 'var(--text-secondary)' }}>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
            {/* Speed Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="btn-icon"
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: 'transparent'
                }}
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '45px',
                    right: 0,
                    backgroundColor: '#1f1f1f',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 30
                  }}
                >
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      style={{
                        padding: '0.35rem 0.8rem',
                        fontSize: '0.8rem',
                        borderRadius: '4px',
                        color: playbackRate === rate ? 'var(--accent-primary)' : '#ffffff',
                        backgroundColor: playbackRate === rate ? 'rgba(229, 9, 20, 0.15)' : 'transparent',
                        textAlign: 'left'
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Resolution Selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
                className="btn-icon"
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: quality !== 'auto' ? 'rgba(229, 9, 20, 0.2)' : 'transparent',
                  color: quality !== 'auto' ? '#ff6b6b' : '#ffffff',
                  border: quality !== 'auto' ? '1px solid rgba(229, 9, 20, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
                title="Change Video Quality / Resolution"
              >
                <SlidersHorizontal size={14} />
                <span>{quality === 'auto' ? 'AUTO' : quality.toUpperCase()}</span>
              </button>

              {showQualityMenu && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '45px',
                    right: 0,
                    backgroundColor: '#1f1f1f',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 30,
                    minWidth: '170px'
                  }}
                >
                  <div
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Quality / Resolution
                  </div>
                  {QUALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleQualityChange(opt.value)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.8rem',
                        borderRadius: '4px',
                        color: quality === opt.value ? 'var(--accent-primary)' : '#ffffff',
                        backgroundColor: quality === opt.value ? 'rgba(229, 9, 20, 0.15)' : 'transparent',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{opt.label}</span>
                      {quality === opt.value && <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="btn-icon"
              style={{ width: '36px', height: '36px', backgroundColor: 'transparent' }}
              title="Picture in Picture (P)"
            >
              <PictureInPicture size={19} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="btn-icon"
              style={{ width: '36px', height: '36px', backgroundColor: 'transparent' }}
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </>
  )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
