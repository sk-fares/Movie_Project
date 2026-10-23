import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDB } from './config/db.js';
import movieRoutes from './routes/movieRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { POSTER_DIR, ensureUploadDirs } from './utils/fileHelper.js';

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
    service: 'Personal Movie Library API'
  });
});

// Mount movie API routes
app.use('/api/movies', movieRoutes);

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.url} - Endpoint not found`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

// Connect to MongoDB and start HTTP listener
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[CineVault Server] Running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`[Server Start Error]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
