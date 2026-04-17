-- ============================================
-- THE SCENE - Migration 010
-- Marketplace + Event Check-In with Vehicle
-- ============================================

-- ============================================
-- MARKETPLACE LISTINGS
-- ============================================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('vehicle', 'parts')),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_obo BOOLEAN DEFAULT false,
  city TEXT,
  state TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'closed', 'archived')),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_offer_id UUID,
  seller_contact_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public offers/comments on listings
CREATE TABLE listing_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_offer BOOLEAN DEFAULT false,
  offer_amount DECIMAL(10, 2),
  offer_status TEXT DEFAULT 'pending' CHECK (offer_status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings (after completed deal)
CREATE TABLE listing_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, rater_id)
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status, created_at DESC);
CREATE INDEX idx_listings_type ON listings(listing_type);
CREATE INDEX idx_listing_comments ON listing_comments(listing_id, created_at);
CREATE INDEX idx_listing_ratings ON listing_ratings(rated_id);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings viewable" ON listings FOR SELECT USING (status IN ('active', 'pending', 'sold'));
CREATE POLICY "Sellers can manage own listings" ON listings FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY "Listing images viewable" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Sellers can manage listing images" ON listing_images FOR ALL USING (
  EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_id AND listings.seller_id = auth.uid())
);
CREATE POLICY "Comments viewable" ON listing_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can comment" ON listing_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON listing_comments FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Ratings viewable" ON listing_ratings FOR SELECT USING (true);
CREATE POLICY "Participants can rate" ON listing_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Auto-archive closed listings after 7 days
CREATE OR REPLACE FUNCTION auto_archive_listings()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE listings
  SET status = 'archived', archived_at = NOW()
  WHERE status = 'closed'
    AND closed_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get seller rating
CREATE OR REPLACE FUNCTION get_user_marketplace_rating(p_user_id UUID)
RETURNS TABLE (avg_rating NUMERIC, total_ratings BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(rating)::numeric, 1) as avg_rating,
    COUNT(*) as total_ratings
  FROM listing_ratings
  WHERE rated_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- EVENT CHECK-IN (enhanced with vehicle selection)
-- ============================================
CREATE TABLE event_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  note TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_checkins_event ON event_checkins(event_id);
CREATE INDEX idx_event_checkins_user ON event_checkins(user_id);

ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Checkins viewable" ON event_checkins FOR SELECT USING (true);
CREATE POLICY "Users can checkin" ON event_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkin" ON event_checkins FOR UPDATE USING (auth.uid() = user_id);
