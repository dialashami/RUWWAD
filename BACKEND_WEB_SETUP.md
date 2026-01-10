# Backend Configuration for RUWWAD Web Frontend

This guide explains how to properly configure the web frontend to connect to the backend.

## Quick Start

The web frontend is now configured to work with the backend at `http://localhost:3000` by default.

### Development Setup

1. **Start the Backend**
   ```bash
   cd softwar_projectback
   npm install  # if needed
   npm run dev  # or npm start
   ```
   The backend will run on `http://localhost:3000`

2. **Start the Web Frontend** (in another terminal)
   ```bash
   cd softwar_project-1
   npm install  # if needed
   npm start
   ```
   The frontend will run on `http://localhost:3001` (or another port)

3. **That's it!** The frontend automatically connects to the backend at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the `softwar_project-1` directory to customize the API URL:

```bash
# Default (points to localhost backend)
REACT_APP_API_BASE_URL=http://localhost:3000

# For local network testing (e.g., testing on physical devices)
REACT_APP_API_BASE_URL=http://192.168.1.100:3000

# For production deployment
REACT_APP_API_BASE_URL=https://your-production-backend.com
```

If you don't create a `.env` file, the frontend will use `http://localhost:3000` by default in development mode.

## API Configuration File

The centralized API configuration is at `src/config/api.config.js`. This file:

- Automatically detects development vs. production
- Reads the `REACT_APP_API_BASE_URL` environment variable
- Provides pre-configured endpoints for all API routes

### Using API Endpoints

All components should import from the config file:

```javascript
import { API_CONFIG } from '../config/api.config';

// Example usage
fetch(API_CONFIG.AUTH.LOGIN, {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
```

### Available API Constants

The `API_CONFIG` object includes constants for:
- `AUTH` - Login, signup, password reset, email verification
- `USER` - Profile, preferences, children, account settings
- `STUDENT` - Student type, dashboard, progress
- `TEACHER` - Profile, preferences, dashboard
- `FEEDBACK` - Submit and fetch feedback
- `NOTIFICATIONS` - Fetch and manage notifications
- `COURSES` - Course management
- `ASSIGNMENTS` - Assignment management

## Common Issues

### "Cannot connect to backend"
1. Ensure the backend is running (`npm run dev` in `softwar_projectback`)
2. Check if the backend is on port 3000: `http://localhost:3000` should show "RUWWAD backend is running 🚀"
3. Check your `REACT_APP_API_BASE_URL` in `.env` matches the backend URL

### "CORS errors"
The backend is configured to accept requests from:
- `http://localhost:3000` (web frontend)
- `http://localhost:8081` (Expo)
- `http://localhost:3001` (alternative web ports)
- Local network IPs (for testing on physical devices)

### Frontend runs on port 3001 instead of 3000
This is normal if port 3000 is already in use. The frontend automatically finds the next available port.

## Testing the Connection

1. Open the browser's Developer Console (F12)
2. Look for the log message: "🔗 API Configuration: Base URL: http://localhost:3000"
3. Try logging in - if successful, the connection is working

## Updating API URLs in Components

Older components may still have hardcoded URLs like `'http://localhost:3000/api/...'`. 

To update them, import and use `API_CONFIG`:

```javascript
// ❌ OLD (hardcoded)
const res = await fetch('http://localhost:3000/api/users/profile', {
  headers: { Authorization: `Bearer ${token}` }
});

// ✅ NEW (using config)
import { API_CONFIG } from '../config/api.config';
const res = await fetch(API_CONFIG.USER.PROFILE, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Mobile App (Expo/React Native)

The `FrontendExpo` folder has its own separate API config at `FrontendExpo/src/config/api.config.js`. It uses the same pattern but is configured independently for mobile development.

## Production Deployment

When deploying to production:

1. Build the React app:
   ```bash
   npm run build
   ```

2. Set the environment variable before deployment:
   ```bash
   REACT_APP_API_BASE_URL=https://your-production-backend.com npm run build
   ```

3. Deploy the `build/` folder to your hosting service (Vercel, Netlify, etc.)

The frontend will automatically use the production API URL.
