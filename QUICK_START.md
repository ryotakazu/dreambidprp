# Quick Start Guide - Authentication System

## What Was Implemented

A **complete production-ready authentication and session management system** for your DreamBid application with:

✅ User registration & login with bcrypt password hashing  
✅ JWT token-based authentication (24-hour expiration)  
✅ Secure session persistence and recovery  
✅ User activity tracking and audit logs  
✅ Automatic cleanup of old records (3+ months)  
✅ Role-based access control (admin, staff, user)  
✅ Protected API routes  
✅ Cross-tab session synchronization  

## File Summary

### Backend Files

#### Controllers (New)
- **AuthController.js** - Register, login, logout, password change
- **ActivityController.js** - Get activity history, statistics, admin reports

#### Models (New)
- **User.js** - User CRUD with bcrypt password handling
- **UserActivity.js** - Activity logging and retrieval

#### Services (New)
- **ActivityService.js** - Non-blocking async activity logging helpers
- **CleanupService.js** - Scheduled cleanup via node-cron (2 AM daily)

#### Routes (Updated & New)
- **routes/auth.js** - Updated with new controllers and validation
- **routes/activity.js** - New activity endpoints (protected)

#### Middleware (Updated)
- **middleware/auth.js** - Enhanced JWT verification with optional auth

### Frontend Files

#### Context (Updated)
- **src/contexts/AuthContext.jsx** - Enhanced session recovery, error handling, cross-tab sync

#### Services (Updated)
- **src/services/api.js** - JWT token injection in all requests, activity API endpoints

### Database (Updated)
- **setup-database.sql** - Added user_activity table with performance indexes
- **.env.example** - Updated with auth configuration variables

### Documentation (New)
- **AUTHENTICATION.md** - Comprehensive API reference
- **IMPLEMENTATION_GUIDE.md** - Step-by-step integration instructions

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and set JWT_SECRET to 32+ character random string
# Example: JWT_SECRET=abc123def456ghi789jkl012mno345pqr678
```

### 3. Start Application
```bash
npm run dev
```

Database tables are created automatically on first start.

## Testing Authentication

### Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "full_name": "Test User",
    "phone": "+1234567890"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

Copy the returned `token` for next step.

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Log Activity
```bash
curl -X POST http://localhost:5000/api/activity/save \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "property_viewed",
    "action_category": "property",
    "data": {"property_id": 42}
  }'
```

## Frontend Usage

### Login Component
```jsx
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      // User is logged in, navigate to dashboard
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email" 
      />
      <input 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Password" 
        type="password"
      />
      <button type="submit">Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

### Protected Component
```jsx
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login');
    }
  }, [user, loading]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user.full_name}</h1>
    </div>
  );
}
```

## Database Tables

### users
Stores user accounts with hashed passwords
- id, email (unique), password_hash, full_name, phone, role, is_active
- Indexes on email and role

### user_activity
Audit trail of all user actions
- id, user_id, action, action_category, data (JSON), ip_address, user_agent, created_at
- Indexes on user_id, created_at, action for fast queries

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout and log event (protected)
- `POST /api/auth/change-password` - Change password (protected)
- `POST /api/auth/verify` - Verify token (protected)

### Activity (Protected)
- `POST /api/activity/save` - Log user action
- `GET /api/activity/user/:userId` - Get activity history
- `GET /api/activity/stats/user/:userId` - Get user statistics

### Activity (Admin Only)
- `GET /api/activity/all` - Get all activities
- `GET /api/activity/category/:category` - Filter by category
- `GET /api/activity/stats` - Overall statistics

## Session Behavior

### Login
1. User provides email & password
2. Password verified with bcrypt
3. JWT generated (24-hour expiration)
4. Token stored in localStorage
5. Token auto-attached to all API requests

### Page Refresh
1. Frontend checks localStorage for token on app load
2. Verifies token with `/auth/me`
3. Restores user session if valid
4. Redirects to login if invalid/expired

### Cross-Tab Sync
1. Login in one tab auto-syncs to other tabs
2. Logout in one tab logs out everywhere
3. Token expiry detected across tabs

### Logout
1. Activity logged to database
2. Token removed from localStorage
3. Session cleared
4. Redirects to login

## Cleanup System

### Automatic Cleanup
- Runs daily at 2 AM (configurable in .env)
- Deletes user_activity records older than 3 months
- Non-blocking, safe operation

### Manual Cleanup
```javascript
import CleanupService from './services/CleanupService';

// Delete 90-day old records
const count = await CleanupService.manualActivityCleanup(90);
```

## Integration with Existing Routes

Add authentication & logging to your property endpoints:

```javascript
// BEFORE
router.get('/properties/:id', getProperty);

// AFTER - Optional auth, log views
router.get('/properties/:id', optionalAuth, async (req, res) => {
  const property = await getProperty(req.params.id);
  
  if (req.userId) {
    ActivityService.logPropertyView(req.userId, property.id, req.ip, req.get('user-agent'));
  }
  
  res.json(property);
});
```

```javascript
// BEFORE
router.post('/properties', createProperty);

// AFTER - Require auth & admin, log creation
import { authenticate, authorize } from '../middleware/auth';

router.post('/properties', authenticate, authorize('admin'), async (req, res) => {
  const property = await createProperty(req.body);
  ActivityService.logCustomAction(req.userId, 'property_created', 'property', 
    { property_id: property.id }, req.ip, req.get('user-agent'));
  res.json(property);
});
```

## Environment Variables

Create a `.env` file (use `.env.example` as template):

```env
# Critical - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_random_32_char_string_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dreambid
# OR
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dreambid
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:5000/api

# Optional
JWT_EXPIRE=24h
ACTIVITY_RETENTION_DAYS=90
CLEANUP_CRON=0 2 * * *
```

## Default Admin User

```
Email: admin@dreambid.com
Password: admin123
```

**Important**: Change this password on first login! Use the `/auth/change-password` endpoint.

## Security Features

✅ **Bcrypt Hashing** - 10-salt rounds  
✅ **JWT Tokens** - 24-hour expiration  
✅ **SQL Injection Prevention** - Parameterized queries  
✅ **Input Validation** - express-validator  
✅ **CORS Security** - Whitelist frontend origins  
✅ **Security Headers** - helmet.js  
✅ **Role-Based Access** - Admin/staff/user roles  
✅ **Audit Trail** - Complete activity logging  

## Production Checklist

- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Use `DATABASE_URL` for production database
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL on server
- [ ] Update `FRONTEND_URL` to your domain
- [ ] Change default admin password
- [ ] Configure CORS origins properly
- [ ] Set up database backups
- [ ] Monitor cleanup job logs
- [ ] Implement rate limiting (future)
- [ ] Set up error logging (future)

## Support

See documentation files:
- **AUTHENTICATION.md** - Complete API reference & architecture
- **IMPLEMENTATION_GUIDE.md** - Detailed integration steps

## Common Issues

### "Missing JWT_SECRET"
→ Add `JWT_SECRET=...` to your `.env` file

### "Can't connect to database"
→ Check database configuration in `.env` and verify database is running

### "Token expired error"
→ Normal behavior - tokens last 24 hours. User needs to login again.

### "Activity not logging"
→ Ensure user is authenticated and has valid token

### "Cleanup job not running"
→ Verify node-cron is installed: `npm list node-cron`

That's it! Your authentication system is ready to use. 🚀
