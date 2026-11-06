import express from 'express';
import {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  streamMovie,
  downloadMovie,
  getLibraryStats
} from '../controllers/movieController.js';
import { uploadMovieMedia } from '../middleware/upload.js';
import { verifyToken, requireOwner } from '../middleware/auth.js';
import { verifyInviteOrAuth } from '../middleware/inviteAuth.js';

const router = express.Router();

// Stats route (placed before :id route so it doesn't get treated as an ID)
router.get('/stats/overview', verifyInviteOrAuth, getLibraryStats);

// Movie collection routes
// Requires active invite pass or login to browse; Owner only to create
router.route('/')
  .get(verifyInviteOrAuth, getAllMovies)
  .post(verifyToken, requireOwner, uploadMovieMedia, createMovie);

// Single movie routes
// Requires active invite pass or login to view details; Owner only to edit or delete
router.route('/:id')
  .get(verifyInviteOrAuth, getMovieById)
  .put(verifyToken, requireOwner, uploadMovieMedia, updateMovie)
  .delete(verifyToken, requireOwner, deleteMovie);

// Streaming and Download routes (Protected by invite code / login)
router.get('/:id/stream', verifyInviteOrAuth, streamMovie);
router.get('/:id/download', verifyInviteOrAuth, downloadMovie);

export default router;
