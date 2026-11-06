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

const router = express.Router();

// Stats route (placed before :id route so it doesn't get treated as an ID)
router.get('/stats/overview', getLibraryStats);

// Movie collection routes
// Public can browse movies, only Owner can add new movies
router.route('/')
  .get(getAllMovies)
  .post(verifyToken, requireOwner, uploadMovieMedia, createMovie);

// Single movie routes
// Public can view movie details, only Owner can edit or delete
router.route('/:id')
  .get(getMovieById)
  .put(verifyToken, requireOwner, uploadMovieMedia, updateMovie)
  .delete(verifyToken, requireOwner, deleteMovie);

// Streaming and Download routes
router.get('/:id/stream', streamMovie);
router.get('/:id/download', downloadMovie);

export default router;
