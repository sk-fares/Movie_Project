import axios from 'axios';

// Base API URL is relative so Vite dev server proxy or production server handles it cleanly
const API_BASE_URL = '/api';

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
  return `/uploads/posters/${posterPath}`;
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
