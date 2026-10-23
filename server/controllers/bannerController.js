import { Banner } from '../models/Banner.js';

/**
 * Get all active banners for landing page hero carousel (Public)
 * Route: GET /api/banners
 */
export const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .populate('movie');

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all banners including inactive ones for Admin Panel (Owner only)
 * Route: GET /api/banners/all
 */
export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find()
      .sort({ order: 1, createdAt: -1 })
      .populate('movie');

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new hero banner slide (Owner only)
 * Route: POST /api/banners
 */
export const createBanner = async (req, res, next) => {
  try {
    const { title, tagline, description, imageUrl, movie, linkUrl, order, isActive } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Banner title and thumbnail image URL are required.'
      });
    }

    const banner = new Banner({
      title: title.trim(),
      tagline: tagline ? tagline.trim() : 'Featured Movie',
      description: description ? description.trim() : '',
      imageUrl: imageUrl.trim(),
      movie: movie || null,
      linkUrl: linkUrl ? linkUrl.trim() : (movie ? `/watch/${movie}` : ''),
      order: Number(order) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    await banner.save();
    if (banner.movie) {
      await banner.populate('movie');
    }

    res.status(201).json({
      success: true,
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing banner slide (Owner only)
 * Route: PUT /api/banners/:id
 */
export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, tagline, description, imageUrl, movie, linkUrl, order, isActive } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        error: `Banner with ID "${id}" not found.`
      });
    }

    if (title !== undefined) banner.title = title.trim();
    if (tagline !== undefined) banner.tagline = tagline.trim();
    if (description !== undefined) banner.description = description.trim();
    if (imageUrl !== undefined) banner.imageUrl = imageUrl.trim();
    if (movie !== undefined) banner.movie = movie || null;
    if (linkUrl !== undefined) banner.linkUrl = linkUrl.trim();
    if (order !== undefined) banner.order = Number(order);
    if (isActive !== undefined) banner.isActive = Boolean(isActive);

    await banner.save();
    if (banner.movie) {
      await banner.populate('movie');
    }

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a banner slide (Owner only)
 * Route: DELETE /api/banners/:id
 */
export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        error: `Banner with ID "${id}" not found.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banner slide deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
