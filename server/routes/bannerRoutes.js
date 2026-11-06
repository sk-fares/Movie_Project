import express from 'express';
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner
} from '../controllers/bannerController.js';
import { verifyToken, requireOwner } from '../middleware/auth.js';
import { verifyInviteOrAuth } from '../middleware/inviteAuth.js';

const router = express.Router();

// Public: Get active banners for landing page hero carousel (Requires invite pass or login)
router.get('/', verifyInviteOrAuth, getActiveBanners);

// Owner-protected: Get all banners for Admin panel
router.get('/all', verifyToken, requireOwner, getAllBanners);

// Owner-protected: CRUD operations for hero banners
router.post('/', verifyToken, requireOwner, createBanner);
router.put('/:id', verifyToken, requireOwner, updateBanner);
router.delete('/:id', verifyToken, requireOwner, deleteBanner);

export default router;
