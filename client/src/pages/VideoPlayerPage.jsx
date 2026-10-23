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
  Sparkles
} from 'lucide-react';
import { movieApi, getStreamUrl, getDownloadUrl } from '../services/api';
import { saveWatchProgress, getWatchProgress, clearWatchProgress } from '../services/storage';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const VideoPlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // Resume prompt state
  const [resumePrompt, setResumePrompt] = useState(null);

  // Fetch movie metadata
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const res = await movieApi.getById(id);
        if (res.success) {
          setMovie(res.data);
          
          // Check saved watch progress
          const saved = getWatchProgress(id);
          if (saved && saved.currentTime > 10 && saved.currentTime < (saved.duration - 15)) {
            setResumePrompt(saved.currentTime);
          }
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

  // Periodic progress saving
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && videoRef.current.duration) {
        saveWatchProgress(id, videoRef.current.currentTime, videoRef.current.duration);
      }
    }, 4000);

    return () => {
      clearInterval(interval);
      if (videoRef.current && videoRef.current.duration) {
        saveWatchProgress(id, videoRef.current.currentTime, videoRef.current.duration);
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
      saveWatchProgress(id, video.currentTime, video.duration);
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
      {resumePrompt && (
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

      {/* Native HTML5 Video Element */}
      <video
        ref={videoRef}
        src={streamUrl}
        autoPlay
        playsInline
        preload="auto"
        onClick={togglePlay}
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
