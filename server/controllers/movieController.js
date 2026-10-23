import fs from 'fs';
import path from 'path';
import { Movie } from '../models/Movie.js';
import {
  getPosterPath,
  getVideoPath,
  deleteFileSafely,
  cleanupUploadedFiles,
  POSTER_DIR,
  VIDEO_DIR
} from '../utils/fileHelper.js';

/**
 * @route   GET /api/movies
 * @desc    Get all movies with optional search, genre filter, and sorting
 */
export const getAllMovies = async (req, res, next) => {
  try {
    const { search, genre, sort } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { genre: searchRegex }
      ];
    }

    if (genre && genre.trim() && genre.toLowerCase() !== 'all') {
      filter.genre = new RegExp(`^${genre.trim()}$`, 'i');
    }

    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'title_asc') {
      sortOption = { title: 1 };
    } else if (sort === 'title_desc') {
      sortOption = { title: -1 };
    } else if (sort === 'year_desc') {
      sortOption = { releaseYear: -1 };
    } else if (sort === 'year_asc') {
      sortOption = { releaseYear: 1 };
    }

    const movies = await Movie.find(filter).sort(sortOption);

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/movies/:id
 * @desc    Get a single movie by ID
 */
export const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    res.status(200).json({
      success: true,
      data: movie
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/movies
 * @desc    Create a new movie entry with uploaded files
 */
export const createMovie = async (req, res, next) => {
  try {
    const { title, description, releaseYear, genre, runtime } = req.body;

    // Validate title
    if (!title || !title.trim()) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        error: 'Movie title is required'
      });
    }

    // Validate video file existence
    const videoFile = req.files?.video?.[0];
    if (!videoFile) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        error: 'A movie video file is required'
      });
    }

    const posterFile = req.files?.poster?.[0];

    const movieData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : undefined,
      genre: genre ? genre.trim() : 'General',
      runtime: runtime ? parseInt(runtime, 10) : undefined,
      posterPath: posterFile ? posterFile.filename : null,
      videoPath: videoFile.filename,
      videoOriginalName: videoFile.originalname,
      videoMimeType: videoFile.mimetype || 'video/mp4',
      videoSize: videoFile.size || 0
    };

    let movie;
    try {
      movie = await Movie.create(movieData);
    } catch (dbError) {
      // Clean up files immediately to prevent orphaned files
      cleanupUploadedFiles(req.files);
      throw dbError;
    }

    res.status(201).json({
      success: true,
      data: movie
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/movies/:id
 * @desc    Update movie metadata and optionally replace files
 */
export const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      cleanupUploadedFiles(req.files);
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    const { title, description, releaseYear, genre, runtime } = req.body;

    if (title && title.trim()) movie.title = title.trim();
    if (description !== undefined) movie.description = description.trim();
    if (releaseYear !== undefined) movie.releaseYear = releaseYear ? parseInt(releaseYear, 10) : undefined;
    if (genre !== undefined) movie.genre = genre.trim() || 'General';
    if (runtime !== undefined) movie.runtime = runtime ? parseInt(runtime, 10) : undefined;

    // Handle poster replacement
    const newPoster = req.files?.poster?.[0];
    if (newPoster) {
      // Safely delete old poster file if existed
      if (movie.posterPath) {
        deleteFileSafely(getPosterPath(movie.posterPath));
      }
      movie.posterPath = newPoster.filename;
    }

    // Handle video replacement
    const newVideo = req.files?.video?.[0];
    if (newVideo) {
      // Safely delete old video file
      if (movie.videoPath) {
        deleteFileSafely(getVideoPath(movie.videoPath));
      }
      movie.videoPath = newVideo.filename;
      movie.videoOriginalName = newVideo.originalname;
      movie.videoMimeType = newVideo.mimetype || 'video/mp4';
      movie.videoSize = newVideo.size || 0;
    }

    await movie.save();

    res.status(200).json({
      success: true,
      data: movie
    });
  } catch (error) {
    cleanupUploadedFiles(req.files);
    next(error);
  }
};

/**
 * @route   DELETE /api/movies/:id
 * @desc    Delete movie and remove its poster and video files
 */
export const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    // Delete associated files from disk safely
    if (movie.posterPath) {
      deleteFileSafely(getPosterPath(movie.posterPath));
    }
    if (movie.videoPath) {
      deleteFileSafely(getVideoPath(movie.videoPath));
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Movie and associated files deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/movies/:id/stream
 * @desc    Stream video file supporting HTTP range requests for efficient seeking
 */
export const streamMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    const videoPath = getVideoPath(movie.videoPath);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        error: 'Video file missing from server storage'
      });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const mimeType = movie.videoMimeType || 'video/mp4';

    if (range) {
      // Parse Range header e.g. "bytes=32324-" or "bytes=0-1000"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      
      // Default chunk size is ~2MB for smooth responsive streaming
      const CHUNK_SIZE = 2 * 1024 * 1024;
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE, fileSize - 1);

      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`
        });
        return res.end();
      }

      const contentLength = end - start + 1;
      const fileStream = fs.createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': mimeType
      });

      fileStream.pipe(res);

      fileStream.on('error', (streamErr) => {
        console.error('[Stream Error]', streamErr);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
    } else {
      // Entire file stream when no range is requested
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes'
      });

      const fileStream = fs.createReadStream(videoPath);
      fileStream.pipe(res);

      fileStream.on('error', (streamErr) => {
        console.error('[Stream Error]', streamErr);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/movies/:id/download
 * @desc    Download the movie video file with safe Content-Disposition header
 */
export const downloadMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    const videoPath = getVideoPath(movie.videoPath);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        error: 'Video file missing from server storage'
      });
    }

    // Determine clean, human-friendly download name
    const ext = path.extname(movie.videoPath) || '.mp4';
    const safeTitle = (movie.title || 'movie')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const downloadName = `${safeTitle}${ext}`;

    res.download(videoPath, downloadName, (err) => {
      if (err && !res.headersSent) {
        console.error('[Download Error]', err.message);
        res.status(500).json({
          success: false,
          error: 'Error downloading file'
        });
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/movies/stats/overview
 * @desc    Get library statistics (total movies, storage used, genres, etc.)
 */
export const getLibraryStats = async (req, res, next) => {
  try {
    const movies = await Movie.find();
    const totalCount = movies.length;
    const totalBytes = movies.reduce((acc, m) => acc + (m.videoSize || 0), 0);
    const totalRuntimeMinutes = movies.reduce((acc, m) => acc + (m.runtime || 0), 0);
    
    // Unique genres
    const genreSet = new Set();
    movies.forEach((m) => {
      if (m.genre) {
        m.genre.split(',').forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) genreSet.add(trimmed);
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalMovies: totalCount,
        totalStorageBytes: totalBytes,
        totalStorageMB: (totalBytes / (1024 * 1024)).toFixed(2),
        totalStorageGB: (totalBytes / (1024 * 1024 * 1024)).toFixed(2),
        totalRuntimeMinutes,
        genres: Array.from(genreSet),
        storagePaths: {
          videos: VIDEO_DIR,
          posters: POSTER_DIR
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
