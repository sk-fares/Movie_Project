import multer from 'multer';
import path from 'path';
import { POSTER_DIR, VIDEO_DIR, ensureUploadDirs } from '../utils/fileHelper.js';

// Ensure upload directories exist before storing
ensureUploadDirs();

// Storage strategy
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'poster') {
      cb(null, POSTER_DIR);
    } else if (file.fieldname === 'video') {
      cb(null, VIDEO_DIR);
    } else {
      cb(new Error(`Unexpected field: ${file.fieldname}`), null);
    }
  },
  filename: (req, file, cb) => {
    // Generate clean, collision-free filename: timestamp-random-sanitizedname
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

// File type filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'poster') {
    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeValid = file.mimetype.startsWith('image/');

    if (allowedImageExts.includes(ext) || isMimeValid) {
      cb(null, true);
    } else {
      cb(new Error('Invalid poster format. Allowed formats: JPG, PNG, WEBP'), false);
    }
  } else if (file.fieldname === 'video') {
    const allowedVideoExts = ['.mp4', '.mkv', '.webm', '.mov', '.avi'];
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeValid = file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream';

    if (allowedVideoExts.includes(ext) || isMimeValid) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Allowed formats: MP4, MKV, WEBM, MOV, AVI'), false);
    }
  } else {
    cb(new Error('Unexpected upload field'), false);
  }
};

// Configurable file size limits
const maxMB = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5120; // 5GB default
const maxBytes = maxMB * 1024 * 1024;

export const uploadMovieMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxBytes
  }
}).fields([
  { name: 'poster', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);
