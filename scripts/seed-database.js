#!/usr/bin/env node

/**
 * Seed Database Script
 * Run: node scripts/seed-database.js
 * 
 * This script:
 * 1. Connects to the database
 * 2. Checks if properties exist
 * 3. If not, seeds sample data
 */

import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seedDatabase() {
  try {
    console.log('🔄 Checking if database needs seeding...');
    
    // Check if properties exist
    const result = await pool.query('SELECT COUNT(*) FROM properties');
    const propertyCount = parseInt(result.rows[0].count);
    
    if (propertyCount > 0) {
      console.log(`✅ Database already has ${propertyCount} properties. Skipping seed.`);
      return;
    }
    
    console.log('📝 No properties found. Seeding database...');
    
    // Read seed file
    const seedPath = path.join(__dirname, '..', 'seed-properties.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');
    
    // Split statements
    const statements = seedSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Executing ${statements.length} seed statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        await pool.query(statement);
        successCount++;
      } catch (err) {
        // Ignore duplicate key errors (safe to skip)
        if (err.message.includes('duplicate key') || 
            err.message.includes('already exists')) {
          console.log(`  ℹ️  Skipped duplicate: ${statement.substring(0, 50)}...`);
        } else {
          console.error(`  ❌ Error: ${err.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n✅ Seeding completed:`);
    console.log(`   ✅ ${successCount} statements executed`);
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} errors (likely duplicates)`);
    }
    
    // Verify
    const finalResult = await pool.query('SELECT COUNT(*) FROM properties');
    console.log(`   📊 Total properties in database: ${finalResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
