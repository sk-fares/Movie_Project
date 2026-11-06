import express from 'express';
import {
  validateInvite,
  getAllInvites,
  createInvite,
  updateInvite,
  deleteInvite
} from '../controllers/inviteController.js';
import { verifyToken, requireOwner } from '../middleware/auth.js';
import { inviteValidateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public: Validate invite code (Brute-force protected by inviteValidateLimiter)
router.post('/validate', inviteValidateLimiter, validateInvite);

// Owner Only: Manage invite codes
router.get('/', verifyToken, requireOwner, getAllInvites);
router.post('/', verifyToken, requireOwner, createInvite);
router.put('/:id', verifyToken, requireOwner, updateInvite);
router.delete('/:id', verifyToken, requireOwner, deleteInvite);

export default router;
