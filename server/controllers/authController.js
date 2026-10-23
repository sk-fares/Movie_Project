import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cinevault_secret_jwt_key_2026_super_secure';

// Helper: Generate signed JWT token
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Register a new Viewer user
 * Route: POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a username, email, and password.'
      });
    }

    const trimmedUsername = username.trim();
    const normalizedEmail = email.toLowerCase().trim();

    if (trimmedUsername.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters long.'
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address (e.g. name@gmail.com).'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    // Check for existing user with identical username or email
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: trimmedUsername }]
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists. Please log in.'
        });
      }
      return res.status(409).json({
        success: false,
        error: 'This username is already taken. Please choose another.'
      });
    }

    // Public registrations are always assigned 'viewer' role
    const user = new User({
      username: trimmedUsername,
      email: normalizedEmail,
      password,
      role: 'viewer'
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        watchlist: user.watchlist,
        watchProgress: user.watchProgress
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in with Username or Email and Password
 * Route: POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your username/email and password.'
      });
    }

    const trimmedIdentifier = identifier.trim();

    // Match by lowercase email or case-insensitive username
    const user = await User.findOne({
      $or: [
        { email: trimmedIdentifier.toLowerCase() },
        { username: { $regex: new RegExp(`^${trimmedIdentifier}$`, 'i') } }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password.'
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        watchlist: user.watchlist,
        watchProgress: user.watchProgress
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * Route: GET /api/auth/me
 */
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      watchlist: req.user.watchlist,
      watchProgress: req.user.watchProgress
    }
  });
};

/**
 * Update personal watch progress in database
 * Route: POST /api/auth/progress
 */
export const updateProgress = async (req, res, next) => {
  try {
    const { movieId, currentTime, duration } = req.body;

    if (!movieId || isNaN(currentTime) || isNaN(duration)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid playback progress data provided.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const percentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

    // If watched >= 95% or reset to 0, remove from active continue watching
    if (percentage >= 95) {
      user.watchProgress = user.watchProgress.filter(
        (item) => item.movieId.toString() !== movieId.toString()
      );
    } else if (currentTime >= 5) {
      const existingIndex = user.watchProgress.findIndex(
        (item) => item.movieId.toString() === movieId.toString()
      );

      if (existingIndex > -1) {
        user.watchProgress[existingIndex].currentTime = Math.floor(currentTime);
        user.watchProgress[existingIndex].duration = Math.floor(duration);
        user.watchProgress[existingIndex].percentage = percentage;
        user.watchProgress[existingIndex].updatedAt = new Date();
      } else {
        user.watchProgress.push({
          movieId,
          currentTime: Math.floor(currentTime),
          duration: Math.floor(duration),
          percentage,
          updatedAt: new Date()
        });
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      watchProgress: user.watchProgress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle movie in user's personal watchlist
 * Route: POST /api/auth/watchlist/:movieId
 */
export const toggleWatchlist = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const index = user.watchlist.findIndex(
      (id) => id.toString() === movieId.toString()
    );

    let isAdded = false;
    if (index > -1) {
      user.watchlist.splice(index, 1);
      isAdded = false;
    } else {
      user.watchlist.push(movieId);
      isAdded = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      inWatchlist: isAdded,
      watchlist: user.watchlist
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Startup Hook: Ensure default Owner account exists in MongoDB
 */
export const seedDefaultOwner = async () => {
  try {
    const ownerEmail = (process.env.OWNER_EMAIL || 'skfares80@gmail.com').toLowerCase().trim();
    const ownerUsername = (process.env.OWNER_USERNAME || 'owner').trim();
    const ownerPassword = process.env.OWNER_PASSWORD || 'Owner@CineVault2026';

    let owner = await User.findOne({
      $or: [{ email: ownerEmail }, { role: 'owner' }]
    });

    if (!owner) {
      owner = new User({
        username: ownerUsername,
        email: ownerEmail,
        password: ownerPassword,
        role: 'owner'
      });
      await owner.save();
      console.log(`[CineVault Auth] Seeded default Owner account: ${ownerEmail} (Username: ${ownerUsername})`);
    } else {
      // Ensure existing owner has 'owner' role and username
      let modified = false;
      if (owner.role !== 'owner') {
        owner.role = 'owner';
        modified = true;
      }
      if (owner.email !== ownerEmail) {
        owner.email = ownerEmail;
        modified = true;
      }
      if (modified) {
        await owner.save();
      }
      console.log(`[CineVault Auth] Verified active Owner account: ${owner.email} (${owner.username})`);
    }
  } catch (err) {
    console.error(`[CineVault Auth Seed Error]: ${err.message}`);
  }
};
