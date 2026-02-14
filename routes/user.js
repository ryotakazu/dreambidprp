import express from 'express';
import UserController from '../controllers/UserController.js';
import { authenticateToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Get current user info
router.get('/me', UserController.getMe);

// Update user profile
router.put('/profile', UserController.updateProfile);

// Upload profile photo
router.post('/upload-photo', upload.single('photo'), UserController.uploadPhoto);

// Delete profile photo
router.delete('/photo', UserController.deletePhoto);

// Change password
router.post('/change-password', UserController.changePassword);

// Get user activity
router.get('/activity', UserController.getUserActivity);

// Get activity statistics
router.get('/activity/stats', UserController.getActivityStats);

export default router;
