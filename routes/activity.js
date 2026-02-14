import express from 'express';
import { body } from 'express-validator';
import ActivityController from '../controllers/ActivityController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All activity routes require authentication
router.use(authenticate);

// @route   POST /api/activity/save
// @desc    Save user activity
// @access  Private
router.post('/save', [
  body('action')
    .trim()
    .notEmpty()
    .withMessage('Action is required'),
  body('action_category')
    .optional()
    .trim(),
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be a valid object')
], ActivityController.saveActivity);

// @route   GET /api/activity/user/:userId
// @desc    Get user activity history
// @access  Private (own data) or Admin
router.get('/user/:userId', ActivityController.getUserActivity);

// @route   GET /api/activity/stats/user/:userId
// @desc    Get user activity statistics
// @access  Private (own data) or Admin
router.get('/stats/user/:userId', ActivityController.getUserActivityStats);

// Admin-only routes
router.use(authorize('admin'));

// @route   GET /api/activity/all
// @desc    Get all activities (admin only)
// @access  Private - Admin
router.get('/all', ActivityController.getAllActivities);

// @route   GET /api/activity/category/:category
// @desc    Get activities by category (admin only)
// @access  Private - Admin
router.get('/category/:category', ActivityController.getActivitiesByCategory);

// @route   GET /api/activity/stats
// @desc    Get overall activity statistics (admin only)
// @access  Private - Admin
router.get('/stats', ActivityController.getActivityStats);

export default router;
