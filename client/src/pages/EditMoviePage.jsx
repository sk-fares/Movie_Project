import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  Film,
  Image as ImageIcon,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  HardDrive
} from 'lucide-react';
import { movieApi, getPosterUrl, formatBytes } from '../services/api';

const POPULAR_GENRES = [
  'Action',
  'Sci-Fi',
  'Drama',
  'Comedy',
  'Horror',
  'Thriller',
  'Documentary',
  'Adventure',
  'Animation',
  'Fantasy',
  'Crime',
  'Mystery',
  'Romance'
];

export const EditMoviePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Loading initial movie
  const [initialLoading, setInitialLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [genre, setGenre] = useState('Action');
  const [customGenre, setCustomGenre] = useState('');
  const [runtime, setRuntime] = useState('');

  // Existing Media State
  const [existingPoster, setExistingPoster] = useState(null);
  const [existingVideoPath, setExistingVideoPath] = useState('');
  const [existingVideoName, setExistingVideoName] = useState('');
  const [existingVideoSize, setExistingVideoSize] = useState(0);

  // Replacement Files State
  const [newPosterFile, setNewPosterFile] = useState(null);
  const [newPosterPreview, setNewPosterPreview] = useState(null);
  const [newVideoFile, setNewVideoFile] = useState(null);

  // Upload Progress & UI State
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Load existing movie details
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setInitialLoading(true);
        const res = await movieApi.getById(id);
        if (res.success && res.data) {
          const m = res.data;
          setTitle(m.title || '');
          setDescription(m.description || '');
          setReleaseYear(m.releaseYear ? m.releaseYear.toString() : '');
          if (POPULAR_GENRES.includes(m.genre)) {
            setGenre(m.genre);
          } else {
            setGenre('Other');
            setCustomGenre(m.genre || '');
          }
          setRuntime(m.runtime ? m.runtime.toString() : '');
          setExistingPoster(m.posterPath);
          setExistingVideoPath(m.videoPath);
          setExistingVideoName(m.videoOriginalName || m.videoPath);
          setExistingVideoSize(m.videoSize || 0);
        }
      } catch (err) {
        console.error('Failed to load movie for editing:', err);
        setError('Failed to load movie data for editing.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Handle New Poster Selection & Preview
  const handleNewPosterChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP) for the poster.');
      return;
    }

    setNewPosterFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPosterPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const removeNewPoster = () => {
    setNewPosterFile(null);
    setNewPosterPreview(null);
  };

  // Handle New Video Selection
  const handleNewVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNewVideoFile(file);
    setError(null);
  };

  const removeNewVideo = () => {
    setNewVideoFile(null);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Movie title is required.');
      return;
    }

    const finalGenre = genre === 'Other' ? customGenre.trim() || 'General' : genre;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    if (releaseYear) formData.append('releaseYear', releaseYear);
    formData.append('genre', finalGenre);
    if (runtime) formData.append('runtime', runtime);

    if (newPosterFile) {
      formData.append('poster', newPosterFile);
    }
    if (newVideoFile) {
      formData.append('video', newVideoFile);
    }

    try {
      setSaving(true);
      setError(null);
      setUploadProgress(0);

      const res = await movieApi.update(id, formData, (progress) => {
        setUploadProgress(progress);
      });

      if (res.success) {
        navigate(`/movie/${id}`);
      }
    } catch (err) {
      console.error('Update failed:', err);
      setError(
        err.response?.data?.error || err.message || 'Failed to update movie. Check file size limits.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container" style={{ paddingTop: '120px', textAlign: 'center', minHeight: '70vh' }}>
        <Loader2 size={36} className="spin" style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading movie data for editing...</p>
      </div>
    );
  }

  const activePosterPreview = newPosterPreview || getPosterUrl(existingPoster);

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '5rem', maxWidth: '850px' }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="btn btn-outline"
        style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem' }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div
        style={{
          backgroundColor: '#1b1b1b',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              marginBottom: '0.4rem'
            }}
          >
            Edit Movie: {title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Update metadata or optionally replace poster art and video files.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              backgroundColor: 'rgba(229, 9, 20, 0.15)',
              border: '1px solid rgba(229, 9, 20, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#ff6b6b',
              marginBottom: '1.75rem',
              fontSize: '0.92rem'
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Movie Title */}
          <div className="form-group">
            <label className="form-label">
              Movie Title <span style={{ color: 'var(--accent-primary)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              disabled={saving}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Synopsis / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Metadata Row: Year, Genre, Runtime */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            {/* Release Year */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Release Year</label>
              <input
                type="number"
                min="1888"
                max="2100"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="form-input"
                disabled={saving}
              />
            </div>

            {/* Genre */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="form-select"
                disabled={saving}
              >
                {POPULAR_GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="Other">Other / Custom</option>
              </select>
            </div>

            {/* Runtime */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Runtime (minutes)</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
                className="form-input"
                disabled={saving}
              />
            </div>
          </div>

          {/* Custom Genre */}
          {genre === 'Other' && (
            <div className="form-group">
              <label className="form-label">Custom Genre Name</label>
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                className="form-input"
                disabled={saving}
              />
            </div>
          )}

          {/* Video File Section (shows existing and allows replacement) */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">Video File</label>
            <div
              style={{
                backgroundColor: '#202020',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid #333333'
              }}
            >
              {/* Existing file info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  backgroundColor: '#282828',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Film size={22} color="var(--accent-primary)" />
                  <div>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>
                      Current File: {existingVideoName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Size: {formatBytes(existingVideoSize)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Replacement Video File if picked */}
              {newVideoFile ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(229, 9, 20, 0.1)',
                    border: '1px solid rgba(229, 9, 20, 0.3)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Upload size={20} color="var(--accent-primary)" />
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.9rem' }}>
                        Replacement: {newVideoFile.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#ff8888' }}>
                        {formatBytes(newVideoFile.size)} (Will replace existing file on save)
                      </div>
                    </div>
                  </div>
                  {!saving && (
                    <button
                      type="button"
                      onClick={removeNewVideo}
                      className="btn-icon"
                      title="Cancel replacing video"
                      style={{ color: '#ff6b6b' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <label
                  style={{
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 1.1rem',
                    backgroundColor: '#2e2e2e',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#ffffff'
                  }}
                >
                  <Upload size={16} />
                  Choose New Video to Replace Current
                  <input
                    type="file"
                    accept="video/*,.mkv,.mp4,.webm,.mov,.avi"
                    onChange={handleNewVideoChange}
                    style={{ display: 'none' }}
                    disabled={saving}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Poster Section (shows existing and allows replacement) */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label className="form-label">Cover Poster Image</label>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {activePosterPreview && (
                <div
                  style={{
                    position: 'relative',
                    width: '110px',
                    aspectRatio: '2/3',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    flexShrink: 0
                  }}
                >
                  <img src={activePosterPreview} alt="Poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {newPosterFile && !saving && (
                    <button
                      type="button"
                      onClick={removeNewPoster}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '50%',
                        padding: '4px',
                        color: '#ff6b6b'
                      }}
                      title="Cancel new poster"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              <div
                style={{
                  flex: 1,
                  minWidth: '220px',
                  border: '2px dashed #3a3a3a',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  backgroundColor: '#202020',
                  textAlign: 'center'
                }}
              >
                <label
                  style={{
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ImageIcon size={26} color="var(--text-muted)" />
                  <span style={{ fontWeight: 500, fontSize: '0.9rem', color: '#ffffff' }}>
                    {newPosterFile ? 'Change Selected Replacement Poster' : 'Select New Poster Image'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    JPG, PNG, WEBP
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleNewPosterChange}
                    style={{ display: 'none' }}
                    disabled={saving}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Upload Progress Bar if replacement files are uploading */}
          {saving && (newPosterFile || newVideoFile) && (
            <div style={{ marginTop: '2rem', padding: '1.25rem', backgroundColor: '#262626', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff' }}>
                  <Loader2 size={16} className="spin" style={{ color: 'var(--accent-primary)' }} />
                  Uploading replacement media...
                </span>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#3a3a3a', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${uploadProgress}%`,
                    backgroundColor: 'var(--accent-primary)',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2.5rem' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.5rem' }}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Updating Movie...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
