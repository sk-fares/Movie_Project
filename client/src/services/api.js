import axios from 'axios';

// Base backend URL: uses VITE_API_URL when deployed (e.g. on Vercel), or relative path locally
const BACKEND_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
const API_BASE_URL = `${BACKEND_BASE}/api`;

// Automatically attach stored JWT token to all API requests
axios.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('cinevault_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  // Register a new Viewer
  register: async (username, email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      username,
      email,
      password
    });
    return response.data;
  },

  // Log in with username/email & password
  login: async (identifier, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier,
      password
    });
    return response.data;
  },

  // Fetch current user session
  getMe: async () => {
    const response = await axios.get(`${API_BASE_URL}/auth/me`);
    return response.data;
  },

  // Save personal watch progress to MongoDB profile
  updateProgress: async (movieId, currentTime, duration) => {
    const response = await axios.post(`${API_BASE_URL}/auth/progress`, {
      movieId,
      currentTime,
      duration
    });
    return response.data;
  },

  // Toggle movie in personal watchlist
  toggleWatchlist: async (movieId) => {
    const response = await axios.post(`${API_BASE_URL}/auth/watchlist/${movieId}`);
    return response.data;
  }
};

export const movieApi = {
  // Fetch all movies with optional query parameters (search, genre, sort)
  getAll: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/movies`, { params });
    return response.data;
  },

  // Fetch a single movie by ID
  getById: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/movies/${id}`);
    return response.data;
  },

  // Upload and create a new movie entry with upload progress callback
  create: async (formData, onProgress) => {
    const response = await axios.post(`${API_BASE_URL}/movies`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    return response.data;
  },

  // Update movie metadata and optionally replace files
  update: async (id, formData, onProgress) => {
    const response = await axios.put(`${API_BASE_URL}/movies/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    return response.data;
  },

  // Delete a movie and its files
  delete: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/movies/${id}`);
    return response.data;
  },

  // Get library statistics
  getStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/movies/stats/overview`);
    return response.data;
  }
};

// Media Helpers
export const getPosterUrl = (posterPath) => {
  if (!posterPath) return null;
  if (posterPath.startsWith('http://') || posterPath.startsWith('https://')) {
    return posterPath;
  }
  return `${BACKEND_BASE}/uploads/posters/${posterPath}`;
};

export const getStreamUrl = (movieId) => {
  return `${API_BASE_URL}/movies/${movieId}/stream`;
};

export const getDownloadUrl = (movieId) => {
  return `${API_BASE_URL}/movies/${movieId}/download`;
};

export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatMinutes = (minutes) => {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
  }
  return `${m}m`;
};
