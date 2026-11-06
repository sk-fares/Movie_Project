import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { InviteCode } from '../models/InviteCode.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cinevault_secret_jwt_key_2026_super_secure';

/**
 * Middleware: Verify that the caller either has an active Invite Code
 * OR has an authenticated session (Viewer or Owner).
 *
 * Checks:
 * 1. Authorization: Bearer <token>
 * 2. Header: x-invite-code: <code_string>
 * 3. Query Param: ?inviteCode=<code_string> (for <video> stream / download tags)
 */
export const verifyInviteOrAuth = async (req, res, next) => {
  try {
    // 1. Check Bearer JWT token
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      } catch {
        // If token fails, fall through to check invite code
      }
    }

    // 2. Check Invite Code from header or query param
    const codeParam = req.headers['x-invite-code'] || req.query.inviteCode;

    if (codeParam && typeof codeParam === 'string' && codeParam.trim()) {
      const normalized = codeParam.trim().toUpperCase();
      const invite = await InviteCode.findOne({ code: normalized });

      if (invite && invite.isValid()) {
        req.invite = invite;
        return next();
      }
    }

    // 3. Neither valid auth token nor valid invite code provided
    return res.status(403).json({
      success: false,
      error: 'Private CineVault access required. Please enter a valid 7-day invite code.',
      inviteRequired: true
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Access validation failed. Please check your invite code.',
      inviteRequired: true
    });
  }
};
