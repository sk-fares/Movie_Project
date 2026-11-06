import crypto from 'crypto';
import { InviteCode } from '../models/InviteCode.js';

/**
 * Validate an invite code entered by a visitor
 * Route: POST /api/invites/validate
 * Public (Rate limited)
 */
export const validateInvite = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter an invite code.'
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    const invite = await InviteCode.findOne({ code: normalizedCode });

    if (!invite) {
      return res.status(400).json({
        success: false,
        error: 'Invalid invite code. Please check and try again.'
      });
    }

    if (!invite.isActive) {
      return res.status(400).json({
        success: false,
        error: 'This invite code has been deactivated by the owner.'
      });
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'This invite code has expired.'
      });
    }

    if (invite.maxUses !== null && invite.maxUses > 0 && invite.usedCount >= invite.maxUses) {
      return res.status(400).json({
        success: false,
        error: 'This invite code has reached its maximum allowed uses.'
      });
    }

    // Increment used count and update lastUsedAt
    invite.usedCount = (invite.usedCount || 0) + 1;
    invite.lastUsedAt = new Date();
    await invite.save();

    // 7-day browser access pass duration in milliseconds
    const passDurationMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + passDurationMs;

    res.status(200).json({
      success: true,
      message: 'Invite verified! 7 days full access granted to CineVault.',
      data: {
        code: invite.code,
        label: invite.label,
        validDays: 7,
        expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invite codes with summary metrics
 * Route: GET /api/invites
 * Owner only
 */
export const getAllInvites = async (req, res, next) => {
  try {
    const invites = await InviteCode.find().sort({ createdAt: -1 });

    const totalCodes = invites.length;
    const activeCodes = invites.filter((inv) => inv.isValid()).length;
    const totalUses = invites.reduce((sum, inv) => sum + (inv.usedCount || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        totalCodes,
        activeCodes,
        totalUses
      },
      data: invites
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a random clean alphanumeric code
 */
const generateRandomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid easily confused 0, O, 1, I
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CINE-${randomPart}`;
};

/**
 * Create a new invite code
 * Route: POST /api/invites
 * Owner only
 */
export const createInvite = async (req, res, next) => {
  try {
    let { code, label, maxUses, expiresAt, isActive } = req.body;

    if (!code || !code.trim()) {
      code = generateRandomCode();
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check for duplicate
    const existing = await InviteCode.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `An invite code "${normalizedCode}" already exists.`
      });
    }

    // Clean maxUses
    let parsedMaxUses = null;
    if (maxUses !== undefined && maxUses !== '' && maxUses !== null) {
      const num = parseInt(maxUses, 10);
      if (!isNaN(num) && num > 0) {
        parsedMaxUses = num;
      }
    }

    // Clean expiresAt
    let parsedExpiresAt = null;
    if (expiresAt) {
      const date = new Date(expiresAt);
      if (!isNaN(date.getTime())) {
        parsedExpiresAt = date;
      }
    }

    const invite = new InviteCode({
      code: normalizedCode,
      label: (label || '').trim(),
      maxUses: parsedMaxUses,
      expiresAt: parsedExpiresAt,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdBy: req.user?._id || null
    });

    await invite.save();

    res.status(201).json({
      success: true,
      message: 'Invite code created successfully.',
      data: invite
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing invite code
 * Route: PUT /api/invites/:id
 * Owner only
 */
export const updateInvite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, label, maxUses, expiresAt, isActive } = req.body;

    const invite = await InviteCode.findById(id);
    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invite code not found.'
      });
    }

    if (code && code.trim()) {
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode !== invite.code) {
        const duplicate = await InviteCode.findOne({
          code: normalizedCode,
          _id: { $ne: id }
        });
        if (duplicate) {
          return res.status(409).json({
            success: false,
            error: `Another invite code with "${normalizedCode}" already exists.`
          });
        }
        invite.code = normalizedCode;
      }
    }

    if (label !== undefined) {
      invite.label = (label || '').trim();
    }

    if (maxUses !== undefined) {
      if (maxUses === '' || maxUses === null || maxUses === 0) {
        invite.maxUses = null;
      } else {
        const num = parseInt(maxUses, 10);
        invite.maxUses = !isNaN(num) && num > 0 ? num : null;
      }
    }

    if (expiresAt !== undefined) {
      if (!expiresAt) {
        invite.expiresAt = null;
      } else {
        const date = new Date(expiresAt);
        invite.expiresAt = !isNaN(date.getTime()) ? date : null;
      }
    }

    if (isActive !== undefined) {
      invite.isActive = Boolean(isActive);
    }

    await invite.save();

    res.status(200).json({
      success: true,
      message: 'Invite code updated successfully.',
      data: invite
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an invite code
 * Route: DELETE /api/invites/:id
 * Owner only
 */
export const deleteInvite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invite = await InviteCode.findById(id);

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invite code not found.'
      });
    }

    await InviteCode.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Invite code ${invite.code} was deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Startup Hook: Ensure at least one default invite code exists in MongoDB
 */
export const seedDefaultInviteCode = async () => {
  try {
    const count = await InviteCode.countDocuments();
    if (count === 0) {
      const defaultCode = (process.env.DEFAULT_INVITE_CODE || 'CINEVAULT2026').trim().toUpperCase();
      const initialInvite = new InviteCode({
        code: defaultCode,
        label: 'VIP Master Code (Default Initial Access)',
        maxUses: null, // Unlimited
        isActive: true,
        expiresAt: null
      });
      await initialInvite.save();
      console.log(`[CineVault Invites] Seeded initial default invite code: ${defaultCode}`);
    }
  } catch (err) {
    console.error(`[CineVault Invite Seed Error]: ${err.message}`);
  }
};
