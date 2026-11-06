import express from 'express';
import {
  register,
  login,
  getMe,
  updateProgress,
  toggleWatchlist
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public Authentication endpoints with brute-force / bot rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Authenticated User endpoints
router.get('/me', verifyToken, getMe);
router.post('/progress', verifyToken, updateProgress);
router.post('/watchlist/:movieId', verifyToken, toggleWatchlist);

export default router;
