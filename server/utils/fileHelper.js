import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base server directory
export const SERVER_DIR = path.resolve(__dirname, '..');
export const POSTER_DIR = process.env.POSTER_DIR
  ? path.resolve(SERVER_DIR, process.env.POSTER_DIR)
  : path.resolve(SERVER_DIR, 'uploads', 'posters');
export const VIDEO_DIR = process.env.VIDEO_DIR
  ? path.resolve(SERVER_DIR, process.env.VIDEO_DIR)
  : path.resolve(SERVER_DIR, 'uploads', 'videos');

// Ensure directories exist
export const ensureUploadDirs = () => {
  if (!fs.existsSync(POSTER_DIR)) {
    fs.mkdirSync(POSTER_DIR, { recursive: true });
  }
  if (!fs.existsSync(VIDEO_DIR)) {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
  }
};

/**
 * Get safe absolute path to a poster file
 * Ensures no directory traversal (e.g. ../..)
 */
export const getPosterPath = (filename) => {
  if (!filename) return null;
  const safeName = path.basename(filename);
  return path.join(POSTER_DIR, safeName);
};

/**
 * Get safe absolute path to a video file
 * Ensures no directory traversal
 */
export const getVideoPath = (filename) => {
  if (!filename) return null;
  const safeName = path.basename(filename);
  return path.join(VIDEO_DIR, safeName);
};

/**
 * Safely delete a file if it exists within the allowed upload directory
 */
export const deleteFileSafely = (filePath) => {
  if (!filePath) return;
  try {
    const resolvedPath = path.resolve(filePath);
    // Security check: Must reside within POSTER_DIR or VIDEO_DIR
    const isWithinPosters = resolvedPath.startsWith(POSTER_DIR);
    const isWithinVideos = resolvedPath.startsWith(VIDEO_DIR);

    if ((isWithinPosters || isWithinVideos) && fs.existsSync(resolvedPath)) {
      // Make sure we never delete .gitkeep
      if (path.basename(resolvedPath) === '.gitkeep') return;
      fs.unlinkSync(resolvedPath);
      console.log(`[FileHelper] Safely deleted file: ${resolvedPath}`);
    }
  } catch (err) {
    console.error(`[FileHelper] Failed to delete file (${filePath}):`, err.message);
  }
};

/**
 * Clean up uploaded files (e.g. if database insert fails)
 */
export const cleanupUploadedFiles = (files) => {
  if (!files) return;
  if (files.poster && files.poster[0]) {
    deleteFileSafely(files.poster[0].path);
  }
  if (files.video && files.video[0]) {
    deleteFileSafely(files.video[0].path);
  }
};
