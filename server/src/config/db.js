import mongoose from 'mongoose';
import config from './index.js';

let memoryServer = null;

/**
 * Connect to MongoDB.
 * Set USE_MEMORY_DB=true to spin up mongodb-memory-server (for local testing without Atlas/Docker).
 */
const connectDB = async (uri = config.mongoUri) => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    let connectionUri = uri;

    if (process.env.USE_MEMORY_DB === 'true') {
      if (!memoryServer) {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        console.log('Using in-memory MongoDB (USE_MEMORY_DB=true)');
      }
      connectionUri = memoryServer.getUri();
    }

    const conn = await mongoose.connect(connectionUri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

export default connectDB;
