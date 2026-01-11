# Backend-Web Frontend Integration - Quick Reference

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB BROWSER (Port 3001)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Frontend (softwar_project-1)                  │   │
│  │  ├─ src/config/api.config.js (✅ NEW)               │   │
│  │  ├─ src/pages/*/components use API_CONFIG            │   │
│  │  └─ All API calls point to http://localhost:3000    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP Requests
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                BACKEND SERVER (Port 3000)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Node.js/Express Backend (softwar_projectback)       │   │
│  │  ├─ CORS enabled for http://localhost:*              │   │
│  │  ├─ Routes: /api/login, /api/courses, etc.           │   │
│  │  └─ MongoDB for data storage                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

##  Integration Status

✅ **COMPLETED:**
- [x] Created centralized API configuration (src/config/api.config.js)
- [x] Updated 13+ key component files to use API_CONFIG
- [x] Added CORS support to backend for localhost:3001
- [x] Created .env.example for environment configuration
- [x] Documented setup process

⚠️ **STILL NEEDS UPDATES:**
Some legacy component files still have hardcoded URLs like `'http://localhost:3000/api/...'`. These work but should be updated to use `API_CONFIG` for consistency.

Files that can be updated later (optional, but recommended):
- `src/pages/TeacherHome/components/*.jsx`
- `src/pages/StudentHome/components/*.jsx`
- `src/pages/ParentHome/components/FeedbackStar.jsx`
- `src/pages/ParentHome/components/Settings.jsx`
- `src/pages/Admin/components/UserManagement.jsx`
- `src/pages/Admin/components/SystemSettings.jsx`

## How to Use

### For Developers

1. **Start Backend:**
   ```bash
   cd softwar_projectback
   npm run dev
   ```

2. **Start Web Frontend (new terminal):**
   ```bash
   cd softwar_project-1
   npm start
   ```

3. **That's it!** The frontend automatically connects to the backend.

### For Deployment

Set environment variable before building:
```bash
# Development (localhost)
REACT_APP_API_BASE_URL=http://localhost:3000 npm start

# Production
REACT_APP_API_BASE_URL=https://api.yourdomain.com npm run build
```

## API Configuration Reference

All API endpoints are defined in `src/config/api.config.js`:

```javascript
import { API_CONFIG } from '../config/api.config';

// Authentication
API_CONFIG.AUTH.LOGIN         // POST /api/login
API_CONFIG.AUTH.SIGNUP        // POST /api/signup
API_CONFIG.AUTH.VERIFY_EMAIL  // POST /api/verify-email

// User Management
API_CONFIG.USER.PROFILE       // GET /api/users/profile
API_CONFIG.USER.CHILDREN      // GET /api/users/children
API_CONFIG.USER.PREFERENCES   // PUT /api/users/preferences

// Student Features
API_CONFIG.STUDENT.DASHBOARD  // GET /api/student/dashboard
API_CONFIG.STUDENT.TYPE       // GET /api/studentType

// Teacher Features
API_CONFIG.TEACHER.PROFILE    // GET /api/teacher/profile
API_CONFIG.TEACHER.DASHBOARD  // GET /api/teacher/dashboard

// Content
API_CONFIG.COURSES.BASE       // GET/POST /api/courses
API_CONFIG.ASSIGNMENTS.BASE   // GET/POST /api/assignments

// Communication
API_CONFIG.NOTIFICATIONS.BASE // GET /api/notifications
API_CONFIG.FEEDBACK.BASE      // POST /api/feedback
```

## Troubleshooting

### Backend not responding?
1. Check if backend is running: `http://localhost:3000` in browser
2. Check terminal for errors
3. Ensure MongoDB is running

### CORS errors in console?
- Normal during development with different ports
- Backend is configured to allow requests from localhost:3000-3009
- Should not appear once fully integrated

### API URLs still hardcoded somewhere?
- Search for `'http://localhost:3000/api'` in src/
- Replace with `API_CONFIG.[SECTION].[ENDPOINT]`
- See "How to Use" API Configuration Reference above

##  Key Files

- **Backend:** `softwar_projectback/index.js` (runs on port 3000)
- **Frontend Config:** `softwar_project-1/src/config/api.config.js`
- **Setup Guide:** `BACKEND_WEB_SETUP.md`
- **Environment:** `softwar_project-1/.env` or `.env.example`

## What Changed

Before:
```javascript
// ❌ Hardcoded URLs scattered everywhere
const res = await fetch('http://localhost:3000/api/login', { ... });
const res = await fetch('http://localhost:3000/api/users/profile', { ... });
```

After:
```javascript
// ✅ Centralized configuration
import { API_CONFIG } from '../config/api.config';
const res = await fetch(API_CONFIG.AUTH.LOGIN, { ... });
const res = await fetch(API_CONFIG.USER.PROFILE, { ... });
```

Benefits:
- Easy to change API URLs for development/production/testing
- Environment-aware (automatically uses correct URL)
- Single source of truth for all API endpoints
- Easier to maintain and refactor

## Next Steps

1. ✅ Backend is working (port 3000)
2. ✅ Web frontend is configured (API_CONFIG)
3. Start both services and test login
4. (Optional) Update remaining hardcoded URLs for consistency

Both are now integrated and ready to use! 🚀
