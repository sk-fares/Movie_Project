import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cinevault_secret_jwt_key_2026_super_secure';

/**
 * Middleware: Verify Bearer JWT and attach authenticated user to req.user
 */
export const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to CineVault.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or user account not found. Please log in again.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please log in again.'
    });
  }
};

/**
 * Middleware: Optional token verification (attaches req.user if valid token provided)
 */
export const optionalToken = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
};

/**
 * Middleware: Enforces that req.user is an 'owner'
 * Returns 403 Forbidden for viewers or unauthenticated requests
 */
export const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.'
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Only the CineVault owner can upload, edit, or delete movies.'
    });
  }

  next();
};
