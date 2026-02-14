import pool from '../config/database.js';

class UserActivity {
  // Log user activity
  static async log(userId, action, actionCategory = null, data = null, ipAddress = null, userAgent = null) {
    try {
      const result = await pool.query(
        `INSERT INTO user_activity (user_id, action, action_category, data, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id, user_id, action, action_category, data, created_at`,
        [userId, action, actionCategory, data ? JSON.stringify(data) : null, ipAddress, userAgent]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Don't throw - activity logging shouldn't break the main request
      return null;
    }
  }

  // Get user activity history
  static async getUserActivity(userId, limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT id, user_id, action, action_category, data, created_at
       FROM user_activity
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  // Get activity count for user
  static async getUserActivityCount(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM user_activity WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Get all activities (admin only)
  static async getAllActivities(limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT id, user_id, action, action_category, data, created_at
       FROM user_activity
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  // Get activities by action category
  static async getActivitiesByCategory(actionCategory, limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT id, user_id, action, action_category, data, created_at
       FROM user_activity
       WHERE action_category = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [actionCategory, limit, offset]
    );
    return result.rows;
  }

  // Get activities by action name
  static async getActivitiesByAction(action, limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT id, user_id, action, action_category, data, created_at
       FROM user_activity
       WHERE action = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [action, limit, offset]
    );
    return result.rows;
  }

  // Delete activities older than specified days
  static async deleteOldActivities(daysOld = 90) {
    try {
      const result = await pool.query(
        `DELETE FROM user_activity 
         WHERE created_at < NOW() - INTERVAL '${daysOld} days'
         RETURNING id`,
      );
      return result.rows.length;
    } catch (error) {
      console.error('Error deleting old activities:', error);
      throw error;
    }
  }

  // Get user activity statistics
  static async getUserActivityStats(userId, daysBack = 30) {
    const result = await pool.query(
      `SELECT 
        action,
        COUNT(*) as count,
        MAX(created_at) as last_activity
       FROM user_activity
       WHERE user_id = $1 
         AND created_at >= NOW() - INTERVAL '${daysBack} days'
       GROUP BY action
       ORDER BY count DESC`,
      [userId]
    );
    return result.rows;
  }

  // Get all activity statistics
  static async getActivityStats(daysBack = 30) {
    const result = await pool.query(
      `SELECT 
        action_category,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users
       FROM user_activity
       WHERE created_at >= NOW() - INTERVAL '${daysBack} days'
       GROUP BY action_category
       ORDER BY count DESC`
    );
    return result.rows;
  }
}

export default UserActivity;
