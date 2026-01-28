import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize database connection
let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'dreambid',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });
}

async function runMigrations() {
  try {
    console.log('Starting database migration...');
    
    // Run schema setup
    const schemaSql = fs.readFileSync(path.join(__dirname, 'setup-database.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('✅ Schema setup completed');

    // Run seed data
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed-properties.sql'), 'utf-8');
    await pool.query(seedSql);
    console.log('✅ Seed data completed');

    console.log('✅ All migrations completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

// Run migrations
runMigrations();
