-- ============================================
-- THE SCENE - Migration 002
-- Car Clubs + Event Photo Posts
-- ============================================

-- ============================================
-- CAR CLUBS
-- ============================================
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  website TEXT,
  instagram_handle TEXT,
  facebook_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clubs can have multiple locations/chapters
CREATE TABLE club_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  label TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club membership (admin-managed)
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'officer', 'admin', 'founder')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(club_id, user_id)
);

-- ============================================
-- EVENT PHOTO POSTS (post-event sharing)
-- "<username> <year make model> posted a photo from <event name>"
-- ============================================
CREATE TABLE event_photo_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  props_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on event photo posts
CREATE TABLE event_photo_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_post_id UUID NOT NULL REFERENCES event_photo_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_clubs_slug ON clubs(slug);
CREATE INDEX idx_club_locations_club ON club_locations(club_id);
CREATE INDEX idx_club_locations_state ON club_locations(state);
CREATE INDEX idx_club_locations_city_state ON club_locations(city, state);
CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_user ON club_members(user_id);
CREATE INDEX idx_event_photo_posts_event ON event_photo_posts(event_id);
CREATE INDEX idx_event_photo_posts_author ON event_photo_posts(author_id);
CREATE INDEX idx_event_photo_comments_post ON event_photo_comments(photo_post_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photo_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photo_comments ENABLE ROW LEVEL SECURITY;

-- CLUBS
CREATE POLICY "Public clubs viewable" ON clubs FOR SELECT USING (is_public = true);
CREATE POLICY "Founders can manage clubs" ON clubs FOR ALL USING (created_by = auth.uid());

-- CLUB LOCATIONS
CREATE POLICY "Club locations viewable" ON club_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM clubs WHERE clubs.id = club_id AND clubs.is_public = true)
);
CREATE POLICY "Club admins can manage locations" ON club_locations FOR ALL USING (
  EXISTS (SELECT 1 FROM club_members WHERE club_members.club_id = club_locations.club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('admin', 'founder'))
);

-- CLUB MEMBERS
CREATE POLICY "Members viewable" ON club_members FOR SELECT USING (true);
CREATE POLICY "Club admins can add members" ON club_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM club_members cm WHERE cm.club_id = club_members.club_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'founder'))
  OR
  EXISTS (SELECT 1 FROM clubs WHERE clubs.id = club_members.club_id AND clubs.created_by = auth.uid())
);
CREATE POLICY "Club admins can remove members" ON club_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM club_members cm WHERE cm.club_id = club_members.club_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'founder'))
);

-- EVENT PHOTO POSTS
CREATE POLICY "Event photos viewable" ON event_photo_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated can post event photos" ON event_photo_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own event photos" ON event_photo_posts FOR DELETE USING (auth.uid() = author_id);

-- EVENT PHOTO COMMENTS
CREATE POLICY "Event photo comments viewable" ON event_photo_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can comment on event photos" ON event_photo_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON event_photo_comments FOR DELETE USING (auth.uid() = author_id);

-- ============================================
-- PROPS TRIGGER for event photo posts
-- ============================================
CREATE OR REPLACE FUNCTION handle_event_photo_props()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'event_photo' THEN
    UPDATE event_photo_posts SET props_count = props_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'event_photo' THEN
    UPDATE event_photo_posts SET props_count = props_count - 1 WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_photo_prop
  AFTER INSERT OR DELETE ON props
  FOR EACH ROW EXECUTE FUNCTION handle_event_photo_props();

-- Update props target_type check to include event_photo
ALTER TABLE props DROP CONSTRAINT IF EXISTS props_target_type_check;
ALTER TABLE props ADD CONSTRAINT props_target_type_check CHECK (target_type IN ('vehicle', 'post', 'event', 'event_photo'));

-- ============================================
-- AUTO-CLOSE EVENTS function
-- Call this via a cron job or Supabase Edge Function
-- Closes events where event_date has passed
-- ============================================
CREATE OR REPLACE FUNCTION auto_close_expired_events()
RETURNS INTEGER AS $$
DECLARE
  closed_count INTEGER;
BEGIN
  UPDATE events
  SET status = 'completed', updated_at = NOW()
  WHERE status IN ('published', 'active')
    AND event_date < (NOW() - INTERVAL '1 day');

  GET DIAGNOSTICS closed_count = ROW_COUNT;
  RETURN closed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
