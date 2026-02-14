# Authentication & Session System - Implementation Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

This will install:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation
- `node-cron` - Scheduled cleanup jobs
- All other required dependencies

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Update `.env` with your configuration:
```env
# Critical for production
JWT_SECRET=your-secure-key-at-least-32-characters

# Database (use DATABASE_URL for cloud)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Or individual settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dreambid
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:5000/api
```

### 3. Initialize Database
The database is automatically initialized on first server start. The SQL schema includes:
- `users` table with proper columns and constraints
- `user_activity` table for tracking user actions
- Performance indexes on key columns

### 4. Start the Application
```bash
npm run dev
```

This starts both frontend and backend:
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## Integration Steps

### Backend Integration

#### 1. Protect Routes with Authentication Middleware
```javascript
import { authenticate, authorize } from '../middleware/auth.js';

// Protected route - requires authentication
router.post('/api/properties', authenticate, createProperty);

// Protected route - requires admin role
router.get('/api/admin/users', authenticate, authorize('admin'), getUsers);
```

#### 2. Log User Activities
```javascript
import ActivityService from '../services/ActivityService.js';

// In your route handlers
ActivityService.logPropertyView(req.userId, propertyId, req.ip, req.get('user-agent'));
ActivityService.logPropertyEnquiry(req.userId, propertyId, 'inquiry', req.ip, req.get('user-agent'));
ActivityService.logFormSubmission(req.userId, 'contact_form', formData, req.ip, req.get('user-agent'));
```

#### 3. Update Existing Routes to Log Activity
Example - Properties route:
```javascript
// Before: Create property without logging
router.post('/properties', createPropertyHandler);

// After: With activity logging
router.post('/properties', authenticate, authorize('admin'), async (req, res) => {
  const property = await createPropertyHandler(req, res);
  
  ActivityService.logCustomAction(
    req.userId,
    'property_created',
    'property',
    { property_id: property.id, title: property.title },
    req.ip,
    req.get('user-agent')
  );
  
  return property;
});
```

### Frontend Integration

#### 1. Wrap App with AuthProvider
```jsx
// src/main.jsx
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

#### 2. Use Authentication in Components
```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.full_name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### 3. Protect Admin Routes
```jsx
import { ProtectedRoute } from './components/ProtectedRoute';

<Routes>
  <Route path="/" element={<PublicLayout />}>
    <Route path="/" element={<Home />} />
    <Route path="/properties" element={<Properties />} />
  </Route>
  
  <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
    <Route path="/admin/dashboard" element={<Dashboard />} />
    <Route path="/admin/properties" element={<AdminProperties />} />
  </Route>
</Routes>
```

#### 4. Log Activities from Frontend
```jsx
import { activityAPI } from '../services/api';

// Save activity
await activityAPI.saveActivity({
  action: 'property_viewed',
  action_category: 'property',
  data: { property_id: 42 }
});
```

## Testing Authentication

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "full_name": "John Doe",
    "phone": "+1234567890"
  }'
```

### Test User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123"
  }'
```

Response includes JWT token:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

### Test Activity Logging
```bash
curl -X POST http://localhost:5000/api/activity/save \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "property_viewed",
    "action_category": "property",
    "data": {"property_id": 42}
  }'
```

### Get User Activity History
```bash
curl -X GET "http://localhost:5000/api/activity/user/1?limit=50&offset=0" \
  -H "Authorization: Bearer <your-token>"
```

## Updating Existing Features

### Update Properties Route with Activity Logging
Current file: `routes/properties.js`

Add authentication and logging:
```javascript
import { authenticate, authorize } from '../middleware/auth.js';
import ActivityService from '../services/ActivityService.js';

// Add authentication to protected endpoints
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  // ... existing logic ...
  
  // Log the action
  ActivityService.logPropertyCreate(
    req.userId,
    property.id,
    property.title,
    req.ip,
    req.get('user-agent')
  );
});

// Log property views for authenticated users
router.get('/:id', async (req, res) => {
  const property = await getProperty(req.params.id);
  
  // Log view if user is authenticated
  if (req.userId) {
    ActivityService.logPropertyView(
      req.userId,
      property.id,
      req.ip,
      req.get('user-agent')
    );
  }
  
  res.json(property);
});
```

### Update Enquiries Route with Activity Logging
Current file: `routes/enquiries.js`

```javascript
import ActivityService from '../services/ActivityService.js';

router.post('/', async (req, res) => {
  const enquiry = await createEnquiry(req.body);
  
  // Log enquiry submission
  if (req.userId) {
    ActivityService.logPropertyEnquiry(
      req.userId,
      enquiry.property_id,
      enquiry.enquiry_type,
      req.ip,
      req.get('user-agent')
    );
  }
  
  res.status(201).json(enquiry);
});
```

## Performance Optimization

### Database Indexes
The system automatically creates indexes on:
- `user_activity.user_id` - Fast user lookup
- `user_activity.created_at` - Fast date filtering
- `user_activity.action` - Fast action filtering
- Composite index on `(user_id, created_at DESC)` - Fast timeline queries

### Activity Logging is Asynchronous
- Activities are logged in the background using `setImmediate()`
- Does not block main request
- Failed logging doesn't affect main operation

### Cleanup Job
- Runs daily at 2 AM by default
- Configurable via environment or manual API
- Non-blocking, isolated transaction

## Security Checklist

- [x] Passwords hashed with bcrypt (10-salt rounds)
- [x] JWT tokens with secret key (24-hour expiration)
- [x] SQL injection prevention (parameterized queries)
- [x] Input validation (express-validator)
- [x] CORS configured for frontend origins
- [x] Helmet.js for security headers
- [x] Role-based access control
- [x] Activity audit trail
- [ ] HTTPS in production (set up on server)
- [ ] Secure JWT secret in production (use strong key)
- [ ] Rate limiting on auth endpoints (recommended future)
- [ ] CSRF protection (recommended future)
- [ ] Token refresh mechanism (recommended future)

## Troubleshooting

### "JWT_SECRET not defined"
Solution: Set `JWT_SECRET` in `.env` file to at least 32 characters

### "Database connection failed"
Solution: Check database configuration in `.env` and verify database is running

### "Token expired"
Solution: Normal behavior - tokens expire after 24 hours. User needs to login again.

### "Cannot find module 'node-cron'"
Solution: Run `npm install` to install dependencies

### Activities not being logged
Solution: Check that user is authenticated (valid token) and activity endpoint is accessible

### Cleanup job not running
Solution: Check server logs, verify database permissions for DELETE, ensure node-cron is installed

## File Changes Summary

### New Files Created
```
controllers/
  ├── AuthController.js (8 methods)
  └── ActivityController.js (6 methods)

models/
  ├── User.js (9 methods)
  └── UserActivity.js (9 methods)

routes/
  └── activity.js (new)

services/
  ├── ActivityService.js (9 helper methods)
  └── CleanupService.js (6 methods)

Documentation/
  ├── AUTHENTICATION.md (comprehensive)
  └── IMPLEMENTATION_GUIDE.md (this file)
```

### Modified Files
```
server.js
  - Import CleanupService
  - Initialize cleanup schedules
  - Add activity routes

middleware/auth.js
  - Enhanced authenticate middleware
  - Added optionalAuth

routes/auth.js
  - Switched to AuthController
  - Added change-password endpoint
  - Improved validation

src/contexts/AuthContext.jsx
  - Enhanced session recovery
  - Added error handling
  - Cross-tab synchronization

src/services/api.js
  - Enhanced interceptors
  - Added activity API endpoints

setup-database.sql
  - Added user_activity table
  - Added indexes for performance

.env.example
  - Updated with new variables

package.json
  - Added node-cron dependency
```

## Next Steps

1. Install dependencies: `npm install`
2. Configure `.env` file
3. Start the application: `npm run dev`
4. Test authentication endpoints
5. Integrate activity logging into existing routes
6. Test protected routes with JWT tokens
7. Verify cleanup job runs daily
8. Monitor activity logs in database

## Support & Documentation

- See `AUTHENTICATION.md` for complete API documentation
- Check server logs for error messages
- Review database schema in `setup-database.sql`
- Test endpoints using provided curl examples
