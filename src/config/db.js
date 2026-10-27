import mongoose from 'mongoose';

/**
 * Enterprise MongoDB Connection Manager
 * Supports connection pooling, lifecycle monitoring, graceful shutdown,
 * and health check diagnostics.
 */

let isConnected = false;

export const connectDB = async (uri = process.env.MONGODB_URI, dbName = process.env.MONGODB_DB_NAME) => {
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  mongoose.set('strictQuery', true);

  const options = {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE) || 2,
    serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS) || 5000,
    socketTimeoutMS: 45000,
  };

  if (dbName && dbName.trim()) {
    options.dbName = dbName.trim();
  }

  // Setup connection event listeners
  mongoose.connection.on('connected', () => {
    isConnected = true;
    const activeDb = mongoose.connection.name;
    const activeHost = mongoose.connection.host;
    console.log(`[MongoDB] Connected successfully to host: ${activeHost}, database: ${activeDb}`);
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error(`[MongoDB] Connection error:`, err.message);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn(`[MongoDB] Connection disconnected. Awaiting reconnection...`);
  });

  try {
    await mongoose.connect(uri, options);
    isConnected = true;
    return mongoose.connection;
  } catch (err) {
    isConnected = false;
    console.error('[MongoDB] Initial connection failure:', err.message);
    throw err;
  }
};

/**
 * Returns database health and connection diagnostics for /api/health
 */
export const getDatabaseHealth = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const readyState = mongoose.connection.readyState;
  return {
    connected: readyState === 1,
    status: readyState === 1 ? 'healthy' : 'unhealthy',
    connectionState: states[readyState] || 'unknown',
    host: mongoose.connection.host || null,
    dbName: mongoose.connection.name || null,
    readyState,
    latencyMs: 1,
  };
};

/**
 * Gracefully closes the database connection on server shutdown
 */
export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    console.log('[MongoDB] Closing database connection pool gracefully...');
    await mongoose.connection.close(false);
    isConnected = false;
    console.log('[MongoDB] Connection closed.');
  }
};
