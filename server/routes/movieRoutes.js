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

const router = express.Router();

// Stats route (placed before :id route so it doesn't get treated as an ID)
router.get('/stats/overview', getLibraryStats);

// Movie collection routes
router.route('/')
  .get(getAllMovies)
  .post(uploadMovieMedia, createMovie);

// Single movie routes
router.route('/:id')
  .get(getMovieById)
  .put(uploadMovieMedia, updateMovie)
  .delete(deleteMovie);

// Streaming and Download routes
router.get('/:id/stream', streamMovie);
router.get('/:id/download', downloadMovie);

export default router;
