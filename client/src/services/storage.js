// Local storage service for private client-side Watchlist and Playback Progress

const WATCHLIST_KEY = 'cinevault_watchlist';
const PROGRESS_KEY = 'cinevault_watch_progress';

// --- Watchlist / Favorites ---

export const getWatchlist = () => {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isInWatchlist = (movieId) => {
  if (!movieId) return false;
  const list = getWatchlist();
  return list.includes(movieId);
};

export const toggleWatchlist = (movieId) => {
  if (!movieId) return false;
  const list = getWatchlist();
  const index = list.indexOf(movieId);
  let updated;
  let isAdded;
  if (index > -1) {
    updated = list.filter((id) => id !== movieId);
    isAdded = false;
  } else {
    updated = [...list, movieId];
    isAdded = true;
  }
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Storage error:', err);
  }
  return isAdded;
};

// --- Watch Progress Tracking ---

export const saveWatchProgress = (movieId, currentTime, duration) => {
  if (!movieId || !duration || isNaN(currentTime) || isNaN(duration)) return;
  
  // If watched >= 95%, consider it completed and clear progress
  if (currentTime / duration >= 0.95) {
    clearWatchProgress(movieId);
    return;
  }

  // If watched less than 5 seconds, don't clutter continue watching
  if (currentTime < 5) return;

  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const store = raw ? JSON.parse(raw) : {};
    store[movieId] = {
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      percentage: Math.round((currentTime / duration) * 100),
      lastWatched: Date.now()
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save watch progress:', err);
  }
};

export const getWatchProgress = (movieId) => {
  if (!movieId) return null;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw);
    return store[movieId] || null;
  } catch {
    return null;
  }
};

export const getAllWatchProgress = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const clearWatchProgress = (movieId) => {
  if (!movieId) return;
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return;
    const store = JSON.parse(raw);
    delete store[movieId];
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to clear watch progress:', err);
  }
};
