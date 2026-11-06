import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 * Allows up to 300 requests per 15 minutes per IP.
 * Skips video chunk streaming (/stream) so watching video playback is not interrupted.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip video stream chunk requests and CORS preflight requests
    return (
      req.method === 'OPTIONS' ||
      req.url.includes('/stream') ||
      req.originalUrl.includes('/stream')
    );
  },
  message: {
    success: false,
    error: 'Too many requests from this network. Please slow down and try again in a few minutes.'
  }
});

/**
 * Authentication Rate Limiter (Login & Register)
 * Prevents credential brute-forcing and spam registrations.
 * Max 15 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many sign-in attempts. For security, please wait 15 minutes before trying again.'
  }
});
