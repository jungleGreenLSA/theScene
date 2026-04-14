-- ============================================
-- THE SCENE - Migration 004
-- Social features: activity feed, online status,
-- avatar upload, club events, flyer tags
-- ============================================

-- Add online/active status to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Add flyer support and club ownership to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS flyer_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS state TEXT;

-- Activity feed table (denormalized for fast reads)
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'joined', 'added_photo', 'updated_vehicle', 'added_vehicle',
    'created_event', 'club_added_member', 'posted_car_show',
    'updated_profile', 'followed_user', 'posted_flyer'
  )),
  target_type TEXT CHECK (target_type IN ('vehicle', 'event', 'club', 'profile', 'photo')),
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_actor ON activity_feed(actor_id);
CREATE INDEX idx_activity_feed_public ON activity_feed(is_public, created_at DESC);

-- RLS for activity feed
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public activity viewable" ON activity_feed FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create own activity" ON activity_feed FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- Update last_active trigger
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET last_active_at = NOW(), is_online = true WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark users offline (call via cron every 5 min)
CREATE OR REPLACE FUNCTION mark_inactive_users_offline()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE profiles
  SET is_online = false
  WHERE is_online = true
    AND last_active_at < NOW() - INTERVAL '5 minutes';
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_actor_id UUID,
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO activity_feed (actor_id, action, target_type, target_id, metadata)
  VALUES (p_actor_id, p_action, p_target_type, p_target_id, p_metadata)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-log when a new vehicle is created
CREATE OR REPLACE FUNCTION on_vehicle_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_activity(
    NEW.owner_id,
    'added_vehicle',
    'vehicle',
    NEW.id,
    jsonb_build_object('year', NEW.year, 'make', NEW.make, 'model', NEW.model, 'color', NEW.color)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_vehicle_created
  AFTER INSERT ON vehicles
  FOR EACH ROW EXECUTE FUNCTION on_vehicle_created();

-- Auto-log when a vehicle image is added
CREATE OR REPLACE FUNCTION on_vehicle_image_added()
RETURNS TRIGGER AS $$
DECLARE
  v_owner UUID;
  v_info RECORD;
BEGIN
  SELECT owner_id, year, make, model INTO v_info FROM vehicles WHERE id = NEW.vehicle_id;
  PERFORM log_activity(
    v_info.owner_id,
    'added_photo',
    'vehicle',
    NEW.vehicle_id,
    jsonb_build_object('image_url', NEW.image_url, 'year', v_info.year, 'make', v_info.make, 'model', v_info.model)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_vehicle_image_added
  AFTER INSERT ON vehicle_images
  FOR EACH ROW EXECUTE FUNCTION on_vehicle_image_added();

-- Auto-log when someone follows a user
CREATE OR REPLACE FUNCTION on_follow_created()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
  following_name TEXT;
BEGIN
  SELECT username INTO follower_name FROM profiles WHERE id = NEW.follower_id;
  SELECT username INTO following_name FROM profiles WHERE id = NEW.following_id;
  PERFORM log_activity(
    NEW.follower_id,
    'followed_user',
    'profile',
    NEW.following_id,
    jsonb_build_object('following_username', following_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_follow_created
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION on_follow_created();

-- Auto-log when member added to club
CREATE OR REPLACE FUNCTION on_club_member_added()
RETURNS TRIGGER AS $$
DECLARE
  club_name TEXT;
  member_name TEXT;
BEGIN
  SELECT name INTO club_name FROM clubs WHERE id = NEW.club_id;
  SELECT username INTO member_name FROM profiles WHERE id = NEW.user_id;
  PERFORM log_activity(
    COALESCE(NEW.added_by, NEW.user_id),
    'club_added_member',
    'club',
    NEW.club_id,
    jsonb_build_object('club_name', club_name, 'member_username', member_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_club_member_added
  AFTER INSERT ON club_members
  FOR EACH ROW EXECUTE FUNCTION on_club_member_added();

-- Auto-log when event is created
CREATE OR REPLACE FUNCTION on_event_created()
RETURNS TRIGGER AS $$
DECLARE
  club_name TEXT;
BEGIN
  IF NEW.club_id IS NOT NULL THEN
    SELECT name INTO club_name FROM clubs WHERE id = NEW.club_id;
  END IF;
  PERFORM log_activity(
    NEW.organizer_id,
    CASE WHEN NEW.flyer_url IS NOT NULL THEN 'posted_flyer' ELSE 'created_event' END,
    'event',
    NEW.id,
    jsonb_build_object('title', NEW.title, 'city', NEW.city, 'state', NEW.state, 'club_name', COALESCE(club_name, ''))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_event_created
  AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION on_event_created();

-- Update handle_new_user to include first_name
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url, first_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-log when new user signs up (profile created)
CREATE OR REPLACE FUNCTION on_profile_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (actor_id, action, target_type, target_id, metadata)
  VALUES (
    NEW.id,
    'joined',
    'profile',
    NEW.id,
    jsonb_build_object('username', NEW.username, 'display_name', COALESCE(NEW.display_name, ''), 'location', COALESCE(NEW.location, ''))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION on_profile_created();
