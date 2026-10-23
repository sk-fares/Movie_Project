import mongoose from 'mongoose';
import dns from 'dns';

// Ensure standard reliable DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  // If platform restricts setting DNS servers, continue gracefully
}

export const connectDB = async () => {
  try {
    const uri =
      process.env.MONGO_URI ||
      process.env.MONGO_URL ||
      process.env.MONGODB_URL ||
      'mongodb://127.0.0.1:27017/movielibrary';

    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
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
