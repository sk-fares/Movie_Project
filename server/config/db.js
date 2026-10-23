import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Railway provides MONGO_URL or MONGODB_URL, standard is MONGO_URI
    const uri =
      process.env.MONGO_URI ||
      process.env.MONGO_URL ||
      process.env.MONGODB_URL ||
      'mongodb://127.0.0.1:27017/movielibrary';

    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // In production on cloud hosts, retry after a few seconds instead of crashing immediately
    if (process.env.NODE_ENV === 'production') {
      console.log('[MongoDB] Retrying connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from server');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err);
});
