# Railway Database Error Fix

## Problem Summary
Your Railway PostgreSQL logs were showing:
```
ERROR: relation "user_activity" does not exist at character 13
STATEMENT: DELETE FROM user_activity WHERE created_at < NOW() - INTERVAL '3 months' RETURNING id
```

## Root Cause
The `user_activity` table was **missing from your Railway database**. This happened because:

1. Your database already had the `users` table from a previous deployment
2. The `initializeDatabase()` function in `server.js` only runs the full `setup-database.sql` schema if the `users` table doesn't exist
3. Since `users` already existed, the schema script was skipped, and the `user_activity` table was never created
4. The `CleanupService` runs a scheduled job daily at 2 AM that tries to delete old activity records
5. This job failed because the table didn't exist, causing the error in your logs

## Solutions Implemented

### 1. **server.js** - Added Table Existence Check
Modified `initializeDatabase()` to check if the `user_activity` table exists, even if the `users` table does. If missing, it will now **automatically create** the table with all required indexes:

```javascript
// Check if user_activity table exists and create if missing
const userActivityCheck = await pool.query(
  "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity')"
);

if (!userActivityCheck.rows[0].exists) {
  // Create table and indexes...
}
```

### 2. **CleanupService.js** - Added Error Handling
Updated all cleanup methods to safely check if the table exists before attempting to query it:

- `scheduleActivityCleanup()` - Checks table existence before scheduling cleanup
- `manualActivityCleanup()` - Returns 0 if table doesn't exist
- `getCleanupStats()` - Returns safe default values if table doesn't exist

## What to Do Now

### Option A: Deploy and Restart (Recommended)
1. Push these changes to Railway
2. The app will restart automatically
3. On startup, `initializeDatabase()` will create the missing `user_activity` table
4. The cleanup job will run successfully at 2 AM

### Option B: Manual Fix (If needed)
If you can't wait for a restart, you can manually run this SQL on your Railway database:

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

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX idx_user_activity_action ON user_activity(action);
CREATE INDEX idx_user_activity_user_date ON user_activity(user_id, created_at DESC);
```

## SSL Connection Warnings
The logs also show SSL warnings about "received direct SSL connection request without ALPN protocol negotiation extension". These are **non-critical informational messages** and can be safely ignored. They typically occur when certain database drivers connect without negotiating ALPN protocol and don't indicate any problems.

## Files Modified
- `server.js` - Added missing table creation logic
- `services/CleanupService.js` - Added safety checks before querying

## Testing
After deployment, the logs should show:
```
✅ Database tables already exist
📝 Creating user_activity table (missing from existing database)...
✅ user_activity table created
✓ Activity cleanup scheduled: 0 2 * * * (Daily at 2 AM)
```

No more error messages should appear at 2 AM UTC!
