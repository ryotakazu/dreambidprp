import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDatabase() {
  try {
    console.log('🔄 Starting database initialization...');

    // Read the setup script
    const setupScript = fs.readFileSync(
      path.join(__dirname, '../setup-database.sql'),
      'utf-8'
    );

    // Split into individual statements and execute
    const statements = setupScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        console.log(`📝 Executing: ${statement.substring(0, 60)}...`);
        await pool.query(statement);
        successCount++;
      } catch (error) {
        // Ignore "table already exists" and similar non-critical errors
        if (error.code === '42P07' || error.code === '42701') {
          console.log(`⏭️  Skipped (already exists): ${statement.substring(0, 50)}...`);
          skipCount++;
        } else {
          console.error(`❌ Error: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
          errorCount++;
          // Don't exit on error - continue trying other statements
        }
      }
    }

    console.log(`\n✅ Database initialization completed!`);
    console.log(`   - Created: ${successCount}`);
    console.log(`   - Skipped: ${skipCount}`);
    console.log(`   - Errors: ${errorCount}`);

    // Verify critical tables exist
    const criticalTables = ['users', 'properties', 'user_activity'];
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    const result = await pool.query(tableCheckQuery);
    const existingTables = result.rows.map(row => row.table_name);

    console.log(`\n📋 Existing tables: ${existingTables.join(', ')}`);

    const missingTables = criticalTables.filter(t => !existingTables.includes(t));
    if (missingTables.length > 0) {
      console.warn(`⚠️  Missing critical tables: ${missingTables.join(', ')}`);
    } else {
      console.log(`✅ All critical tables verified!`);
    }

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

initializeDatabase();
