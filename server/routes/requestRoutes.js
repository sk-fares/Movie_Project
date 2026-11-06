import express from 'express';
import {
  getRequests,
  createRequest,
  toggleUpvote,
  deleteRequest,
  updateStatus
} from '../controllers/requestController.js';
import { verifyToken, optionalToken, requireOwner } from '../middleware/auth.js';
import { verifyInviteOrAuth } from '../middleware/inviteAuth.js';

const router = express.Router();

// View all requests and check quota (requires active invite pass or login)
router.get('/', verifyInviteOrAuth, getRequests);

// Authenticated: Submit a suggestion (rate-limited to 2/24h)
router.post('/', verifyToken, createRequest);

// Authenticated: Upvote/Like an existing suggestion
router.post('/:id/upvote', verifyToken, toggleUpvote);

// Owner Only: Delete suggestion
router.delete('/:id', verifyToken, requireOwner, deleteRequest);

// Owner Only: Update status (pending, added, declined)
router.patch('/:id/status', verifyToken, requireOwner, updateStatus);

export default router;
