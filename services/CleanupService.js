import cron from 'node-cron';
import pool from '../config/database.js';

class CleanupService {
  /**
   * Initialize scheduled cleanup jobs
   */
  static initSchedules() {
    console.log('📋 Initializing cleanup schedules...');

    // Run cleanup daily at 2 AM
    this.scheduleActivityCleanup('0 2 * * *');

    // Optional: Run cleanup weekly (Sundays at 3 AM)
    this.scheduleArchivedDataCleanup('0 3 * * 0');
  }

  /**
   * Schedule activity cleanup
   * Deletes user_activity records older than 3 months
   * 
   * @param {string} cronExpression - Cron expression (default: 0 2 * * * = 2 AM daily)
   */
  static scheduleActivityCleanup(cronExpression = '0 2 * * *') {
    const task = cron.schedule(cronExpression, async () => {
      try {
        console.log(`[${new Date().toISOString()}] ⏰ Running activity cleanup job...`);

        const result = await pool.query(
          `DELETE FROM user_activity 
           WHERE created_at < NOW() - INTERVAL '3 months'
           RETURNING id`
        );

        const deletedCount = result.rows.length;
        console.log(`✅ Activity cleanup completed: ${deletedCount} records deleted`);

        // Log cleanup event
        await pool.query(
          `INSERT INTO user_activity (user_id, action, action_category, data, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            1, // System action - use admin user ID or null if preferred
            'system_cleanup',
            'system',
            JSON.stringify({
              type: 'activity_cleanup',
              records_deleted: deletedCount,
              older_than_days: 90
            })
          ]
        ).catch(err => console.error('Error logging cleanup:', err));

      } catch (error) {
        console.error('❌ Activity cleanup job failed:', error);
      }
    });

    console.log(`✓ Activity cleanup scheduled: ${cronExpression} (Daily at 2 AM)`);
    return task;
  }

  /**
   * Schedule cleanup of archived or old data
   * Can be customized for other cleanup needs
   * 
   * @param {string} cronExpression - Cron expression (default: 0 3 * * 0 = 3 AM Sundays)
   */
  static scheduleArchivedDataCleanup(cronExpression = '0 3 * * 0') {
    const task = cron.schedule(cronExpression, async () => {
      try {
        console.log(`[${new Date().toISOString()}] ⏰ Running archived data cleanup...`);

        // Example: Delete inactive user accounts older than 1 year
        const result = await pool.query(
          `DELETE FROM users 
           WHERE is_active = false 
           AND updated_at < NOW() - INTERVAL '1 year'
           RETURNING id`
        );

        const deletedCount = result.rows.length;
        console.log(`✅ Archived data cleanup completed: ${deletedCount} inactive users removed`);

      } catch (error) {
        console.error('❌ Archived data cleanup failed:', error);
      }
    });

    console.log(`✓ Archived data cleanup scheduled: ${cronExpression} (Weekly on Sundays at 3 AM)`);
    return task;
  }

  /**
   * Manual cleanup trigger for activity records
   * Useful for admin operations
   * 
   * @param {number} daysOld - Delete records older than this many days (default: 90)
   * @returns {Promise<number>} Number of deleted records
   */
  static async manualActivityCleanup(daysOld = 90) {
    try {
      console.log(`🧹 Running manual activity cleanup (older than ${daysOld} days)...`);

      const result = await pool.query(
        `DELETE FROM user_activity 
         WHERE created_at < NOW() - INTERVAL '${daysOld} days'
         RETURNING id`
      );

      const deletedCount = result.rows.length;
      console.log(`✅ Manual cleanup completed: ${deletedCount} records deleted`);
      return deletedCount;
    } catch (error) {
      console.error('Error during manual cleanup:', error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics
   * Returns info about what would be deleted
   */
  static async getCleanupStats(daysOld = 90) {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT user_id) as affected_users,
          MIN(created_at) as oldest_record,
          MAX(created_at) as newest_record
         FROM user_activity 
         WHERE created_at < NOW() - INTERVAL '${daysOld} days'`
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      throw error;
    }
  }

  /**
   * Stop all scheduled tasks (useful for testing or graceful shutdown)
   */
  static stopAllSchedules() {
    // Note: This would require storing task references
    // For now, graceful shutdown is handled by Node.js
    console.log('⏹ Stopping all scheduled cleanup tasks...');
  }
}

export default CleanupService;
