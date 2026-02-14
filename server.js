import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import pool from './config/database.js';
import CleanupService from './services/CleanupService.js';

// Import routes
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activity.js';
import propertyRoutes from './routes/properties.js';
import enquiryRoutes from './routes/enquiries.js';
import interestRoutes from './routes/interests.js';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://dreambid-new.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parse error:', err);
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database on startup
async function initializeDatabase() {
  try {
    console.log('🔄 Checking/initializing database...');
    
    // Check if users table exists
    const tableCheck = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')"
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log('📝 Creating database tables...');
      
      // Read and execute schema
      const schemaSql = fs.readFileSync(path.join(__dirname, 'setup-database.sql'), 'utf-8');
      await pool.query(schemaSql);
      console.log('✅ Schema created');
      
      // Read and execute seed data
      const seedSql = fs.readFileSync(path.join(__dirname, 'seed-properties.sql'), 'utf-8');
      await pool.query(seedSql);
      console.log('✅ Seed data inserted');
    } else {
      console.log('✅ Database tables already exist');
      
      // Ensure admin user exists with correct password
      try {
        await pool.query(
          `INSERT INTO users (email, password_hash, full_name, role, is_active)
           VALUES ('admin@dreambid.com', 'admin123', 'Admin User', 'admin', true)
           ON CONFLICT (email) DO UPDATE SET password_hash = 'admin123'`
        );
        console.log('✅ Admin user verified');
      } catch (err) {
        console.log('ℹ️  Admin user setup skipped');
      }
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    // Don't exit - let the app continue anyway
  }
}

// Initialize database before starting server
await initializeDatabase();

// Initialize cleanup service (scheduled jobs)
CleanupService.initSchedules();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/interests', interestRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 DreamBid Unified Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;