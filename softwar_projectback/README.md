# RUWWAD Backend API

A comprehensive Node.js/Express backend for the RUWWAD educational platform.

## Getting Started

### Prerequisites
- Node.js 18.x
- MongoDB (local or Atlas)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://your-connection-string

# JWT Secret
SECRET=your-jwt-secret-key

# Email (for verification and password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Zoom (optional, for meeting creation)
ZOOM_ACCOUNT_ID=your-zoom-account-id
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret

# Ollama AI Chat (optional)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen:0.5b

# Server
PORT=3000
```

### Running the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/signup` | Register new user | No |
| POST | `/api/verify-email` | Verify email with code | No |
| POST | `/api/login` | Login user | No |
| GET | `/api/auth/profile` | Get current user profile | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| GET | `/api/auth/verify-token` | Verify JWT token | Yes |
| POST | `/api/auth/refresh-token` | Refresh JWT token | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with code | No |

### Users (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | Get all users | Yes |
| GET | `/api/users/:id` | Get user by ID | Yes |
| PUT | `/api/users/:id` | Update user | Yes |
| DELETE | `/api/users/:id` | Delete user | Yes |

### Courses

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/courses` | Create course | Yes |
| GET | `/api/courses` | Get courses (with filters) | Yes |
| GET | `/api/courses/:id` | Get course by ID | Yes |
| PUT | `/api/courses/:id` | Update course | Yes |
| DELETE | `/api/courses/:id` | Delete course | Yes |
| POST | `/api/courses/:id/enroll` | Enroll student | Yes |
| POST | `/api/courses/:id/unenroll` | Unenroll student | Yes |

**Query Parameters for GET /api/courses:**
- `teacher` - Filter by teacher ID
- `grade` - Filter by grade level
- `specialization` - Filter by university major
- `subject` - Filter by subject
- `isActive` - Filter by active status (true/false)

### Assignments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/assignments` | Create assignment | Yes |
| GET | `/api/assignments` | Get assignments (with filters) | Yes |
| GET | `/api/assignments/:id` | Get assignment by ID | Yes |
| PUT | `/api/assignments/:id` | Update assignment | Yes |
| DELETE | `/api/assignments/:id` | Delete assignment | Yes |
| POST | `/api/assignments/:id/submit` | Submit assignment | Yes |
| POST | `/api/assignments/:id/grade` | Grade submission | Yes |

**Query Parameters for GET /api/assignments:**
- `teacher` - Filter by teacher ID
- `course` - Filter by course ID
- `grade` - Filter by grade level
- `specialization` - Filter by university major
- `subject` - Filter by subject
- `status` - Filter by status (active/upcoming/closed)

### Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/messages` | Send message | Yes |
| GET | `/api/messages/user/:userId` | Get messages for user | Yes |
| GET | `/api/messages/conversations/:userId` | Get conversations | Yes |
| GET | `/api/messages/conversation/:userId1/:userId2` | Get conversation between users | Yes |
| PATCH | `/api/messages/:id/read` | Mark message as read | Yes |
| DELETE | `/api/messages/:id` | Delete message | Yes |

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/notifications` | Create notification | Yes |
| GET | `/api/notifications/user/:userId` | Get notifications for user | Yes |
| PATCH | `/api/notifications/:id/read` | Mark as read | Yes |
| PATCH | `/api/notifications/user/:userId/read-all` | Mark all as read | Yes |
| DELETE | `/api/notifications/:id` | Delete notification | Yes |

### Feedback

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/feedback` | Create feedback | Yes |
| GET | `/api/feedback` | Get all feedbacks | Yes |
| GET | `/api/feedback/random` | Get random feedbacks | No |
| GET | `/api/feedback/:id` | Get feedback by ID | Yes |
| PUT | `/api/feedback/:id` | Update feedback | Yes |
| DELETE | `/api/feedback/:id` | Delete feedback | Yes |

### Dashboards

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/teacher/dashboard` | Teacher dashboard data | Yes (teacher) |
| GET | `/api/student/dashboard` | Student dashboard data | Yes (student) |
| GET | `/api/parent/dashboard` | Parent dashboard data | Yes (parent) |
| GET | `/api/parent/children` | Get children progress | Yes (parent) |
| GET | `/api/admin/dashboard` | Admin dashboard data | Yes (admin) |
| GET | `/api/admin/users` | Get users with filters | Yes (admin) |
| GET | `/api/admin/reports` | Get system reports | Yes (admin) |
| POST | `/api/admin/notifications` | Send system notification | Yes (admin) |

### Other

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat` | AI chat (Ollama) | No |
| POST | `/api/zoom/create-meeting` | Create Zoom meeting | No |
| GET | `/api/health` | Health check | No |

## Data Models

### User
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: 'student' | 'parent' | 'teacher' | 'trainee',
  studentType: 'school' | 'university' | null,
  schoolGrade: 'grade1' - 'grade12' | null,
  universityMajor: String | null,
  trainingField: String | null,
  isVerified: Boolean,
  verificationCode: String
}
```

### Course
```javascript
{
  title: String,
  description: String,
  teacher: ObjectId (User),
  students: [ObjectId (User)],
  subject: String,
  grade: String,
  duration: String,
  thumbnail: String,
  progress: Number (0-100),
  status: 'published' | 'draft' | 'archived',
  isActive: Boolean,
  startDate: Date,
  endDate: Date
}
```

### Assignment
```javascript
{
  title: String,
  description: String,
  course: ObjectId (Course),
  teacher: ObjectId (User),
  dueDate: Date,
  subject: String,
  grade: String,
  status: 'active' | 'upcoming' | 'closed',
  points: Number,
  passingScore: Number,
  totalStudents: Number,
  instructionsFileUrl: String,
  instructionsFileName: String,
  attachments: [String],
  submissions: [{
    student: ObjectId (User),
    submittedAt: Date,
    file: String,
    grade: Number,
    feedback: String,
    isGraded: Boolean
  }]
}
```

### Message
```javascript
{
  sender: ObjectId (User),
  receiver: ObjectId (User),
  content: String,
  course: ObjectId (Course),
  isRead: Boolean
}
```

### Notification
```javascript
{
  user: ObjectId (User),
  title: String,
  body: String,
  type: 'assignment' | 'message' | 'system' | 'other',
  isRead: Boolean
}
```

### Feedback
```javascript
{
  author: ObjectId (User),
  targetUser: ObjectId (User),
  course: ObjectId (Course),
  rating: Number (1-5),
  comment: String
}
```

## Error Handling

All errors are handled by the centralized error middleware and return:

```json
{
  "message": "Error description"
}
```

With appropriate HTTP status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## License

ISC
