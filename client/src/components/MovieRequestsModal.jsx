import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ThumbsUp,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Film,
  Calendar,
  MessageSquare,
  Lock,
  Loader2
} from 'lucide-react';
import { requestApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export const MovieRequestsModal = ({ isOpen, onClose }) => {
  const { isAuthenticated, isOwner, user } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [quota, setQuota] = useState({ dailyLimit: 2, usedToday: 0, remainingToday: 2 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'added'

  // Form state
  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [notes, setNotes] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await requestApi.getAll();
      if (res.success) {
        setRequests(res.data || []);
        if (res.quota) setQuota(res.quota);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a movie title', 'error');
      return;
    }

    if (!isAuthenticated) {
      showToast('Please log in to suggest movies', 'error');
      return;
    }

    if (!isOwner && quota.remainingToday <= 0) {
      showToast('Daily limit reached! You can suggest up to 2 movies every 24 hours.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await requestApi.create({
        title: title.trim(),
        releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
        notes: notes.trim()
      });

      if (res.success) {
        showToast('Movie suggestion submitted! Thank you!', 'success');
        setTitle('');
        setReleaseYear('');
        setNotes('');
        await fetchRequests();
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit suggestion.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id) => {
    if (!isAuthenticated) {
      showToast('Please log in to upvote suggestions', 'error');
      return;
    }

    try {
      const res = await requestApi.toggleUpvote(id);
      if (res.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === id
              ? { ...r, hasUpvoted: res.hasUpvoted, upvotesCount: res.upvotesCount }
              : r
          )
        );
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to vote', 'error');
    }
  };

  const handleDelete = async (id, movieTitle) => {
    if (!window.confirm(`Delete suggestion "${movieTitle}"?`)) return;

    try {
      const res = await requestApi.delete(id);
      if (res.success) {
        showToast('Suggestion deleted', 'info');
        setRequests((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete suggestion', 'error');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'added' ? 'pending' : 'added';
    try {
      const res = await requestApi.updateStatus(id, newStatus);
      if (res.success) {
        showToast(`Marked as ${newStatus === 'added' ? 'Added to Library ✓' : 'Pending'}`, 'success');
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update status', 'error');
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'added') return r.status === 'added';
    return true;
  });

  const formatRelativeTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      if (diffMins > 0) return `${diffMins}m ago`;
      return 'just now';
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#1b1b1b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(229, 9, 20, 0.1), transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(229, 9, 20, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}
            >
              <Film size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Movie Wishlist & Suggestions
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Suggest movies for CineVault (Limit: 2 recommendations per day)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Submission Quota Banner */}
          {isAuthenticated ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: quota.remainingToday > 0 ? 'rgba(46, 204, 113, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                border: `1px solid ${quota.remainingToday > 0 ? 'rgba(46, 204, 113, 0.3)' : 'rgba(255, 170, 0, 0.35)'}`,
                fontSize: '0.86rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color={quota.remainingToday > 0 ? '#2ecc71' : '#ffc107'} />
                <span>
                  <strong>Your Daily Quota:</strong> {quota.remainingToday > 0 ? (
                    <>You can suggest <strong>{quota.remainingToday}</strong> more {quota.remainingToday === 1 ? 'movie' : 'movies'} today.</>
                  ) : (
                    <>Daily limit reached (2/2). You can suggest more tomorrow!</>
                  )}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                  backgroundColor: quota.remainingToday > 0 ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 170, 0, 0.2)',
                  color: quota.remainingToday > 0 ? '#2ecc71' : '#ffc107'
                }}
              >
                {quota.usedToday} / {quota.dailyLimit} used
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(229, 9, 20, 0.1)',
                border: '1px solid rgba(229, 9, 20, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.86rem',
                color: '#ff6b6b'
              }}
            >
              <Lock size={16} />
              <span>Please sign in or register to suggest movies and vote!</span>
            </div>
          )}

          {/* Suggestion Form */}
          {isAuthenticated && (
            <form
              onSubmit={handleSubmit}
              style={{
                backgroundColor: '#222222',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={16} color="var(--accent-primary)" />
                <span>Suggest a New Movie</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.75rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Movie Title (e.g. Inception, Gladiator II)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  disabled={submitting || (!isOwner && quota.remainingToday <= 0)}
                  style={{ fontSize: '0.88rem' }}
                />
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  placeholder="Year (optional)"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  className="form-input"
                  disabled={submitting || (!isOwner && quota.remainingToday <= 0)}
                  style={{ fontSize: '0.88rem' }}
                />
              </div>

              <input
                type="text"
                placeholder="Reason or notes (e.g. Best thriller of the decade, or IMDb link)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                disabled={submitting || (!isOwner && quota.remainingToday <= 0)}
                style={{ fontSize: '0.88rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={submitting || (!isOwner && quota.remainingToday <= 0)}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.86rem' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Submit Recommendation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Community Wishlist Header & Filter Tabs */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                Community Recommendations ({requests.length})
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {[
                  { id: 'all', label: `All (${requests.length})` },
                  { id: 'pending', label: `Pending (${requests.filter(r => r.status === 'pending').length})` },
                  { id: 'added', label: `Added (${requests.filter(r => r.status === 'added').length})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      backgroundColor: activeTab === tab.id ? 'rgba(229, 9, 20, 0.2)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                      border: activeTab === tab.id ? '1px solid rgba(229, 9, 20, 0.4)' : '1px solid transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Requests */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.86rem' }}>Loading wishlist...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  backgroundColor: '#202020',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)'
                }}
              >
                <Film size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>No suggestions found in this category.</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>Be the first to recommend a movie!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {filteredRequests.map((item) => {
                  const isAdded = item.status === 'added';
                  return (
                    <div
                      key={item._id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#222222',
                        border: item.isOwnRequest
                          ? '1px solid rgba(229, 9, 20, 0.35)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Left: Movie Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                            {item.title}
                          </span>
                          {item.releaseYear && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              ({item.releaseYear})
                            </span>
                          )}
                          {/* Status Badge */}
                          {isAdded ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(46, 204, 113, 0.18)',
                                color: '#2ecc71',
                                border: '1px solid rgba(46, 204, 113, 0.3)'
                              }}
                            >
                              <CheckCircle2 size={12} />
                              Added to Library
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(255, 170, 0, 0.15)',
                                color: '#ffc107',
                                border: '1px solid rgba(255, 170, 0, 0.3)'
                              }}
                            >
                              <Clock size={11} />
                              Pending
                            </span>
                          )}
                          {item.isOwnRequest && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(229, 9, 20, 0.2)',
                                color: '#ff6b6b'
                              }}
                            >
                              Your Suggestion
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {item.notes}
                          </p>
                        )}

                        <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span>Suggested by <strong>@{item.username}</strong></span>
                          <span>•</span>
                          <span>{formatRelativeTime(item.createdAt)}</span>
                        </div>
                      </div>

                      {/* Right: Actions (Upvote + Owner Controls) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {/* Upvote Button */}
                        <button
                          onClick={() => handleUpvote(item._id)}
                          className="btn-icon"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '999px',
                            backgroundColor: item.hasUpvoted ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            color: item.hasUpvoted ? 'var(--accent-primary)' : '#ffffff',
                            border: item.hasUpvoted ? '1px solid rgba(229, 9, 20, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                          title={item.hasUpvoted ? 'Remove upvote' : 'Upvote this movie'}
                        >
                          <ThumbsUp size={14} fill={item.hasUpvoted ? 'currentColor' : 'none'} />
                          <span>{item.upvotesCount}</span>
                        </button>

                        {/* Owner Moderation Controls */}
                        {isOwner && (
                          <>
                            {/* Toggle Added / Pending */}
                            <button
                              onClick={() => handleStatusToggle(item._id, item.status)}
                              className="btn-icon"
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: isAdded ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                color: isAdded ? '#2ecc71' : '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                              title={isAdded ? 'Revert to Pending' : 'Mark as Added to CineVault'}
                            >
                              {isAdded ? '✓ Added' : 'Mark Added'}
                            </button>

                            {/* Delete Suggestion */}
                            <button
                              onClick={() => handleDelete(item._id, item.title)}
                              className="btn-icon"
                              style={{ width: '32px', height: '32px', color: '#ff6b6b' }}
                              title="Delete recommendation (Owner only)"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
