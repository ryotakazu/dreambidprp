-- DreamBid Database Schema
-- PostgreSQL setup script

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'staff', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Properties table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  property_type VARCHAR(100),
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  area_sqft DECIMAL(10, 2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  floors INTEGER,
  reserve_price DECIMAL(15, 2) NOT NULL,
  auction_date TIMESTAMP NOT NULL,
  auction_status VARCHAR(50) DEFAULT 'upcoming' CHECK (auction_status IN ('upcoming', 'active', 'expired', 'sold', 'cancelled')),
  cover_image_url VARCHAR(500),
  pdf_url VARCHAR(500),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  enquiries_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Property Images table
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT,
  enquiry_type VARCHAR(50) DEFAULT 'general' CHECK (enquiry_type IN ('general', 'bid', 'inspection', 'complaint')),
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Property Interests table (for tracking views, shares, saves, contacts)
CREATE TABLE IF NOT EXISTS property_interests (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  interest_type VARCHAR(50) NOT NULL CHECK (interest_type IN ('view', 'share', 'contact', 'save')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_auction_status ON properties(auction_status);
CREATE INDEX idx_properties_auction_date ON properties(auction_date);
CREATE INDEX idx_properties_is_active ON properties(is_active);
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_enquiries_property_id ON enquiries(property_id);
CREATE INDEX idx_enquiries_user_id ON enquiries(user_id);
CREATE INDEX idx_enquiries_status ON enquiries(status);
CREATE INDEX idx_property_interests_property_id ON property_interests(property_id);
CREATE INDEX idx_property_interests_user_id ON property_interests(user_id);
CREATE INDEX idx_property_interests_type ON property_interests(interest_type);
CREATE INDEX idx_users_email ON users(email);

-- Create User Activity Tracking table
CREATE TABLE IF NOT EXISTS user_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  action_category VARCHAR(50),
  data JSONB DEFAULT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user_activity table for performance
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX idx_user_activity_action ON user_activity(action);
CREATE INDEX idx_user_activity_user_date ON user_activity(user_id, created_at DESC);

-- Insert a sample admin user (password: admin123 - plain text for development)
-- Note: In production, create users through the API with bcrypt hashing
INSERT INTO users (email, password_hash, full_name, role, is_active)
VALUES ('admin@dreambid.com', 'admin123', 'Admin User', 'admin', true)
ON CONFLICT (email) DO NOTHING;
