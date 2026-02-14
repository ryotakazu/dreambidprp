-- Insert sample properties with cover images
INSERT INTO properties (title, description, property_type, address, city, state, zip_code, country, latitude, longitude, area_sqft, bedrooms, bathrooms, floors, reserve_price, auction_date, auction_status, cover_image_url, created_by, is_featured) 
VALUES
('Modern Luxury Villa in Mumbai', 'A stunning 5-bedroom villa in the heart of Mumbai with premium amenities, swimming pool, and garden.', 'villa', '123 Palm Avenue', 'Mumbai', 'Maharashtra', '400001', 'India', 19.0760, 72.8777, 5000, 5, 3, 2, 5000000, '2026-02-15 10:00:00', 'upcoming', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', 1, true),
('Spacious Apartment in Bangalore', 'Well-maintained 3-bedroom apartment in a prime location with modern furnishing and all facilities.', 'apartment', '456 Tech Park', 'Bangalore', 'Karnataka', '560001', 'India', 12.9716, 77.5946, 2500, 3, 2, 20, 3500000, '2026-02-20 14:30:00', 'active', 'https://images.unsplash.com/photo-1545324418-cc1a9a6fded0?w=800&q=80', 1, true),
('Commercial Property in Delhi', 'Prime commercial space ideal for retail or office setup in the business district.', 'commercial', '789 Business Complex', 'Delhi', 'Delhi', '110001', 'India', 28.6139, 77.2090, 3000, 0, 0, 5, 4500000, '2026-02-10 09:00:00', 'active', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', 1, true),
('Agricultural Land in Pune', 'Fertile agricultural land with good water supply and irrigation facilities.', 'land', 'NH48 Highway', 'Pune', 'Maharashtra', '411001', 'India', 18.5204, 73.8567, 10000, 0, 0, 1, 2000000, '2026-03-01 11:00:00', 'upcoming', 'https://images.unsplash.com/photo-1500595046891-0573fbe7e6b7?w=800&q=80', 1, false),
('Beachfront House in Goa', 'Beautiful beachfront property with sea view, perfect for residential or investment purpose.', 'house', '321 Beach Road', 'Goa', 'Goa', '403001', 'India', 15.2993, 73.8243, 4000, 4, 3, 1, 6000000, '2026-02-25 15:00:00', 'upcoming', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 1, true);

-- Insert multiple images for each property (gallery images)
INSERT INTO property_images (property_id, image_url, image_order)
VALUES
(1, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', 0),
(1, 'https://images.unsplash.com/photo-1516594915697-87eb3b1a3069?w=800&q=80', 1),
(1, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', 2),
(2, 'https://images.unsplash.com/photo-1545324418-cc1a9a6fded0?w=800&q=80', 0),
(2, 'https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=800&q=80', 1),
(2, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 2),
(3, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80', 0),
(3, 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80', 1),
(3, 'https://images.unsplash.com/photo-1497366216548-495f67f88bda?w=800&q=80', 2),
(4, 'https://images.unsplash.com/photo-1500595046891-0573fbe7e6b7?w=800&q=80', 0),
(4, 'https://images.unsplash.com/photo-1500382017468-7049fdf98338?w=800&q=80', 1),
(5, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 0),
(5, 'https://images.unsplash.com/photo-1513984977263-4ca427ba0f9b?w=800&q=80', 1),
(5, 'https://images.unsplash.com/photo-1495615811223-4d98c6e9c869?w=800&q=80', 2);
