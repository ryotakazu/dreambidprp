# Authentication & Session Management System

Complete authentication and session-based data persistence system for DreamBid unified application.

## Overview

This system provides:
- User registration and login with bcrypt password hashing
- JWT token-based authentication
- Secure session management with 24-hour token expiration
- User activity tracking and logging
- Automatic data cleanup for old activity records
- Role-based access control (admin, staff, user)

## Architecture

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'staff', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User Activity Table
```sql
CREATE TABLE user_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  action_category VARCHAR(50),
  data JSONB DEFAULT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes for Performance:**
- `idx_user_activity_user_id` - for fast user activity lookups
- `idx_user_activity_created_at` - for sorting and date range queries
- `idx_user_activity_action` - for filtering by action type
- `idx_user_activity_user_date` - composite index for user activity timeline

## Backend Implementation

### Models

#### User.js
- `findByEmail(email)` - Find user by email
- `findById(id)` - Find user by ID
- `create(email, password, fullName, phone, role)` - Create new user with bcrypt hashing
- `verifyPassword(plainPassword, hashedPassword)` - Verify password using bcrypt
- `update(id, updates)` - Update user information
- `changePassword(id, newPassword)` - Change user password
- `getAll(limit, offset)` - Get all users (admin)
- `deactivate(id)` - Deactivate user account
- `activate(id)` - Activate user account

#### UserActivity.js
- `log(userId, action, actionCategory, data, ipAddress, userAgent)` - Log user activity
- `getUserActivity(userId, limit, offset)` - Get user's activity history
- `getUserActivityCount(userId)` - Count user activities
- `getAllActivities(limit, offset)` - Get all activities (admin)
- `getActivitiesByCategory(category, limit, offset)` - Filter by category
- `getActivitiesByAction(action, limit, offset)` - Filter by action
- `deleteOldActivities(daysOld)` - Delete activities older than X days
- `getUserActivityStats(userId, daysBack)` - Get user activity statistics
- `getActivityStats(daysBack)` - Get overall activity statistics

### Controllers

#### AuthController.js
- `register(req, res)` - Handle user registration
- `login(req, res)` - Handle user login
- `getCurrentUser(req, res)` - Get authenticated user info
- `logout(req, res)` - Handle logout
- `changePassword(req, res)` - Change user password
- `verifyToken(req, res)` - Verify JWT token validity

#### ActivityController.js
- `saveActivity(req, res)` - Save user activity
- `getUserActivity(req, res)` - Get user's activity history
- `getAllActivities(req, res)` - Get all activities (admin only)
- `getActivitiesByCategory(req, res)` - Get activities by category (admin)
- `getUserActivityStats(req, res)` - Get user statistics
- `getActivityStats(req, res)` - Get overall statistics (admin)

### Services

#### ActivityService.js
Helper service for logging user activities asynchronously:
- `logActivityAsync()` - Fire-and-forget activity logging
- `logPropertyView()` - Log property view
- `logPropertyEnquiry()` - Log enquiry
- `logPropertyInterest()` - Log save/shortlist
- `logPropertyShare()` - Log share action
- `logFormSubmission()` - Log form submission
- `logProfileUpdate()` - Log profile changes
- `logFileUpload()` - Log file uploads
- `logCustomAction()` - Log custom actions

#### CleanupService.js
Scheduled cleanup job for old activity records:
- `initSchedules()` - Initialize all scheduled jobs
- `scheduleActivityCleanup(cronExpression)` - Schedule activity cleanup (default: 2 AM daily)
- `scheduleArchivedDataCleanup(cronExpression)` - Schedule archive cleanup (Sundays 3 AM)
- `manualActivityCleanup(daysOld)` - Trigger cleanup manually
- `getCleanupStats(daysOld)` - Get stats about records to delete

### Middleware

#### auth.js
- `authenticate` - Verify JWT and attach user to request
- `authorize(...roles)` - Check user has required role
- `optionalAuth` - Optional authentication (doesn't fail)

### Routes

#### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user"
  }
}
```

#### POST /api/auth/login
Login user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user"
  }
}
```

#### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "role": "user",
    "is_active": true
  }
}
```

#### POST /api/auth/logout
Logout user and log the event.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### POST /api/auth/change-password
Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "current_password": "oldPassword123",
  "new_password": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password changed successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user"
  }
}
```

#### POST /api/activity/save
Save user activity (protected).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "action": "property_viewed",
  "action_category": "property",
  "data": {
    "property_id": 42,
    "property_title": "Beautiful House"
  }
}
```

**Response:**
```json
{
  "message": "Activity recorded successfully",
  "activity": {
    "id": 1,
    "user_id": 1,
    "action": "property_viewed",
    "action_category": "property",
    "data": { "property_id": 42 },
    "created_at": "2024-02-14T10:30:00Z"
  }
}
```

#### GET /api/activity/user/:userId
Get user's activity history (private - own data only, or admin).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` - Number of records (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "activities": [
    {
      "id": 1,
      "user_id": 1,
      "action": "property_viewed",
      "action_category": "property",
      "data": { "property_id": 42 },
      "created_at": "2024-02-14T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 100,
    "pages": 2
  }
}
```

## Frontend Implementation

### AuthContext
Enhanced context providing:
- User state management
- Token persistence
- Session recovery on page refresh
- Cross-tab synchronization
- Error handling

**Usage:**
```jsx
const { user, token, isAuthenticated, loading, login, logout, error } = useAuth();

// Login
try {
  await login({ email, password });
} catch (error) {
  console.error('Login failed:', error);
}

// Register
try {
  await register({ email, password, full_name, phone });
} catch (error) {
  console.error('Registration failed:', error);
}

// Logout
await logout();
```

### Protected Routes
```jsx
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

<Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
  <Route path="/admin/dashboard" element={<Dashboard />} />
  <Route path="/admin/properties" element={<AdminProperties />} />
</Route>
```

### Activity Logging
```jsx
import ActivityService from '../services/ActivityService';

// Log property view
ActivityService.logPropertyView(userId, propertyId, ipAddress, userAgent);

// Log enquiry
ActivityService.logPropertyEnquiry(userId, propertyId, 'inquiry', ipAddress, userAgent);

// Log form submission
ActivityService.logFormSubmission(userId, 'contact-form', formData, ipAddress, userAgent);

// Custom action
ActivityService.logCustomAction(userId, 'action_name', 'category', data, ipAddress, userAgent);
```

## Security Features

1. **Password Hashing**: bcryptjs with 10-salt rounds
2. **JWT Tokens**: Signed with secret key, 24-hour expiration
3. **Input Validation**: express-validator on all inputs
4. **SQL Injection Prevention**: Parameterized queries throughout
5. **Authorization**: Role-based access control
6. **HTTPS**: Recommended in production with helmet.js
7. **Token Rotation**: Refresh token recommended for future enhancement
8. **Activity Logging**: Track all user actions for audit trail

## Cleanup System

### Automatic Cleanup
Scheduled daily at 2 AM:
```javascript
DELETE FROM user_activity
WHERE created_at < NOW() - INTERVAL '3 months'
```

### Manual Cleanup
```javascript
import CleanupService from './services/CleanupService';

// Cleanup activities older than 90 days
const deletedCount = await CleanupService.manualActivityCleanup(90);

// Get stats before cleanup
const stats = await CleanupService.getCleanupStats(90);
```

## Configuration

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dreambid
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRE=24h

# Server
PORT=5000
NODE_ENV=production
```

## Session Behavior

### Login Session
1. User provides credentials
2. Password verified with bcrypt
3. JWT token generated (24-hour expiration)
4. Token stored in localStorage (secure flag recommended)
5. Token attached to all subsequent API requests

### Session Recovery
- On page refresh: Frontend checks localStorage for token
- If valid token found: Verify with `/auth/me` endpoint
- If invalid/expired: Clear token, redirect to login
- Cross-tab sync: Listens to storage events

### Logout
1. User logs out
2. `POST /auth/logout` called to log event
3. Token removed from localStorage
4. Authorization header cleared
5. Redirect to login page

## Activity Tracking Categories

- **authentication**: login, logout, registration, password_changed
- **property**: property_viewed, property_enquiry, property_saved, property_shared
- **user**: profile_updated, password_changed
- **form**: form_submitted
- **file**: file_uploaded
- **system**: system_cleanup, maintenance

## Performance Optimization

### Indexes
```sql
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX idx_user_activity_action ON user_activity(action);
CREATE INDEX idx_user_activity_user_date ON user_activity(user_id, created_at DESC);
```

### Query Patterns
- Activity logging is asynchronous and non-blocking
- Pagination implemented for activity retrieval
- Indexes ensure fast user lookup and activity filtering

## Testing

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dreambid.com",
    "password": "admin123"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Test Activity Logging
```bash
curl -X POST http://localhost:5000/api/activity/save \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "property_viewed",
    "action_category": "property",
    "data": {"property_id": 42}
  }'
```

## Troubleshooting

### "Token Expired" Error
- Token expires after 24 hours
- User needs to login again
- Consider implementing refresh tokens for better UX

### "Invalid Email or Password"
- Check email exists and spelling
- Verify password is correct
- Account might be inactive

### Activity Not Logging
- Check user is authenticated (valid token)
- Verify action and action_category are provided
- Check database connectivity
- Activity logging is async, may have slight delay

### Cleanup Not Running
- Verify node-cron is installed
- Check server logs for scheduled job messages
- Verify database permissions for DELETE

## Future Enhancements

1. **Refresh Tokens**: Implement token refresh for better security
2. **OAuth Integration**: Support third-party login (Google, Facebook)
3. **Two-Factor Authentication**: Add 2FA for admin accounts
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Session Management**: Add session timeout warnings
6. **Activity Export**: Export activity data for reports
7. **Webhook Integration**: Send activity notifications

## File Structure

```
├── controllers/
│   ├── AuthController.js
│   └── ActivityController.js
├── middleware/
│   └── auth.js (updated)
├── models/
│   ├── User.js
│   └── UserActivity.js
├── routes/
│   ├── auth.js (updated)
│   └── activity.js
├── services/
│   ├── ActivityService.js
│   └── CleanupService.js
├── src/
│   ├── contexts/
│   │   └── AuthContext.jsx (updated)
│   └── services/
│       └── api.js (updated)
└── setup-database.sql (updated)
```

## Support

For issues or questions, refer to the architecture documentation or server logs for detailed error messages.
