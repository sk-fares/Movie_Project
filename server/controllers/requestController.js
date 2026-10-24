import { MovieRequest } from '../models/MovieRequest.js';

const DAILY_REQUEST_LIMIT = 2;

/**
 * @route   GET /api/requests
 * @desc    Get all community movie suggestions and calling user's daily quota
 * @access  Public / Optional Auth
 */
export const getRequests = async (req, res, next) => {
  try {
    const requests = await MovieRequest.find()
      .sort({ createdAt: -1 })
      .lean();

    const userId = req.user ? req.user._id.toString() : null;

    let userTodayCount = 0;
    if (userId) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      userTodayCount = await MovieRequest.countDocuments({
        user: req.user._id,
        createdAt: { $gte: twentyFourHoursAgo }
      });
    }

    const formatted = requests.map((item) => ({
      _id: item._id,
      title: item.title,
      releaseYear: item.releaseYear,
      notes: item.notes,
      username: item.username,
      userId: item.user.toString(),
      isOwnRequest: userId ? item.user.toString() === userId : false,
      status: item.status,
      upvotesCount: Array.isArray(item.upvotes) ? item.upvotes.length : 0,
      hasUpvoted: userId && Array.isArray(item.upvotes)
        ? item.upvotes.some((uid) => uid.toString() === userId)
        : false,
      createdAt: item.createdAt
    }));

    res.status(200).json({
      success: true,
      data: formatted,
      quota: {
        dailyLimit: DAILY_REQUEST_LIMIT,
        usedToday: userTodayCount,
        remainingToday: Math.max(0, DAILY_REQUEST_LIMIT - userTodayCount)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/requests
 * @desc    Submit a new movie recommendation (max 2 per user every 24h)
 * @access  Private (Authenticated Viewers and Owner)
 */
export const createRequest = async (req, res, next) => {
  try {
    const { title, releaseYear, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Movie title is required.'
      });
    }

    // Anti-spam 24-hour rate limit check
    const isOwner = req.user.role === 'owner';
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const userCount = await MovieRequest.countDocuments({
      user: req.user._id,
      createdAt: { $gte: twentyFourHoursAgo }
    });

    if (!isOwner && userCount >= DAILY_REQUEST_LIMIT) {
      return res.status(429).json({
        success: false,
        error: `Daily limit reached! You can suggest up to ${DAILY_REQUEST_LIMIT} movies every 24 hours to prevent spam. Please wait until tomorrow.`
      });
    }

    const newRequest = await MovieRequest.create({
      title: title.trim(),
      releaseYear: releaseYear ? parseInt(releaseYear, 10) : null,
      notes: notes ? notes.trim() : '',
      user: req.user._id,
      username: req.user.username || 'Friend',
      status: 'pending',
      upvotes: [req.user._id] // Creator automatically upvotes their own suggestion
    });

    res.status(201).json({
      success: true,
      data: newRequest,
      message: 'Movie suggestion submitted successfully!'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/requests/:id/upvote
 * @desc    Toggle upvote for a movie suggestion
 * @access  Private (Authenticated)
 */
export const toggleUpvote = async (req, res, next) => {
  try {
    const item = await MovieRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const userId = req.user._id;
    const existingIndex = item.upvotes.findIndex(
      (uid) => uid.toString() === userId.toString()
    );

    let hasUpvoted = false;
    if (existingIndex > -1) {
      item.upvotes.splice(existingIndex, 1);
      hasUpvoted = false;
    } else {
      item.upvotes.push(userId);
      hasUpvoted = true;
    }

    await item.save();

    res.status(200).json({
      success: true,
      hasUpvoted,
      upvotesCount: item.upvotes.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/requests/:id
 * @desc    Delete a movie suggestion
 * @access  Private (Owner only)
 */
export const deleteRequest = async (req, res, next) => {
  try {
    const item = await MovieRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    await MovieRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Movie recommendation deleted.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/requests/:id/status
 * @desc    Update status of a request (e.g. marked as 'added' or 'pending')
 * @access  Private (Owner only)
 */
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'added', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, added, or declined.'
      });
    }

    const item = await MovieRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    item.status = status;
    await item.save();

    res.status(200).json({
      success: true,
      data: item,
      message: `Status updated to ${status}.`
    });
  } catch (error) {
    next(error);
  }
};
