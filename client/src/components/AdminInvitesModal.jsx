import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  KeyRound,
  ShieldCheck,
  Clock,
  Users,
  RefreshCw,
  Power,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { inviteApi } from '../services/api';
import { useToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';

export const AdminInvitesModal = ({ isOpen, onClose }) => {
  const { showToast } = useToast();

  const [invites, setInvites] = useState([]);
  const [stats, setStats] = useState({ totalCodes: 0, activeCodes: 0, totalUses: 0 });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Add Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newExpiryOption, setNewExpiryOption] = useState('never'); // never, 7, 30, 90

  // Edit Modal/State
  const [editingInvite, setEditingInvite] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editMaxUses, setEditMaxUses] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete Confirmation state
  const [inviteToDelete, setInviteToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch invites from server
  const fetchInvites = async () => {
    setLoading(true);
    try {
      const res = await inviteApi.getAll();
      if (res.success) {
        setInvites(res.data || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to fetch invites:', err);
      showToast('Failed to load invite codes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInvites();
      resetAddForm();
      setEditingInvite(null);
    }
  }, [isOpen]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(`CINE-${rand}`);
  };

  const resetAddForm = () => {
    setNewCode('');
    setNewLabel('');
    setNewMaxUses('');
    setNewExpiryOption('never');
    setShowAddForm(false);
  };

  // Copy code to clipboard
  const handleCopyCode = async (code, id) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      showToast(`Copied code "${code}" to clipboard!`, 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Could not copy to clipboard', 'error');
    }
  };

  // Handle Add New Invite
  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let expiresAt = null;
      if (newExpiryOption !== 'never') {
        const days = parseInt(newExpiryOption, 10);
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      const res = await inviteApi.create({
        code: newCode.trim(),
        label: newLabel.trim(),
        maxUses: newMaxUses ? parseInt(newMaxUses, 10) : null,
        expiresAt,
        isActive: true
      });

      if (res.success) {
        showToast('Invite code created successfully!', 'success');
        resetAddForm();
        fetchInvites();
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create invite code';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Toggle Active/Inactive
  const handleToggleActive = async (invite) => {
    try {
      const res = await inviteApi.update(invite._id, {
        isActive: !invite.isActive
      });
      if (res.success) {
        setInvites((prev) =>
          prev.map((item) => (item._id === invite._id ? { ...item, isActive: !item.isActive } : item))
        );
        showToast(`Invite code ${invite.code} ${!invite.isActive ? 'activated' : 'deactivated'}.`, 'info');
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Open Edit Form
  const handleStartEdit = (invite) => {
    setEditingInvite(invite);
    setEditLabel(invite.label || '');
    setEditMaxUses(invite.maxUses !== null && invite.maxUses !== undefined ? invite.maxUses : '');
    setEditIsActive(invite.isActive);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingInvite) return;
    setSubmitting(true);
    try {
      const res = await inviteApi.update(editingInvite._id, {
        label: editLabel.trim(),
        maxUses: editMaxUses !== '' ? parseInt(editMaxUses, 10) : null,
        isActive: editIsActive
      });
      if (res.success) {
        showToast('Invite code updated successfully!', 'success');
        setEditingInvite(null);
        fetchInvites();
      }
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update invite code', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Invite
  const handleConfirmDelete = async () => {
    if (!inviteToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await inviteApi.delete(inviteToDelete._id);
      if (res.success) {
        showToast(`Invite code ${inviteToDelete.code} deleted.`, 'success');
        setInviteToDelete(null);
        fetchInvites();
      }
    } catch (err) {
      showToast('Failed to delete invite code', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}
      >
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#161616',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#1a1a1a'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(229, 9, 20, 0.15)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <KeyRound size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Invite Codes Manager
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Control who can enter CineVault and stream movies for 7 days
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-icon"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '8px'
              }}
              title="Close"
            >
              <X size={22} />
            </button>
          </div>

          {/* Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              padding: '1rem 1.75rem',
              backgroundColor: '#121212',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#ffffff'
                }}
              >
                <KeyRound size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  {stats.totalCodes}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Codes</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  color: '#4ade80'
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4ade80' }}>
                  {stats.activeCodes}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Codes</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#60a5fa'
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#60a5fa' }}>
                  {stats.totalUses}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Times Used</div>
              </div>
            </div>
          </div>

          {/* Action Header: Create New Button */}
          <div
            style={{
              padding: '0.85rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Active Invite Passwords
            </div>

            <button
              onClick={() => {
                if (!showAddForm) generateRandomCode();
                setShowAddForm(!showAddForm);
              }}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.85rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              <span>{showAddForm ? 'Cancel' : 'Create New Invite'}</span>
            </button>
          </div>

          {/* Main Scrollable Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
            {/* Create New Invite Form Accordion */}
            {showAddForm && (
              <form
                onSubmit={handleCreateInvite}
                style={{
                  backgroundColor: '#1e1e1e',
                  border: '1px solid rgba(229, 9, 20, 0.35)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Sparkles size={16} color="var(--accent-primary)" />
                  <span>Generate New 7-Day Invite Code</span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.35rem'
                      }}
                    >
                      Invite Code String
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="e.g. CINE-7X9P"
                        required
                        style={{
                          flex: 1,
                          padding: '0.65rem 0.8rem',
                          backgroundColor: '#121212',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          textTransform: 'uppercase'
                        }}
                      />
                      <button
                        type="button"
                        onClick={generateRandomCode}
                        className="btn btn-secondary"
                        style={{ padding: '0.65rem 0.8rem', fontSize: '0.8rem' }}
                        title="Generate random code"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.35rem'
                      }}
                    >
                      Friend / Group Note
                    </label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Rahul, College Squad, Family"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        backgroundColor: '#121212',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.35rem'
                      }}
                    >
                      Max Total Uses
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(e.target.value)}
                      placeholder="Unlimited (Leave empty)"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        backgroundColor: '#121212',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.35rem'
                      }}
                    >
                      Code Expiration
                    </label>
                    <select
                      value={newExpiryOption}
                      onChange={(e) => setNewExpiryOption(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        backgroundColor: '#121212',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    >
                      <option value="never">Never Expire (Permanent)</option>
                      <option value="7">Expires in 7 Days</option>
                      <option value="30">Expires in 30 Days</option>
                      <option value="90">Expires in 90 Days</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={resetAddForm}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !newCode.trim()}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    {submitting ? 'Creating...' : 'Save & Activate Code'}
                  </button>
                </div>
              </form>
            )}

            {/* Edit Invite Form Modal/Card */}
            {editingInvite && (
              <form
                onSubmit={handleSaveEdit}
                style={{
                  backgroundColor: '#202020',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)'
                }}
              >
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Edit3 size={16} color="#60a5fa" />
                    <span>Edit Invite: <code style={{ color: '#ffffff' }}>{editingInvite.code}</code></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingInvite(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.35rem'
                      }}
                    >
                      Friend / Group Note
                    </label>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="e.g. Rahul, Family"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        backgroundColor: '#121212',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.35rem'
                      }}
                    >
                      Max Uses (Leave empty for unlimited)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editMaxUses}
                      onChange={(e) => setEditMaxUses(e.target.value)}
                      placeholder="Unlimited"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        backgroundColor: '#121212',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.88rem'
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '0.35rem'
                      }}
                    >
                      Status
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        marginTop: '0.5rem',
                        fontSize: '0.85rem',
                        color: '#ffffff'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                      />
                      <span>Active / Usable</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setEditingInvite(null)}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    {submitting ? 'Saving...' : 'Update Invite Code'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Invites */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                Loading invite codes...
              </div>
            ) : invites.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.12)'
                }}
              >
                <KeyRound size={36} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
                <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                  No Invite Codes Found
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Create your first invite code so your friends can enter CineVault!
                </div>
                <button
                  onClick={() => {
                    generateRandomCode();
                    setShowAddForm(true);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Plus size={16} />
                  <span>Create First Invite</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {invites.map((invite) => {
                  const isMaxed =
                    invite.maxUses !== null && invite.maxUses > 0 && invite.usedCount >= invite.maxUses;
                  const isExpired = invite.expiresAt && new Date() > new Date(invite.expiresAt);
                  const isUsable = invite.isActive && !isMaxed && !isExpired;

                  return (
                    <div
                      key={invite._id}
                      style={{
                        padding: '1rem 1.25rem',
                        backgroundColor: '#1b1b1b',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        transition: 'border-color 0.2s ease'
                      }}
                    >
                      {/* Left side: Code and Note */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '1.15rem',
                                fontWeight: 800,
                                color: isUsable ? '#ffffff' : 'var(--text-muted)',
                                letterSpacing: '1px',
                                textDecoration: !invite.isActive ? 'line-through' : 'none'
                              }}
                            >
                              {invite.code}
                            </span>

                            <button
                              onClick={() => handleCopyCode(invite.code, invite._id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: copiedId === invite._id ? '#4ade80' : 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.2rem',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s ease'
                              }}
                              title="Copy code to clipboard"
                            >
                              {copiedId === invite._id ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {invite.label || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>General Invite</span>}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Badges (Usage, Expiry, Status) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {/* Usage Counter */}
                        <div
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          👥 {invite.usedCount || 0}
                          {invite.maxUses ? ` / ${invite.maxUses}` : ''} uses
                        </div>

                        {/* Status Badge */}
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            backgroundColor: !invite.isActive
                              ? 'rgba(255, 255, 255, 0.1)'
                              : isMaxed
                              ? 'rgba(239, 68, 68, 0.15)'
                              : isExpired
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(34, 197, 94, 0.15)',
                            color: !invite.isActive
                              ? 'var(--text-muted)'
                              : isMaxed
                              ? '#f87171'
                              : isExpired
                              ? '#fbbf24'
                              : '#4ade80',
                            border: `1px solid ${
                              !invite.isActive
                                ? 'rgba(255, 255, 255, 0.1)'
                                : isMaxed
                                ? 'rgba(239, 68, 68, 0.3)'
                                : isExpired
                                ? 'rgba(245, 158, 11, 0.3)'
                                : 'rgba(34, 197, 94, 0.3)'
                            }`
                          }}
                        >
                          {!invite.isActive ? 'Deactivated' : isMaxed ? 'Max Reached' : isExpired ? 'Expired' : 'Active'}
                        </span>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Toggle active switch */}
                        <button
                          onClick={() => handleToggleActive(invite)}
                          className="btn-icon"
                          style={{
                            padding: '0.45rem',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: invite.isActive ? '#4ade80' : 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                          title={invite.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <Power size={15} />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEdit(invite)}
                          className="btn-icon"
                          style={{
                            padding: '0.45rem',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            cursor: 'pointer'
                          }}
                          title="Edit invite details"
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setInviteToDelete(invite)}
                          className="btn-icon"
                          style={{
                            padding: '0.45rem',
                            borderRadius: '6px',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#f87171',
                            cursor: 'pointer'
                          }}
                          title="Delete invite code"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '1rem 1.75rem',
              backgroundColor: '#141414',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}
          >
            <div>Every invite code unlocks 7 days of private streaming for your guest.</div>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {inviteToDelete && (
        <ConfirmModal
          isOpen={Boolean(inviteToDelete)}
          title="Delete Invite Code"
          message={`Are you sure you want to delete invite code "${inviteToDelete.code}"? Any user currently relying on this code will lose access once their 7-day browser pass expires.`}
          confirmText="Delete Code"
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setInviteToDelete(null)}
        />
      )}
    </>
  );
};
