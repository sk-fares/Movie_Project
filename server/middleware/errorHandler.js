import multer from 'multer';

export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message);

  // Multer File Size Limit
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMB = process.env.MAX_FILE_SIZE_MB || 5120;
      return res.status(413).json({
        success: false,
        error: `File is too large. Maximum allowed size is ${maxMB} MB. You can adjust MAX_FILE_SIZE_MB in server/.env.`
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }

  // Mongoose Invalid ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({
      success: false,
      error: 'Movie not found (invalid ID format)'
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: messages.join(', ')
    });
  }

  // Custom client-friendly errors
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
