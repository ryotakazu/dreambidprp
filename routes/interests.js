import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/interests
// @desc    Track property interest (view, share, contact, save)
// @access  Public (but can be authenticated)
router.post('/', async (req, res) => {
  try {
    const { property_id, interest_type } = req.body;

    if (!property_id || !interest_type) {
      return res.status(400).json({ message: 'property_id and interest_type are required' });
    }

    if (!['view', 'share', 'contact', 'save'].includes(interest_type)) {
      return res.status(400).json({ message: 'Invalid interest_type. Must be: view, share, contact, or save' });
    }

    // Check if property exists
    const propertyCheck = await pool.query('SELECT id FROM properties WHERE id = $1 AND is_active = true', [property_id]);
    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Get user ID if authenticated
    let userId = null;
    if (req.header('Authorization')) {
      try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {
        // Not authenticated, continue as guest
      }
    }

    // Record interest
    await pool.query(
      `INSERT INTO property_interests (property_id, user_id, interest_type, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        property_id,
        userId,
        interest_type,
        req.ip || req.connection.remoteAddress,
        req.get('user-agent') || null
      ]
    );

    // Update property counters
    if (interest_type === 'view') {
      await pool.query('UPDATE properties SET views_count = views_count + 1 WHERE id = $1', [property_id]);
    } else if (interest_type === 'share') {
      await pool.query('UPDATE properties SET shares_count = shares_count + 1 WHERE id = $1', [property_id]);
    } else if (interest_type === 'contact') {
      await pool.query('UPDATE properties SET enquiries_count = enquiries_count + 1 WHERE id = $1', [property_id]);
    }

    res.json({ message: 'Interest tracked successfully' });
  } catch (error) {
    console.error('Track interest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/interests/stats/:property_id
// @desc    Get interest statistics for a property
// @access  Private (Admin/Staff)
router.get('/stats/:property_id', authenticate, async (req, res) => {
  try {
    const { property_id } = req.params;

    // Only admin/staff can see stats
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT 
        interest_type,
        COUNT(*) as count
       FROM property_interests
       WHERE property_id = $1
       GROUP BY interest_type`,
      [property_id]
    );

    const stats = {
      views: 0,
      shares: 0,
      contacts: 0,
      saves: 0
    };

    result.rows.forEach(row => {
      const key = row.interest_type === 'view' ? 'views' : 
                  row.interest_type === 'share' ? 'shares' :
                  row.interest_type === 'contact' ? 'contacts' : 'saves';
      stats[key] = parseInt(row.count);
    });

    res.json({ property_id, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
