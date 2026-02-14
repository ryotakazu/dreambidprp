# System Architecture Diagram

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REGISTRATION                        │
└─────────────────────────────────────────────────────────────────┘

   Frontend                              Backend              Database
   ────────                              ───────              ────────
   
   User Form
       │
       │ POST /auth/register
       │ {email, password, name}
       ├─────────────────────────────→ AuthController.register()
       │                                     │
       │                                     ├─→ Validate input
       │                                     │
       │                                     ├─→ Check email exists
       │                                     │    in users table
       │                                     │
       │                                     ├─→ Hash password with bcrypt
       │                                     │
       │                                     ├─→ INSERT user
       │                                     │    with password_hash
       │                                     │                  ────────────
       │                                     │                 │ users     │
       │                                     │                 │ ────────  │
       │                                     │────────────────→│ id        │
       │                                     │                 │ email     │
       │                                     │                 │ password_ │
       │                                     │                 │ hash      │
       │                                     │                 │ role      │
       │                                     │                 │ is_active │
       │                                     │                 └───────────┘
       │                                     │
       │                                     ├─→ Generate JWT token
       │                                     │    (24-hour expiry)
       │                                     │
       │                                     ├─→ Log activity
       │                                     │    INSERT into user_activity
       │                                     │                  ────────────
       │                                     │                 │ user_      │
       │                                     │                 │ activity   │
       │                                     │                 │ ────────   │
       │                                     │────────────────→│ user_id    │
       │                                     │                 │ action     │
       │ ← JWT token ←────────────────────────│                │ data       │
       │                                     │                 │ created_at │
       │ Store in localStorage               │                 └───────────┘
       │


┌─────────────────────────────────────────────────────────────────┐
│                           USER LOGIN                             │
└─────────────────────────────────────────────────────────────────┘

   Frontend                              Backend              Database
   ────────                              ───────              ────────
   
   Login Form
       │
       │ POST /auth/login
       │ {email, password}
       ├─────────────────────────────→ AuthController.login()
       │                                     │
       │                                     ├─→ Validate input
       │                                     │
       │                                     ├─→ SELECT user from users
       │                                     │    WHERE email = ?
       │                                     │                  ────────────
       │                                     │                 │ users     │
       │                                     │────────────────→│ ────────  │
       │                                     │                 │ id        │
       │                                     │                 │ password_ │
       │                                     │                 │ hash      │
       │                                     │                 │ is_active │
       │                                     │                 └───────────┘
       │                                     │
       │                                     ├─→ Verify password with bcrypt
       │                                     │    bcrypt.compare(plain, hash)
       │                                     │
       │                                     ├─→ Generate JWT token
       │                                     │
       │                                     ├─→ Log activity (login event)
       │                                     │
       │ ← JWT token ←────────────────────────│
       │
       │ Store token in localStorage
       │ Set Auth header: Bearer {token}
       │


┌─────────────────────────────────────────────────────────────────┐
│                      PROTECTED API CALL                          │
└─────────────────────────────────────────────────────────────────┘

   Frontend                              Backend              Database
   ────────                              ───────              ────────
   
   API Call
       │
       │ GET /api/properties
       │ Headers: {Authorization: Bearer token}
       ├─────────────────────────────→ authenticate middleware
       │                                     │
       │                                     ├─→ Extract token
       │                                     │
       │                                     ├─→ Verify JWT signature
       │                                     │
       │                                     ├─→ Check expiration
       │                                     │
       │                                     ├─→ SELECT user WHERE id = ?
       │                                     │                  ────────────
       │                                     │                 │ users     │
       │                                     │────────────────→│ ────────  │
       │                                     │                 │ id        │
       │                                     │                 │ is_active │
       │                                     │                 └───────────┘
       │                                     │
       │                                     ├─→ Attach user to request
       │                                     │    req.userId = token.userId
       │                                     │
       │ (if token valid)                   ├─→ Call route handler
       │ ← Response ←───────────────────────────│


┌─────────────────────────────────────────────────────────────────┐
│                     ACTIVITY LOGGING                             │
└─────────────────────────────────────────────────────────────────┘

   Frontend/Backend                   Services             Database
   ────────────────                   ────────             ────────
   
   Route Handler
       │
       │ User action (view, create, update)
       │
       ├─→ ActivityService.log...()
       │   (async, non-blocking)
       │        │
       │        └─→ setImmediate()
       │                │
       │                ├─→ INSERT INTO user_activity
       │                │   (user_id, action, data, ip, agent, created_at)
       │                │                    ────────────────────────────
       │                │                   │ user_activity table      │
       │                │────────────────→ │ ──────────────────────   │
       │                │                  │ id                        │
       │                │                  │ user_id (indexed)         │
       │                │                  │ action (indexed)          │
       │                │                  │ action_category           │
       │                │                  │ data (JSONB)              │
       │                │                  │ ip_address                │
       │                │                  │ user_agent                │
       │                │                  │ created_at (indexed)      │
       │                │                  └──────────────────────────┘
       │                │
       │                └─→ Silent completion
       │
       ├─→ Continue with main request (non-blocking)
       │
       ← Response to client


┌─────────────────────────────────────────────────────────────────┐
│                  AUTOMATIC CLEANUP JOB                           │
└─────────────────────────────────────────────────────────────────┘

   Node-Cron                          CleanupService        Database
   ─────────                          ──────────────        ────────
   
   Schedule: 0 2 * * * (2 AM daily)
       │
       └─→ Trigger cleanup job
            │
            ├─→ DELETE FROM user_activity
            │   WHERE created_at < NOW() - INTERVAL '3 months'
            │                         ──────────────────────────
            │                        │ user_activity  │
            │────────────────────→ │ ──────────────  │
            │                      │ Old records     │
            │                      │ (90+ days old)  │
            │                      │ DELETED         │
            │                      └─────────────────┘
            │
            ├─→ Log cleanup event
            │   INSERT INTO user_activity
            │   (system cleanup action)
            │
            └─→ Complete


┌─────────────────────────────────────────────────────────────────┐
│                   SESSION RECOVERY                               │
└─────────────────────────────────────────────────────────────────┘

   Frontend (React)                      Backend            Database
   ───────────────                       ───────            ────────
   
   Page Load / App Start
       │
       ├─→ AuthContext useEffect
       │        │
       │        ├─→ Get token from localStorage
       │        │
       │        ├─→ Token exists?
       │        │   │
       │        │   YES
       │        │   │
       │        │   ├─→ GET /auth/me
       │        │   │    Headers: {Authorization: Bearer token}
       │        │   ├─────────────────────────────→ Authenticate & verify
       │        │   │                                      │
       │        │   │                                      ├─→ Verify JWT
       │        │   │                                      │
       │        │   │                                      ├─→ Get user from DB
       │        │   │                                      │        ─────────
       │        │   │                                      │       │ users │
       │        │   │                                      │      ──────────
       │        │   │
       │        │   ← User data ←─────────────────────────────────┤
       │        │   │
       │        │   ├─→ Dispatch AUTH_SUCCESS
       │        │   │    (user restored to state)
       │        │   │
       │        │   NO
       │        │   │
       │        │   └─→ Dispatch SET_LOADING(false)
       │        │
       │ State updated with user info
       │
       ├─→ App renders authenticated UI
       │


┌─────────────────────────────────────────────────────────────────┐
│              DATABASE SCHEMA & INDEXES                           │
└─────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────┐
   │         USERS TABLE                 │
   ├─────────────────────────────────────┤
   │ id                  SERIAL PRIMARY   │
   │ email               VARCHAR UNIQUE   │
   │ password_hash       VARCHAR          │
   │ full_name           VARCHAR          │
   │ phone               VARCHAR          │
   │ role                VARCHAR DEFAULT  │
   │ is_active           BOOLEAN DEFAULT  │
   │ created_at          TIMESTAMP        │
   │ updated_at          TIMESTAMP        │
   └─────────────────────────────────────┘
           │
           │
           ├─→ INDEX: email (for login lookup)
           │
           └─→ INDEX: role (for authorization)


   ┌──────────────────────────────────────────┐
   │     USER_ACTIVITY TABLE                  │
   ├──────────────────────────────────────────┤
   │ id                  SERIAL PRIMARY        │
   │ user_id             INTEGER FOREIGN KEY   │────→ users(id)
   │ action              VARCHAR               │
   │ action_category     VARCHAR               │
   │ data                JSONB                 │
   │ ip_address          VARCHAR               │
   │ user_agent          TEXT                  │
   │ created_at          TIMESTAMP             │
   └──────────────────────────────────────────┘
           │
           ├─→ INDEX: user_id
           │   (fast user activity lookups)
           │
           ├─→ INDEX: created_at
           │   (fast date filtering & cleanup)
           │
           ├─→ INDEX: action
           │   (fast action filtering)
           │
           └─→ INDEX: (user_id, created_at DESC)
               (composite for timeline queries)


┌─────────────────────────────────────────────────────────────────┐
│                  COMPONENT ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────┘

                     ┌─────────────────────┐
                     │   App Component     │
                     │  ┌───────────────┐  │
                     │  │ AuthProvider  │  │
                     │  │  ┌─────────┐  │  │
                     │  │  │ Context │  │  │
                     │  │  └─────────┘  │  │
                     │  └───────────────┘  │
                     └─────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────────────┐          ┌────────────────┐
        │  Public Pages │          │ Admin Pages    │
        ├───────────────┤          ├────────────────┤
        │ Home          │          │ Dashboard      │
        │ Properties    │          │ Properties     │
        │ PropertyDetail│          │ Enquiries      │
        │ Contact       │          │ Users          │
        │ Login         │          │ Activity Logs  │
        │ Register      │          │ Settings       │
        └───────────────┘          └────────────────┘
                │                        │
                │                   (Protected)
                │                        │
        ┌───────────────┐          ┌────────────────┐
        │ API Service   │──────────│ API Endpoints  │
        ├───────────────┤          ├────────────────┤
        │ axios         │          │ /auth/*        │
        │ interceptors  │          │ /activity/*    │
        │ token inject  │          │ /properties/*  │
        └───────────────┘          │ /enquiries/*   │
                                   │ /interests/*   │
                                   └────────────────┘
                                        │
                                   (Protected)
                                        │
                               ┌─────────────────┐
                               │ Backend Routes  │
                               │ & Controllers   │
                               │ & Models        │
                               └─────────────────┘
                                        │
                               ┌─────────────────┐
                               │   Database      │
                               │ (PostgreSQL)    │
                               └─────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    API ENDPOINT STRUCTURE                        │
└─────────────────────────────────────────────────────────────────┘

   Authentication Endpoints
   ├── POST /api/auth/register
   │   └─→ AuthController.register()
   │       └─→ User.create()
   │           └─→ bcrypt.hash() → users table
   │
   ├── POST /api/auth/login
   │   └─→ AuthController.login()
   │       ├─→ User.findByEmail()
   │       ├─→ User.verifyPassword()
   │       └─→ Generate JWT
   │
   ├── GET /api/auth/me [Protected]
   │   └─→ AuthController.getCurrentUser()
   │       └─→ User.findById()
   │
   ├── POST /api/auth/logout [Protected]
   │   └─→ AuthController.logout()
   │       └─→ UserActivity.log()
   │
   ├── POST /api/auth/change-password [Protected]
   │   └─→ AuthController.changePassword()
   │       ├─→ User.verifyPassword()
   │       └─→ User.changePassword()
   │
   └── POST /api/auth/verify [Protected]
       └─→ AuthController.verifyToken()


   Activity Endpoints [Protected]
   ├── POST /api/activity/save
   │   └─→ ActivityController.saveActivity()
   │       └─→ UserActivity.log()
   │
   ├── GET /api/activity/user/:userId
   │   └─→ ActivityController.getUserActivity()
   │       └─→ UserActivity.getUserActivity()
   │
   └── GET /api/activity/stats/user/:userId
       └─→ ActivityController.getUserActivityStats()
           └─→ UserActivity.getUserActivityStats()


   Activity Endpoints [Admin Only]
   ├── GET /api/activity/all
   │   └─→ ActivityController.getAllActivities()
   │
   ├── GET /api/activity/category/:category
   │   └─→ ActivityController.getActivitiesByCategory()
   │
   └── GET /api/activity/stats
       └─→ ActivityController.getActivityStats()


┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                             │
└─────────────────────────────────────────────────────────────────┘

   User Action
        │
        ├─→ [Middleware]
        │   ├─→ authenticate (verify JWT)
        │   ├─→ authorize (check role)
        │   └─→ req.userId, req.user attached
        │
        ├─→ [Controller]
        │   ├─→ Validate input
        │   ├─→ Business logic
        │   └─→ Database operations
        │
        ├─→ [Service Layer]
        │   ├─→ ActivityService.log...()
        │   │   └─→ async, non-blocking
        │   │       └─→ UserActivity.log()
        │   │           └─→ Database INSERT
        │   │
        │   └─→ (Other services)
        │
        ├─→ [Response]
        │   ├─→ Success: JSON + status
        │   └─→ Error: Error message + status
        │
        └─→ [Frontend]
            ├─→ Axios interceptors
            ├─→ Update state
            └─→ Re-render UI


┌─────────────────────────────────────────────────────────────────┐
│                 SECURITY LAYERS                                  │
└─────────────────────────────────────────────────────────────────┘

   Request
     │
     ├─→ Layer 1: CORS
     │   └─→ Only whitelisted origins allowed
     │
     ├─→ Layer 2: Helmet
     │   └─→ Security headers set
     │
     ├─→ Layer 3: Input Validation
     │   └─→ express-validator checks
     │
     ├─→ Layer 4: Authentication
     │   └─→ JWT verified & signature checked
     │
     ├─→ Layer 5: Authorization
     │   └─→ User role checked for endpoint
     │
     ├─→ Layer 6: SQL Injection Prevention
     │   └─→ Parameterized queries used
     │
     └─→ Layer 7: Rate Limiting
         └─→ (Recommended future enhancement)

   Response
     │
     ├─→ Sensitive data not exposed
     ├─→ Error messages sanitized
     └─→ HTTPS recommended
