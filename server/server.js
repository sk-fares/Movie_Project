import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import movieRoutes from './routes/movieRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { POSTER_DIR, ensureUploadDirs } from './utils/fileHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure required upload folders exist
ensureUploadDirs();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve movie posters statically (never expose raw video files directly)
app.use('/uploads/posters', express.static(POSTER_DIR));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CineVault API'
  });
});

// Mount movie API routes
app.use('/api/movies', movieRoutes);

// In production or when client/dist exists, serve built React frontend
const clientDist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // Any non-API route serves the frontend index.html
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // 404 handler for unknown routes in dev
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Cannot ${req.method} ${req.url} - Endpoint not found`
    });
  });
}

// Centralized error handling middleware
app.use(errorHandler);

// Connect to MongoDB and start HTTP listener
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[CineVault Server] Running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`[Server Start Error]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
