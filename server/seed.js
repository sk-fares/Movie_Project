import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import https from 'https';
import mongoose from 'mongoose';
import { Movie } from './models/Movie.js';
import { POSTER_DIR, VIDEO_DIR, ensureUploadDirs } from './utils/fileHelper.js';

ensureUploadDirs();

// High quality poster images (Unsplash cinematic photos saved locally for offline resilience)
const sampleMovies = [
  {
    title: 'Interstellar Odyssey',
    description: 'A team of explorers travel through a newly discovered wormhole in an effort to ensure humanity’s survival across uncharted galaxies.',
    releaseYear: 2024,
    genre: 'Sci-Fi',
    runtime: 148,
    posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
    fallbackColor: '#0a192f'
  },
  {
    title: 'Cyberpunk 2099: Neon Horizon',
    description: 'In a dystopian metropolis bathed in neon rain, an augmented investigator hunts down a rogue synthetic intelligence before the grid collapses.',
    releaseYear: 2023,
    genre: 'Action',
    runtime: 118,
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    fallbackColor: '#2b0938'
  },
  {
    title: 'The Silent Alpine',
    description: 'A breathtaking documentary capturing the remote untouched peaks of the European Alps through all four extreme seasons.',
    releaseYear: 2022,
    genre: 'Documentary',
    runtime: 92,
    posterUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    fallbackColor: '#1a365d'
  }
];

// Public domain CC0 sample MP4 video (~1.1MB, fast & reliable)
const SAMPLE_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const SAMPLE_VIDEO_FILENAME = 'sample_showcase_video.mp4';

// Helper to download a file from URL
const downloadFile = (url, destPath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      // Follow redirects if needed
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`HTTP status ${response.statusCode} while downloading ${url}`));
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
};

// Generate an SVG poster if remote download is unavailable
const createFallbackPoster = (title, color, destPath) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#050505;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="600" height="900" fill="url(#grad)" />
    <circle cx="300" cy="400" r="90" fill="#E50914" opacity="0.8" />
    <polygon points="280,360 340,400 280,440" fill="#ffffff" />
    <text x="50%" y="650" font-family="system-ui, sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="50%" y="700" font-family="system-ui, sans-serif" font-size="20" fill="#aaaaaa" text-anchor="middle">Personal Movie Library</text>
  </svg>`;
  fs.writeFileSync(destPath, svg, 'utf-8');
};

const runSeed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/movielibrary';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Ensuring sample video file exists...');
    const videoDest = path.join(VIDEO_DIR, SAMPLE_VIDEO_FILENAME);

    if (!fs.existsSync(videoDest)) {
      try {
        console.log(`[Seed] Downloading sample video from ${SAMPLE_VIDEO_URL}...`);
        await downloadFile(SAMPLE_VIDEO_URL, videoDest);
        console.log('[Seed] Sample video downloaded successfully.');
      } catch (dlErr) {
        console.warn(`[Seed] Warning: Could not download remote video (${dlErr.message}). Creating a synthetic dummy video for testing.`);
        // Write minimal dummy mp4 container
        fs.writeFileSync(videoDest, Buffer.from([
          0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
          0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
          0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31
        ]));
      }
    } else {
      console.log('[Seed] Sample video already exists.');
    }

    const videoStat = fs.statSync(videoDest);

    console.log('[Seed] Clearing previous movie entries...');
    await Movie.deleteMany({});

    console.log('[Seed] Populating sample movies with posters...');
    for (let i = 0; i < sampleMovies.length; i++) {
      const movieInfo = sampleMovies[i];
      const posterFileName = `seed_poster_${i + 1}.jpg`;
      const posterPath = path.join(POSTER_DIR, posterFileName);

      try {
        await downloadFile(movieInfo.posterUrl, posterPath);
      } catch (err) {
        const svgFallbackName = `seed_poster_${i + 1}.svg`;
        const svgPath = path.join(POSTER_DIR, svgFallbackName);
        createFallbackPoster(movieInfo.title, movieInfo.fallbackColor, svgPath);
      }

      const finalPosterName = fs.existsSync(posterPath) ? posterFileName : `seed_poster_${i + 1}.svg`;

      await Movie.create({
        title: movieInfo.title,
        description: movieInfo.description,
        releaseYear: movieInfo.releaseYear,
        genre: movieInfo.genre,
        runtime: movieInfo.runtime,
        posterPath: finalPosterName,
        videoPath: SAMPLE_VIDEO_FILENAME,
        videoOriginalName: `${movieInfo.title.toLowerCase().replace(/\s+/g, '_')}.mp4`,
        videoMimeType: 'video/mp4',
        videoSize: videoStat.size
      });

      console.log(`[Seed] Created movie: "${movieInfo.title}" (${movieInfo.genre})`);
    }

    console.log('[Seed] Database successfully seeded with sample movies!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

runSeed();
