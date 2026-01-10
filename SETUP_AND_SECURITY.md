# RUWWAD - Backend & Frontend Setup Guide

## ⚠️ IMPORTANT SECURITY NOTICE

Your `.env` file contains sensitive credentials and **must NEVER be committed to git**. The file is properly in `.gitignore`, but here are critical steps:

### What was exposed previously:
- ❌ Zoom API credentials (ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)
- ❌ Email credentials (EMAIL_USER, EMAIL_PASS)
- ❌ MongoDB connection string with password
- ❌ JWT secret key

### What you MUST do NOW:
1. **Regenerate ALL credentials** since they were exposed on GitHub:
   - Create new Zoom API keys in Zoom Developer Console
   - Generate new Gmail App Password
   - Create a new MongoDB Atlas user/password
   - Generate a new JWT_SECRET

2. **Use `.env.example`** as a template (safe to share):
   ```bash
   cp softwar_projectback/.env.example softwar_projectback/.env
   # Then fill in YOUR ACTUAL VALUES in .env
   ```

---

## Backend Setup

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Environment variables configured

### Installation

```bash
cd softwar_projectback

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env and add your actual credentials

# Start the server
npm run dev      # Development with auto-reload (requires nodemon)
npm start        # Production mode
```

### Backend Server Details
- **Port**: 3000 (configurable via `PORT` env variable)
- **Health Check**: GET `http://localhost:3000/api/health`
- **Root**: GET `http://localhost:3000/`

### CORS Configuration
The backend accepts requests from:
- Local development: `http://localhost:3000`, `http://localhost:8081`
- Expo: Auto-detects device IP on same WiFi network
- Localtunnel: `https://olive-coats-report.loca.lt`
- Any local network IP: `http://192.168.x.x:*`

---

## Frontend Setup (Expo)

### Prerequisites
- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- Backend server running on the same network

### Installation

```bash
cd FrontendExpo

# Install dependencies
npm install

# Start the development server
expo start

# Options after expo start:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Press 'w' for web browser
# - Scan QR code with Expo Go app on physical device
```

### API Configuration

The frontend **auto-detects** the backend IP address from Expo's debug connection:

**File**: `FrontendExpo/src/config/api.config.js`

- **ENVIRONMENT**: Set to `'local'` (default), `'tunnel'`, or `'production'`
- **PORT**: 3000 (must match backend)
- **Auto-detection**: IP is automatically detected from Expo's debuggerHost

No manual IP configuration needed for local development! 🎉

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# Kill the process on Windows:
taskkill /PID <PID> /F

# Try a different port:
PORT=3001 npm start
```

### Frontend can't connect to backend
1. **Check network**: Both devices must be on the same WiFi
2. **Check logs**: Look at Expo console for auto-detected IP
3. **Check backend**: Ensure backend is running and accessible
4. **Try manual IP**: Edit `api.config.js` and set `ENVIRONMENT = 'tunnel'` for Localtunnel

### MongoDB connection fails
```bash
# Check your MONGODB_URI in .env
# Verify:
# - Database exists in MongoDB Atlas
# - IP is whitelisted (0.0.0.0/0 for development)
# - Username and password are correct
# - Connection string format is valid
```

### CORS errors
- Ensure backend CORS is configured correctly (see `index.js`)
- Check that your frontend origin is in the allowed list
- Physical devices use auto-detected IP - verify it matches backend logs

---

## Production Deployment

### Before deploying:
1. ✅ Change `ENVIRONMENT = 'production'` in frontend config
2. ✅ Update `PRODUCTION_URL` to your deployed backend URL
3. ✅ Use secure environment variables (never commit `.env`)
4. ✅ Enable HTTPS for all connections
5. ✅ Regenerate all credentials for production

### Environment Setup for Production:
```bash
# Backend
PORT=80 or 443
NODE_ENV=production
MONGODB_URI=<your-production-db>
# All credentials must be from production accounts

# Frontend
ENVIRONMENT=production
PRODUCTION_URL=https://your-api.com
```

---

## Security Checklist

- [x] `.env` is in `.gitignore`
- [x] `.env.example` created (safe to share)
- [x] CORS is properly configured
- [x] Sensitive headers added (X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] Regenerate exposed credentials (TODO: Do this immediately)
- [ ] Use HTTPS in production
- [ ] Validate all user inputs
- [ ] Use strong JWT secrets
- [ ] Implement rate limiting for auth endpoints

---

## API Documentation

See the respective backend route files in `softwar_projectback/routes/` for detailed endpoint documentation.

### Main Routes:
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/courses` - Course management
- `/api/assignments` - Assignment management
- `/api/messages` - Messaging
- `/api/notifications` - Notifications
- `/api/feedback` - Feedback
- `/api/ai-conversation` - AI chat
- `/api/zoom/create-meeting` - Zoom integration

---

## Contributing

When making changes:
1. Never commit `.env` files
2. Use `.env.example` for configuration templates
3. Test locally before pushing
4. Document any new environment variables in `.env.example`

---

## Support

For issues or questions, check the project README files in:
- `softwar_projectback/README.md` - Backend documentation
- `FrontendExpo/README.md` - Frontend documentation
