import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

// Verify JWT token and attach user info to request
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const result = await pool.query(
      'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!result.rows[0].is_active) {
      return res.status(401).json({ message: 'User account is inactive' });
    }

    // Attach user info to request for use in route handlers
    req.user = result.rows[0];
    req.userId = result.rows[0].id;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions' });
    }

    next();
  };
};

// Optional authentication (doesn't fail if token is missing)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const result = await pool.query(
        'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length > 0 && result.rows[0].is_active) {
        req.user = result.rows[0];
        req.userId = result.rows[0].id;
        req.token = token;
      }
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
  }
  
  next();
};

export { authenticate, authorize, optionalAuth };

