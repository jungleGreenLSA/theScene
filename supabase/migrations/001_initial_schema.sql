-- ============================================
-- THE SCENE - Initial Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- Linked to Supabase auth.users automatically
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  instagram_handle TEXT,
  youtube_handle TEXT,
  tiktok_handle TEXT,
  facebook_url TEXT,
  is_public BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'organizer', 'moderator', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VEHICLES
-- One user can have multiple vehicles (future)
-- One is marked as primary
-- ============================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  slug TEXT NOT NULL,
  year INTEGER,
  make TEXT,
  model TEXT,
  trim TEXT,
  generation TEXT,
  color TEXT,
  mileage TEXT,
  drivetrain TEXT,
  transmission TEXT,
  engine TEXT,
  horsepower TEXT,
  build_status TEXT DEFAULT 'stock' CHECK (build_status IN ('stock', 'lightly_modified', 'modified', 'full_build', 'race_car', 'project')),
  club_affiliation TEXT,
  bio TEXT,
  primary_image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  props_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, slug)
);

-- ============================================
-- VEHICLE MODIFICATIONS
-- Structured mod entries by category
-- ============================================
CREATE TABLE vehicle_modifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('engine', 'exhaust', 'forced_induction', 'suspension', 'brakes', 'wheels_tires', 'exterior', 'interior', 'audio_electronics', 'tuning', 'other')),
  item TEXT NOT NULL,
  brand TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VEHICLE IMAGES
-- Gallery images for each vehicle
-- ============================================
CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POSTS (Feed / Timeline)
-- ============================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  content TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  props_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POST IMAGES
-- ============================================
CREATE TABLE post_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMENTS (on posts)
-- ============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GUESTBOOK (on vehicle pages)
-- ============================================
CREATE TABLE guestbook_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROPS (reactions - like "likes" but car culture)
-- Can prop vehicles, posts, or events
-- ============================================
CREATE TABLE props (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('vehicle', 'post', 'event')),
  target_id UUID NOT NULL,
  reaction TEXT DEFAULT 'props' CHECK (reaction IN ('props', 'fire', 'wrench', 'trophy', 'checkered_flag')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- ============================================
-- FOLLOWS
-- ============================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_name TEXT,
  location_address TEXT,
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),
  map_url TEXT,
  admission_info TEXT,
  categories TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'active', 'completed', 'archived', 'cancelled')),
  rsvp_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENT RSVPS
-- ============================================
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'going', 'checked_in')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- EVENT IMAGES (post-event gallery)
-- ============================================
CREATE TABLE event_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENT COMMENTS
-- ============================================
CREATE TABLE event_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEATURED RIDE (Ride of the Day)
-- ============================================
CREATE TABLE featured_rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  feature_date DATE UNIQUE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REPORTS (moderation)
-- ============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'post', 'comment', 'event', 'guestbook')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- BLOCKS
-- ============================================
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'props', 'comment', 'guestbook', 'event_rsvp', 'mention', 'featured')),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_type TEXT,
  target_id UUID,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_slug ON vehicles(slug);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_guestbook_vehicle ON guestbook_entries(vehicle_id);
CREATE INDEX idx_props_target ON props(target_type, target_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_featured_date ON featured_rides(feature_date DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE props ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- VEHICLES
CREATE POLICY "Public vehicles viewable" ON vehicles FOR SELECT USING (is_public = true);
CREATE POLICY "Owners can view own vehicles" ON vehicles FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update vehicles" ON vehicles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete vehicles" ON vehicles FOR DELETE USING (auth.uid() = owner_id);

-- VEHICLE MODIFICATIONS
CREATE POLICY "Public mods viewable" ON vehicle_modifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.is_public = true)
);
CREATE POLICY "Owners can manage mods" ON vehicle_modifications FOR ALL USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.owner_id = auth.uid())
);

-- VEHICLE IMAGES
CREATE POLICY "Public images viewable" ON vehicle_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.is_public = true)
);
CREATE POLICY "Owners can manage images" ON vehicle_images FOR ALL USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.owner_id = auth.uid())
);

-- POSTS
CREATE POLICY "Public posts viewable" ON posts FOR SELECT USING (visibility = 'public');
CREATE POLICY "Authors can view own posts" ON posts FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Authors can insert posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- POST IMAGES
CREATE POLICY "Post images viewable with post" ON post_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND (posts.visibility = 'public' OR posts.author_id = auth.uid()))
);
CREATE POLICY "Authors can manage post images" ON post_images FOR ALL USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.author_id = auth.uid())
);

-- COMMENTS
CREATE POLICY "Comments viewable on public posts" ON comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.visibility = 'public')
);
CREATE POLICY "Authenticated can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- GUESTBOOK
CREATE POLICY "Guestbook viewable" ON guestbook_entries FOR SELECT USING (is_hidden = false);
CREATE POLICY "Authenticated can sign guestbook" ON guestbook_entries FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Vehicle owners can hide entries" ON guestbook_entries FOR UPDATE USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.owner_id = auth.uid())
);

-- PROPS
CREATE POLICY "Props viewable" ON props FOR SELECT USING (true);
CREATE POLICY "Authenticated can prop" ON props FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own props" ON props FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWS
CREATE POLICY "Follows viewable" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- EVENTS
CREATE POLICY "Published events viewable" ON events FOR SELECT USING (status IN ('published', 'active', 'completed'));
CREATE POLICY "Organizers can view own events" ON events FOR SELECT USING (auth.uid() = organizer_id);
CREATE POLICY "Authenticated can create events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update own events" ON events FOR UPDATE USING (auth.uid() = organizer_id);

-- EVENT RSVPS
CREATE POLICY "RSVPs viewable" ON event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can RSVP" ON event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update RSVP" ON event_rsvps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove RSVP" ON event_rsvps FOR DELETE USING (auth.uid() = user_id);

-- EVENT IMAGES
CREATE POLICY "Event images viewable" ON event_images FOR SELECT USING (true);
CREATE POLICY "Authenticated can upload event images" ON event_images FOR INSERT WITH CHECK (auth.uid() = uploader_id);

-- EVENT COMMENTS
CREATE POLICY "Event comments viewable" ON event_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can comment on events" ON event_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- FEATURED RIDES
CREATE POLICY "Featured rides viewable" ON featured_rides FOR SELECT USING (true);

-- REPORTS
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- BLOCKS
CREATE POLICY "Users can manage blocks" ON blocks FOR ALL USING (auth.uid() = blocker_id);

-- NOTIFICATIONS
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- AUDIT LOGS (read only for admins via service role, not through client)
CREATE POLICY "No client read on audit logs" ON audit_logs FOR SELECT USING (false);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment/decrement props count on vehicles
CREATE OR REPLACE FUNCTION handle_vehicle_props()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'vehicle' THEN
    UPDATE vehicles SET props_count = props_count + 1 WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'vehicle' THEN
    UPDATE vehicles SET props_count = props_count - 1 WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vehicle_prop
  AFTER INSERT OR DELETE ON props
  FOR EACH ROW EXECUTE FUNCTION handle_vehicle_props();

-- Increment view count (called from app)
CREATE OR REPLACE FUNCTION increment_vehicle_views(vehicle_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE vehicles SET view_count = view_count + 1 WHERE id = vehicle_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get featured ride of the day
CREATE OR REPLACE FUNCTION get_featured_ride()
RETURNS TABLE (
  vehicle_id UUID,
  feature_date DATE,
  reason TEXT,
  vehicle_json JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fr.vehicle_id,
    fr.feature_date,
    fr.reason,
    jsonb_build_object(
      'id', v.id,
      'year', v.year,
      'make', v.make,
      'model', v.model,
      'color', v.color,
      'primary_image_url', v.primary_image_url,
      'props_count', v.props_count,
      'view_count', v.view_count,
      'build_status', v.build_status,
      'owner', jsonb_build_object(
        'username', p.username,
        'display_name', p.display_name,
        'avatar_url', p.avatar_url
      )
    ) as vehicle_json
  FROM featured_rides fr
  JOIN vehicles v ON v.id = fr.vehicle_id
  JOIN profiles p ON p.id = v.owner_id
  WHERE fr.feature_date <= CURRENT_DATE
  ORDER BY fr.feature_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DONE
-- ============================================
