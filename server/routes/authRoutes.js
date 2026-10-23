import express from 'express';
import {
  register,
  login,
  getMe,
  updateProgress,
  toggleWatchlist
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public Authentication endpoints
router.post('/register', register);
router.post('/login', login);

// Authenticated User endpoints
router.get('/me', verifyToken, getMe);
router.post('/progress', verifyToken, updateProgress);
router.post('/watchlist/:movieId', verifyToken, toggleWatchlist);

export default router;
