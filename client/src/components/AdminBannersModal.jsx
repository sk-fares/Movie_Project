import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit3, Image, Film, Sparkles, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { bannerApi, movieApi, getPosterUrl } from '../services/api';
import { useToast } from './Toast';

export const AdminBannersModal = ({ isOpen, onClose, onBannersUpdated }) => {
  const { showToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('Trending Now');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bannerRes, movieRes] = await Promise.all([
        bannerApi.getAdminAll(),
        movieApi.getAll()
      ]);
      if (bannerRes.success) setBanners(bannerRes.data);
      if (movieRes.success) setMovies(movieRes.data);
    } catch (err) {
      console.error('Failed to load banners or movies:', err);
      showToast('Failed to load hero carousel slides', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setEditingBannerId(null);
    setTitle('');
    setTagline('Trending Now');
    setDescription('');
    setImageUrl('');
    setSelectedMovieId('');
    setLinkUrl('');
    setOrder(0);
    setIsActive(true);
    setShowAddForm(false);
  };

  // When a movie is picked from dropdown, auto-fill details
  const handleMovieSelect = (movieId) => {
    setSelectedMovieId(movieId);
    if (!movieId) return;

    const movie = movies.find((m) => m._id === movieId);
    if (movie) {
      setTitle(movie.title || '');
      setTagline(movie.genre ? `${movie.genre} • Featured` : 'Featured Movie');
      setDescription(movie.description || '');
      const poster = getPosterUrl(movie.posterPath);
      setImageUrl(poster || '');
      setLinkUrl(`/watch/${movie._id}`);
    }
  };

  const handleEditClick = (banner) => {
    setEditingBannerId(banner._id);
    setTitle(banner.title);
    setTagline(banner.tagline || 'Featured');
    setDescription(banner.description || '');
    setImageUrl(banner.imageUrl);
    setSelectedMovieId(banner.movie?._id || banner.movie || '');
    setLinkUrl(banner.linkUrl || '');
    setOrder(banner.order || 0);
    setIsActive(banner.isActive !== undefined ? banner.isActive : true);
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      showToast('Title and Thumbnail Image URL are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        movie: selectedMovieId || null,
        linkUrl: linkUrl.trim() || (selectedMovieId ? `/watch/${selectedMovieId}` : ''),
        order: Number(order) || 0,
        isActive
      };

      if (editingBannerId) {
        const res = await bannerApi.update(editingBannerId, payload);
        if (res.success) {
          showToast('Carousel slide updated successfully!', 'success');
        }
      } else {
        const res = await bannerApi.create(payload);
        if (res.success) {
          showToast('New carousel slide added!', 'success');
        }
      }

      await fetchData();
      if (onBannersUpdated) onBannersUpdated();
      resetForm();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to save slide', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, bannerTitle) => {
    if (!window.confirm(`Delete carousel slide "${bannerTitle}"?`)) return;
    try {
      await bannerApi.delete(id);
      showToast('Slide deleted successfully', 'success');
      setBanners((prev) => prev.filter((b) => b._id !== id));
      if (onBannersUpdated) onBannersUpdated();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete slide', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: '#181818',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(229, 9, 20, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#1f1f1f'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(229, 9, 20, 0.2)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Hero Carousel Manager
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage auto-sliding thumbnails and featured headlines on your landing page
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '36px', height: '36px' }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Action Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem'
            }}
          >
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Active Carousel Slides ({banners.length})
            </span>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                <Plus size={16} />
                <span>Add Hero Slide</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              style={{
                backgroundColor: '#202020',
                border: '1px solid rgba(229, 9, 20, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {editingBannerId ? 'Edit Hero Slide' : 'Add New Hero Slide'}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-outline"
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
                >
                  Cancel
                </button>
              </div>

              {/* Quick Select from Movie Library */}
              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#ff9999', marginBottom: '0.35rem' }}>
                  ⚡ Quick Auto-Fill from Movie Library (Optional)
                </label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => handleMovieSelect(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.88rem' }}
                >
                  <option value="">-- Choose a movie to auto-populate details & poster --</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.releaseYear || 'N/A'}) - {m.genre || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e5e5e5', marginBottom: '0.35rem' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Interstellar"
                    className="input-field"
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e5e5e5', marginBottom: '0.35rem' }}>
                    Tagline / Badge
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Sci-Fi • Trending #1"
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Thumbnail / Backdrop Image URL */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e5e5e5', marginBottom: '0.35rem' }}>
                  Thumbnail / Backdrop Image URL *
                </label>
                <div style={{ position: 'relative' }}>
                  <Image
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Enter backdrop/poster image URL or Cloudinary link"
                    className="input-field"
                    style={{ width: '100%', paddingLeft: '38px' }}
                    required
                  />
                </div>
                {imageUrl && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{ width: '100px', height: '56px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }}
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thumbnail Preview</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e5e5e5', marginBottom: '0.35rem' }}>
                  Synopsis / Overview
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Catchy overview displayed on the hero slide..."
                  className="input-field"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              {/* Link URL and Order */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e5e5e5', marginBottom: '0.35rem' }}>
                    Click Target (Route or URL)
                  </label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="/watch/:id or custom link"
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e5e5e5', marginBottom: '0.35rem' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.2rem' }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActive" style={{ fontSize: '0.85rem', color: '#e5e5e5', cursor: 'pointer' }}>
                    Active
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.4rem' }}
                >
                  {submitting ? 'Saving...' : editingBannerId ? 'Update Slide' : 'Add to Carousel'}
                </button>
              </div>
            </form>
          )}

          {/* Existing Banners List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading carousel slides...
            </div>
          ) : banners.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed rgba(255, 255, 255, 0.1)'
              }}
            >
              <Film size={36} color="var(--accent-primary)" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
                No Custom Hero Slides Yet
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 1.25rem' }}>
                The landing page is currently auto-sliding your latest movie posters. Add custom slides above to highlight specific blockbusters with custom backdrops!
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary"
                style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}
              >
                <Plus size={16} /> Create First Slide
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {banners.map((banner) => (
                <div
                  key={banner._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#202020',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    gap: '1rem'
                  }}
                >
                  {/* Thumbnail Preview */}
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    style={{
                      width: '80px',
                      height: '45px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      backgroundColor: '#111'
                    }}
                    onError={(e) => (e.target.src = '')}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {banner.title}
                      </span>
                      {banner.tagline && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(229, 9, 20, 0.2)',
                            color: '#ff6b6b',
                            fontWeight: 700
                          }}
                        >
                          {banner.tagline}
                        </span>
                      )}
                      {!banner.isActive && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Inactive)</span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {banner.description || 'No description'}
                    </div>
                  </div>

                  {/* Order Pill */}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Order: {banner.order || 0}
                  </span>

                  {/* Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={() => handleEditClick(banner)}
                      className="btn-icon"
                      style={{ width: '32px', height: '32px' }}
                      title="Edit Slide"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner._id, banner.title)}
                      className="btn-icon"
                      style={{ width: '32px', height: '32px', color: '#ff6b6b' }}
                      title="Delete Slide"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
