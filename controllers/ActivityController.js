import { validationResult } from 'express-validator';
import UserActivity from '../models/UserActivity.js';

class ActivityController {
  // Save user activity
  static async saveActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { action, action_category, data } = req.body;

      // Log the activity
      const activity = await UserActivity.log(
        req.userId,
        action,
        action_category,
        data,
        req.ip,
        req.get('user-agent')
      );

      if (!activity) {
        return res.status(500).json({ message: 'Failed to save activity' });
      }

      res.status(201).json({
        message: 'Activity recorded successfully',
        activity
      });
    } catch (error) {
      console.error('Save activity error:', error);
      res.status(500).json({ message: 'Failed to save activity', error: error.message });
    }
  }

  // Get user activity history
  static async getUserActivity(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      // Ensure the user can only access their own activity (or admin can view all)
      const userId = req.user.role === 'admin' ? req.params.userId : req.userId;

      if (!req.user.role === 'admin' && parseInt(req.params.userId) !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const activities = await UserActivity.getUserActivity(userId, parseInt(limit), parseInt(offset));
      const count = await UserActivity.getUserActivityCount(userId);

      res.json({
        activities,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({ message: 'Failed to fetch activity', error: error.message });
    }
  }

  // Get all activities (admin only)
  static async getAllActivities(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const activities = await UserActivity.getAllActivities(parseInt(limit), parseInt(offset));

      res.json({
        activities,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get all activities error:', error);
      res.status(500).json({ message: 'Failed to fetch activities', error: error.message });
    }
  }

  // Get activities by category (admin only)
  static async getActivitiesByCategory(req, res) {
    try {
      const { category } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const activities = await UserActivity.getActivitiesByCategory(
        category,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        category,
        activities,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get activities by category error:', error);
      res.status(500).json({ message: 'Failed to fetch activities', error: error.message });
    }
  }

  // Get user activity statistics
  static async getUserActivityStats(req, res) {
    try {
      const { daysBack = 30 } = req.query;
      const userId = req.user.role === 'admin' ? req.params.userId : req.userId;

      if (!req.user.role === 'admin' && parseInt(req.params.userId) !== req.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const stats = await UserActivity.getUserActivityStats(userId, parseInt(daysBack));

      res.json({
        userId,
        daysBack: parseInt(daysBack),
        stats
      });
    } catch (error) {
      console.error('Get activity stats error:', error);
      res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
    }
  }

  // Get overall activity statistics (admin only)
  static async getActivityStats(req, res) {
    try {
      const { daysBack = 30 } = req.query;

      const stats = await UserActivity.getActivityStats(parseInt(daysBack));

      res.json({
        daysBack: parseInt(daysBack),
        stats
      });
    } catch (error) {
      console.error('Get overall stats error:', error);
      res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
    }
  }
}

export default ActivityController;
