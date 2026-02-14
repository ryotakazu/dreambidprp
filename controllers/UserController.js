import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class UserController {
  // Get current logged-in user info
  static async getMe(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't send password hash
      const { password_hash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user info' });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { full_name, phone } = req.body;

      // Validate input
      if (!full_name || full_name.trim().length === 0) {
        return res.status(400).json({ message: 'Full name is required' });
      }

      const updatedUser = await User.update(userId, {
        full_name,
        phone
      });

      // Log activity
      UserActivity.log(userId, 'profile_updated', 'user_profile', {
        fields_updated: ['full_name', 'phone']
      }).catch(err => console.warn('Activity logging failed:', err.message));

      const { password_hash, ...userWithoutPassword } = updatedUser;
      res.json({
        message: 'Profile updated successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  }

  // Upload profile photo
  static async uploadPhoto(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const userId = req.user.id;
      const fileExt = path.extname(req.file.originalname);
      const fileName = `profile_${userId}_${Date.now()}${fileExt}`;
      const filePath = path.join(__dirname, '../uploads', fileName);

      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Save file
      fs.writeFileSync(filePath, req.file.buffer);

      // Save path to database
      const photoUrl = `/uploads/${fileName}`;
      const updatedUser = await User.update(userId, {
        profile_photo: photoUrl
      });

      // Log activity
      UserActivity.log(userId, 'profile_photo_uploaded', 'user_profile', {
        photo_url: photoUrl
      }).catch(err => console.warn('Activity logging failed:', err.message));

      const { password_hash, ...userWithoutPassword } = updatedUser;
      res.json({
        message: 'Profile photo uploaded successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ message: 'Failed to upload photo' });
    }
  }

  // Delete profile photo
  static async deletePhoto(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user || !user.profile_photo) {
        return res.status(404).json({ message: 'No profile photo found' });
      }

      // Delete file from disk
      const photoPath = path.join(__dirname, '..', user.profile_photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }

      // Remove from database
      const updatedUser = await User.update(userId, {
        profile_photo: null
      });

      // Log activity
      UserActivity.log(userId, 'profile_photo_deleted', 'user_profile').catch(
        err => console.warn('Activity logging failed:', err.message)
      );

      const { password_hash, ...userWithoutPassword } = updatedUser;
      res.json({
        message: 'Profile photo deleted successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({ message: 'Failed to delete photo' });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New passwords do not match' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }

      // Verify current password
      const user = await User.findById(userId);
      const isPasswordValid = await User.verifyPassword(currentPassword, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Update password
      await User.updatePassword(userId, newPassword);

      // Log activity
      UserActivity.log(userId, 'password_changed', 'security').catch(
        err => console.warn('Activity logging failed:', err.message)
      );

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  }

  // Get user activity
  static async getUserActivity(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      const activities = await UserActivity.getUserActivity(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      const count = await UserActivity.getUserActivityCount(userId);

      res.json({
        activities,
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ message: 'Failed to fetch activity' });
    }
  }

  // Get user activity statistics
  static async getActivityStats(req, res) {
    try {
      const userId = req.user.id;
      const { daysBack = 30 } = req.query;

      const stats = await UserActivity.getUserActivityStats(userId, parseInt(daysBack));

      res.json(stats);
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      res.status(500).json({ message: 'Failed to fetch activity stats' });
    }
  }
}

export default UserController;
