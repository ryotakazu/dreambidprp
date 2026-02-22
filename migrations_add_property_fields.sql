-- Migration: Add new property fields to properties table
-- Date: 2026-02-23
-- This migration is idempotent and safe to run multiple times

-- Skip if all columns already exist
DO $$
BEGIN
  -- Add estimated_market_value if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'estimated_market_value') THEN
    ALTER TABLE properties ADD COLUMN estimated_market_value DECIMAL(15, 2);
  END IF;
  
  -- Add built_up_area if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'built_up_area') THEN
    ALTER TABLE properties ADD COLUMN built_up_area DECIMAL(10, 2);
  END IF;
  
  -- Add total_area if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'total_area') THEN
    ALTER TABLE properties ADD COLUMN total_area DECIMAL(10, 2);
  END IF;
  
  -- Add emd if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'emd') THEN
    ALTER TABLE properties ADD COLUMN emd DECIMAL(15, 2);
  END IF;
  
  -- Add possession_type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'possession_type') THEN
    ALTER TABLE properties ADD COLUMN possession_type VARCHAR(100);
  END IF;
  
  -- Add application_end_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'application_end_date') THEN
    ALTER TABLE properties ADD COLUMN application_end_date TIMESTAMP;
  END IF;
  
  -- Add auction_time if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'auction_time') THEN
    ALTER TABLE properties ADD COLUMN auction_time TIME;
  END IF;
  
  RAISE NOTICE 'Migration completed successfully';
END
$$;
