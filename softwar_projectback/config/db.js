const mongoose = require('mongoose');

/**
 * Optimized MongoDB Connection Configuration
 * 
 * Pool Size: 50 connections for high concurrency
 * Socket Timeout: 45 seconds to prevent hanging
 * Server Selection: Fast timeout for quick failover
 * Read Preference: secondaryPreferred for read-heavy workloads
 */

const OPTIMIZED_OPTIONS = {
  // Connection Pool - Higher for better concurrency
  maxPoolSize: 50,
  minPoolSize: 10,
  
  // Timeouts - Optimized for fast response
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  
  // Write Concern - Balanced for speed and safety
  w: 1,
  wtimeoutMS: 2500,
  
  // Read optimization
  readPreference: 'primaryPreferred',
  
  // Connection management
  maxIdleTimeMS: 30000,
  
  // Compression for faster data transfer
  compressors: ['zlib'],
  
  // Auto index (disable in production for faster startup)
  autoIndex: process.env.NODE_ENV !== 'production',
};

// Connection state tracking
let isConnected = false;
let connectionPromise = null;

const connectDB = async (uri) => {
  // Return existing connection if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('📦 Using existing MongoDB connection');
    return mongoose.connection;
  }

  // Return pending connection if in progress
  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  connectionPromise = mongoose.connect(mongoUri, OPTIMIZED_OPTIONS)
    .then((conn) => {
      isConnected = true;
      console.log('✅ MongoDB connected via config/db.js');
      console.log(`📊 Connection pool: ${OPTIMIZED_OPTIONS.maxPoolSize} max connections`);
      
      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        isConnected = false;
        connectionPromise = null;
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        isConnected = true;
      });
      
      return conn;
    })
    .catch((err) => {
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
};

// Get connection status
const getConnectionStatus = () => ({
  isConnected,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host,
  name: mongoose.connection.name,
});

module.exports = { 
  connectDB, 
  getConnectionStatus,
  OPTIMIZED_OPTIONS,
};
