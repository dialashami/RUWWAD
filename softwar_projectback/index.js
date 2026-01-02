// server.js

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

// ========= Middleware =========
app.use(express.json());
app.use(cors());

// Request logging for debugging
app.use((req, res, next) => {
  if (req.path.includes('feedback')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Headers:', req.headers.authorization ? 'Auth present' : 'NO AUTH');
  }
  next();
});

// ========= MongoDB Connection =========

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://aboodjamal684_db_user:Abd123456@abd.lvp2v4i.mongodb.net/ruwwad_test?retryWrites=true&w=majority&appName=abd';

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.log('❌ error connecting to mongoDB', err));

// ========= Import Routes =========
const textRoutes = require('./routes/text.route');
const loginRoutes = require('./routes/login');
const signupRoutes = require('./routes/signup_route');
const studentTypeRoutes = require('./routes/studentType-route');

// New modular routes (courses, assignments, messaging, notifications, feedback, auth utils, users)
const courseRoutes = require('./routes/courseRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const teacherDashboardRoutes = require('./routes/teacherDashboardRoutes');
const teacherProfileRoutes = require('./routes/teacherProfileRoutes');
const studentDashboardRoutes = require('./routes/studentDashboardRoutes');
const parentDashboardRoutes = require('./routes/parentDashboardRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const aiConversationRoutes = require('./routes/aiConversationRoutes');
const systemSettingsRoutes = require('./routes/systemSettingsRoutes');

// Error handling middleware
const errorHandler = require('./middleware/errorMiddleware');

// Core existing routes
app.use('/api', textRoutes);
app.use('/api', loginRoutes);
app.use('/api', signupRoutes);
app.use('/api', studentTypeRoutes);

// New feature routes
app.use('/api', courseRoutes);
app.use('/api', assignmentRoutes);
app.use('/api', messageRoutes);
app.use('/api', notificationRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', teacherDashboardRoutes);
app.use('/api', teacherProfileRoutes);
app.use('/api', studentDashboardRoutes);
app.use('/api', parentDashboardRoutes);
app.use('/api', adminDashboardRoutes);
app.use('/api', aiConversationRoutes);
app.use('/api', systemSettingsRoutes);

// ========= Ollama Chat Route =========

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen:0.5b';

app.post('/api/chat', async (req, res) => {
  try {
    const { question } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Missing "question".' });
    }

    if (
      process.env.NODE_ENV === 'production' &&
      !process.env.OLLAMA_BASE_URL
    ) {
      return res.json({
        answer:
          'Chat backend is not configured in production yet. Please try again later.',
      });
    }

    const r = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [{ role: 'user', content: question }],
      stream: false,
    });

    const data = r.data;
    const answer =
      data?.message?.content || data?.response || 'No answer.';

    return res.json({ answer });
  } catch (e) {
    console.error('Server exception (Ollama):', e.response?.data || e.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ========= Zoom Config & Route =========

async function getZoomAccessToken() {
  const tokenUrl = 'https://zoom.us/oauth/token';
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      'Missing Zoom env vars (ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET)'
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  );

  const res = await axios.post(
    `${tokenUrl}?grant_type=account_credentials&account_id=${accountId}`,
    null,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return res.data.access_token;
}

app.post('/api/zoom/create-meeting', async (req, res) => {
  try {
    const { topic, duration, zoomEmail } = req.body || {};

    if (!zoomEmail) {
      return res
        .status(400)
        .json({ message: 'zoomEmail is required (teacher zoom email)' });
    }

    const accessToken = await getZoomAccessToken();
    const userId = zoomEmail;

    const payload = {
      topic: topic || 'Online Class',
      type: 2,
      duration: duration || 45,
      settings: {
        join_before_host: true,
        waiting_room: false,
        approval_type: 0,
      },
    };

    const zoomRes = await axios.post(
      `https://api.zoom.us/v2/users/${encodeURIComponent(
        userId
      )}/meetings`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const meeting = zoomRes.data;

    return res.status(201).json({
      id: meeting.id,
      topic: meeting.topic,
      join_url: meeting.join_url,
      start_url: meeting.start_url,
      password: meeting.password,
    });
  } catch (err) {
    console.error(
      'Error creating Zoom meeting:',
      err.response?.data || err.message
    );
    return res.status(500).json({
      message: 'Failed to create Zoom meeting',
      error: err.response?.data || err.message,
    });
  }
});

// ========= Health & Root =========

app.get('/', (req, res) => {
  res.send('RUWWAD backend is running 🚀');
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection?.readyState;
  res.json({ ok: true, dbState });
});

// ========= Error Handler (must be last) =========
app.use(errorHandler);

// ========= Start Server =========

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 server is running on port', PORT);
});
