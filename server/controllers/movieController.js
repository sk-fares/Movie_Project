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
import {
  isR2Configured,
  uploadFileToR2,
  deleteFileFromR2,
  getR2ObjectStream
} from '../utils/r2Storage.js';

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
 * @desc    Create a new movie entry with uploaded files (Local or Cloudflare R2)
 */
export const createMovie = async (req, res, next) => {
  try {
    const { title, description, releaseYear, genre, runtime, directVideoUrl, directPosterUrl } = req.body;

    // Validate title
    if (!title || !title.trim()) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        error: 'Movie title is required'
      });
    }

    const videoFile = req.files?.video?.[0];
    const posterFile = req.files?.poster?.[0];

    // Check if video file or direct URL provided
    if (!videoFile && !directVideoUrl) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        error: 'A movie video file or streaming URL is required'
      });
    }

    let finalPosterPath = directPosterUrl || null;
    let finalVideoPath = directVideoUrl || null;
    let storageType = directVideoUrl ? 'external' : 'local';
    let videoSize = videoFile?.size || 0;
    let videoMimeType = videoFile?.mimetype || 'video/mp4';
    let videoOriginalName = videoFile?.originalname || '';

    // If Cloudflare R2 is configured and file was uploaded, upload to R2
    if (videoFile && isR2Configured()) {
      try {
        console.log(`[R2] Uploading video to Cloudflare R2: ${videoFile.filename}`);
        const r2VideoKey = `videos/${videoFile.filename}`;
        const r2VideoUrl = await uploadFileToR2(videoFile.path, r2VideoKey, videoMimeType);
        finalVideoPath = r2VideoUrl;
        storageType = 'r2';

        // Delete temporary local video file after R2 upload
        deleteFileSafely(videoFile.path);

        // Upload poster to R2 if provided
        if (posterFile) {
          console.log(`[R2] Uploading poster to Cloudflare R2: ${posterFile.filename}`);
          const r2PosterKey = `posters/${posterFile.filename}`;
          const r2PosterUrl = await uploadFileToR2(posterFile.path, r2PosterKey, posterFile.mimetype || 'image/jpeg');
          finalPosterPath = r2PosterUrl;
          deleteFileSafely(posterFile.path);
        }
      } catch (r2Error) {
        console.error('[R2 Upload Error]:', r2Error);
        cleanupUploadedFiles(req.files);
        return res.status(500).json({
          success: false,
          error: `Cloudflare R2 upload error: ${r2Error.message}`
        });
      }
    } else {
      // Local disk storage fallback
      if (posterFile) finalPosterPath = posterFile.filename;
      if (videoFile) finalVideoPath = videoFile.filename;
    }

    const movieData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : undefined,
      genre: genre ? genre.trim() : 'General',
      runtime: runtime ? parseInt(runtime, 10) : undefined,
      posterPath: finalPosterPath,
      videoPath: finalVideoPath,
      videoOriginalName,
      videoMimeType,
      videoSize,
      storageType
    };

    let movie;
    try {
      movie = await Movie.create(movieData);
    } catch (dbError) {
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

    const { title, description, releaseYear, genre, runtime, directVideoUrl, directPosterUrl } = req.body;

    if (title && title.trim()) movie.title = title.trim();
    if (description !== undefined) movie.description = description.trim();
    if (releaseYear !== undefined) movie.releaseYear = releaseYear ? parseInt(releaseYear, 10) : undefined;
    if (genre !== undefined) movie.genre = genre.trim() || 'General';
    if (runtime !== undefined) movie.runtime = runtime ? parseInt(runtime, 10) : undefined;

    // Handle poster replacement
    const newPoster = req.files?.poster?.[0];
    if (newPoster) {
      if (isR2Configured()) {
        const r2PosterKey = `posters/${newPoster.filename}`;
        const r2PosterUrl = await uploadFileToR2(newPoster.path, r2PosterKey, newPoster.mimetype || 'image/jpeg');
        // Delete old poster if was in R2
        if (movie.posterPath && movie.posterPath.includes('posters/')) {
          deleteFileFromR2(movie.posterPath.split('/').slice(-2).join('/'));
        }
        deleteFileSafely(newPoster.path);
        movie.posterPath = r2PosterUrl;
      } else {
        if (movie.posterPath) deleteFileSafely(getPosterPath(movie.posterPath));
        movie.posterPath = newPoster.filename;
      }
    } else if (directPosterUrl) {
      movie.posterPath = directPosterUrl;
    }

    // Handle video replacement
    const newVideo = req.files?.video?.[0];
    if (newVideo) {
      if (isR2Configured()) {
        const r2VideoKey = `videos/${newVideo.filename}`;
        const r2VideoUrl = await uploadFileToR2(newVideo.path, r2VideoKey, newVideo.mimetype || 'video/mp4');
        if (movie.videoPath && movie.videoPath.includes('videos/')) {
          deleteFileFromR2(movie.videoPath.split('/').slice(-2).join('/'));
        }
        deleteFileSafely(newVideo.path);
        movie.videoPath = r2VideoUrl;
        movie.storageType = 'r2';
      } else {
        if (movie.videoPath) deleteFileSafely(getVideoPath(movie.videoPath));
        movie.videoPath = newVideo.filename;
        movie.storageType = 'local';
      }
      movie.videoOriginalName = newVideo.originalname;
      movie.videoMimeType = newVideo.mimetype || 'video/mp4';
      movie.videoSize = newVideo.size || 0;
    } else if (directVideoUrl) {
      movie.videoPath = directVideoUrl;
      movie.storageType = 'external';
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

    // Clean up Cloudflare R2 files
    if (movie.storageType === 'r2' || isR2Configured()) {
      if (movie.posterPath && movie.posterPath.includes('posters/')) {
        const posterKey = movie.posterPath.split('/').slice(-2).join('/');
        await deleteFileFromR2(posterKey);
      }
      if (movie.videoPath && movie.videoPath.includes('videos/')) {
        const videoKey = movie.videoPath.split('/').slice(-2).join('/');
        await deleteFileFromR2(videoKey);
      }
    }

    // Clean up local disk files if any existed
    if (movie.posterPath) deleteFileSafely(getPosterPath(movie.posterPath));
    if (movie.videoPath) deleteFileSafely(getVideoPath(movie.videoPath));

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
 * @desc    Stream video file supporting Cloudflare R2 CDN and HTTP byte-range requests
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

    const requestedQuality = req.query.quality; // '480p', '360p', '720p', '1080p', 'auto'

    // If video is a direct CDN link (e.g. Cloudinary, Cloudflare R2, or external CDN URL)
    if (movie.videoPath.startsWith('http://') || movie.videoPath.startsWith('https://')) {
      let streamUrl = movie.videoPath;

      // Cloudinary on-the-fly resolution & quality downscaling
      if (streamUrl.includes('cloudinary.com') && requestedQuality && requestedQuality !== 'auto') {
        let transformStr = '';
        if (requestedQuality === '480p') {
          transformStr = 'w_854,c_limit,q_auto:eco,vc_h264';
        } else if (requestedQuality === '360p') {
          transformStr = 'w_640,c_limit,q_auto:low,vc_h264';
        } else if (requestedQuality === '720p') {
          transformStr = 'w_1280,c_limit,q_auto,vc_h264';
        } else if (requestedQuality === '1080p') {
          transformStr = 'w_1920,c_limit,q_auto,vc_h264';
        }

        if (transformStr) {
          if (streamUrl.includes('/video/upload/')) {
            streamUrl = streamUrl.replace('/video/upload/', `/video/upload/${transformStr}/`);
          } else if (streamUrl.includes('/upload/')) {
            streamUrl = streamUrl.replace('/upload/', `/upload/${transformStr}/`);
          }
        }
      }

      // Redirect to the stream URL so the browser streams directly from CDN
      return res.redirect(302, streamUrl);
    }

    // Local Disk Streaming with HTTP 206 Byte Ranges
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
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunk
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE, fileSize - 1);

      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).set({ 'Content-Range': `bytes */${fileSize}` });
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
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(videoPath).pipe(res);
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

    // If stored on Cloudflare R2 CDN, redirect to download
    if (movie.videoPath.startsWith('http://') || movie.videoPath.startsWith('https://')) {
      return res.redirect(302, movie.videoPath);
    }

    const videoPath = getVideoPath(movie.videoPath);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        error: 'Video file missing from server storage'
      });
    }

    const ext = path.extname(movie.videoPath) || '.mp4';
    const safeTitle = (movie.title || 'movie')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const downloadName = `${safeTitle}${ext}`;

    res.download(videoPath, downloadName);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/movies/stats/overview
 * @desc    Get library statistics
 */
export const getLibraryStats = async (req, res, next) => {
  try {
    const movies = await Movie.find();
    const totalCount = movies.length;
    const totalBytes = movies.reduce((acc, m) => acc + (m.videoSize || 0), 0);
    const totalRuntimeMinutes = movies.reduce((acc, m) => acc + (m.runtime || 0), 0);

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
        cloudStorageEnabled: isR2Configured(),
        storagePaths: {
          videos: isR2Configured() ? 'Cloudflare R2 Bucket' : VIDEO_DIR,
          posters: isR2Configured() ? 'Cloudflare R2 Bucket' : POSTER_DIR
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
