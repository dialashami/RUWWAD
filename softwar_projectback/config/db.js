const mongoose = require('mongoose');

// Central MongoDB connection helper. index.js already connects directly,
// but this module lets you use the same pattern from other entry points
// (e.g. server/server.js) without duplicating logic.

const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
  });

  console.log('✅ MongoDB connected via config/db.js');
};

module.exports = { connectDB };
