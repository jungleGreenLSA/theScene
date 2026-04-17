-- ============================================
-- THE SCENE - Migration 009
-- Rizz Features: Badges, Trending, Nearby,
-- Build Compatibility, Digest, Matched
-- ============================================

-- ============================================
-- ACHIEVEMENT BADGES
-- ============================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT CHECK (category IN ('social', 'garage', 'events', 'community', 'premium', 'milestone')),
  requirement_type TEXT,
  requirement_value INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges viewable" ON badges FOR SELECT USING (true);
CREATE POLICY "User badges viewable" ON user_badges FOR SELECT USING (true);
CREATE POLICY "System can grant badges" ON user_badges FOR INSERT WITH CHECK (true);

-- Seed default badges
INSERT INTO badges (slug, name, description, icon, category, requirement_type, requirement_value) VALUES
  ('first_garage', 'First Garage', 'Created your first garage', '🏠', 'garage', 'vehicles_count', 1),
  ('photo_starter', 'Shutterbug', 'Uploaded your first photo', '📸', 'garage', 'photos_count', 1),
  ('props_10', 'Getting Props', 'Received 10 props on your builds', '🤙', 'social', 'props_received', 10),
  ('props_50', 'Prop Star', 'Received 50 props on your builds', '⭐', 'social', 'props_received', 50),
  ('props_100', 'Prop Legend', 'Received 100 props on your builds', '👑', 'social', 'props_received', 100),
  ('first_follow', 'Connected', 'Followed your first member', '🤝', 'social', 'following_count', 1),
  ('followers_10', 'Rising Star', 'Gained 10 followers', '📈', 'social', 'followers_count', 10),
  ('followers_50', 'Scene Famous', 'Gained 50 followers', '🌟', 'social', 'followers_count', 50),
  ('event_first', 'Show Goer', 'Attended your first event', '📅', 'events', 'events_attended', 1),
  ('event_5', 'Event Regular', 'Attended 5 events', '🏆', 'events', 'events_attended', 5),
  ('event_10', 'Event Veteran', 'Attended 10 events', '🎖️', 'events', 'events_attended', 10),
  ('guestbook_first', 'Guest Star', 'Received your first guestbook entry', '📖', 'community', 'guestbook_received', 1),
  ('club_member', 'Club Life', 'Joined a car club', '🏁', 'community', 'clubs_joined', 1),
  ('journal_started', 'Chronicler', 'Started a build journal', '📓', 'garage', 'journal_entries', 1),
  ('spotter', 'Eagle Eye', 'Spotted a ride in the wild', '👁️', 'community', 'sightings_posted', 1),
  ('ride_of_week', 'Ride of the Week', 'Your build was featured as Ride of the Week', '🏆', 'milestone', 'featured_count', 1),
  ('early_adopter', 'Early Adopter', 'Joined The Scene in the first month', '🚀', 'milestone', 'early_adopter', 1),
  ('premium_member', 'Premium', 'Upgraded to Premium', '💎', 'premium', 'is_premium', 1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- TRENDING BUILDS (materialized view approach)
-- ============================================
CREATE OR REPLACE FUNCTION get_trending_builds(p_days INTEGER DEFAULT 7, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  vehicle_id UUID,
  year INTEGER,
  make TEXT,
  model TEXT,
  color TEXT,
  primary_image_url TEXT,
  build_status TEXT,
  slug TEXT,
  owner_username TEXT,
  owner_display_name TEXT,
  owner_avatar_url TEXT,
  props_count INTEGER,
  view_count INTEGER,
  recent_props BIGINT,
  recent_views BIGINT,
  trending_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id as vehicle_id,
    v.year, v.make, v.model, v.color,
    v.primary_image_url, v.build_status, v.slug,
    p.username as owner_username,
    p.display_name as owner_display_name,
    p.avatar_url as owner_avatar_url,
    v.props_count, v.view_count,
    COALESCE(rp.cnt, 0) as recent_props,
    COALESCE(rv.cnt, 0) as recent_views,
    (COALESCE(rp.cnt, 0) * 3 + COALESCE(rv.cnt, 0)) as trending_score
  FROM vehicles v
  JOIN profiles p ON p.id = v.owner_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as cnt FROM props
    WHERE target_type = 'vehicle' AND target_id = v.id
    AND created_at >= NOW() - (p_days || ' days')::interval
  ) rp ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as cnt FROM garage_views
    WHERE vehicle_id = v.id
    AND created_at >= NOW() - (p_days || ' days')::interval
  ) rv ON true
  WHERE v.is_public = true
  ORDER BY trending_score DESC, v.props_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NEARBY MEMBERS function
-- ============================================
CREATE OR REPLACE FUNCTION get_nearby_members(p_location TEXT, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  location TEXT,
  is_online BOOLEAN,
  vehicle_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.location,
    p.is_online,
    (SELECT COUNT(*) FROM vehicles WHERE owner_id = p.id AND is_public = true) as vehicle_count
  FROM profiles p
  WHERE p.is_public = true
    AND p.location IS NOT NULL
    AND p.location ILIKE '%' || p_location || '%'
  ORDER BY p.is_online DESC, p.last_active_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BUILD COMPATIBILITY function
-- ============================================
CREATE OR REPLACE FUNCTION get_build_matches(p_vehicle_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  matched_vehicle_id UUID,
  matched_username TEXT,
  matched_display_name TEXT,
  matched_avatar_url TEXT,
  matched_year INTEGER,
  matched_make TEXT,
  matched_model TEXT,
  matched_slug TEXT,
  matched_primary_image TEXT,
  common_mods BIGINT,
  common_mod_items TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  WITH my_mods AS (
    SELECT item, brand, category FROM vehicle_modifications WHERE vehicle_id = p_vehicle_id
  ),
  other_vehicles AS (
    SELECT v.id, v.owner_id, v.year, v.make, v.model, v.slug, v.primary_image_url
    FROM vehicles v
    WHERE v.id != p_vehicle_id AND v.is_public = true
  )
  SELECT
    ov.id as matched_vehicle_id,
    p.username as matched_username,
    p.display_name as matched_display_name,
    p.avatar_url as matched_avatar_url,
    ov.year as matched_year,
    ov.make as matched_make,
    ov.model as matched_model,
    ov.slug as matched_slug,
    ov.primary_image_url as matched_primary_image,
    COUNT(DISTINCT vm.item) as common_mods,
    ARRAY_AGG(DISTINCT vm.item ORDER BY vm.item) FILTER (WHERE vm.item IS NOT NULL) as common_mod_items
  FROM other_vehicles ov
  JOIN profiles p ON p.id = ov.owner_id
  JOIN vehicle_modifications vm ON vm.vehicle_id = ov.id
  WHERE EXISTS (
    SELECT 1 FROM my_mods mm
    WHERE (mm.item ILIKE vm.item OR mm.brand ILIKE vm.brand)
    AND mm.item IS NOT NULL
  )
  GROUP BY ov.id, p.username, p.display_name, p.avatar_url, ov.year, ov.make, ov.model, ov.slug, ov.primary_image_url
  HAVING COUNT(DISTINCT vm.item) >= 2
  ORDER BY common_mods DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WEEKLY DIGEST stats function
-- ============================================
CREATE OR REPLACE FUNCTION get_weekly_digest(p_user_id UUID)
RETURNS TABLE (
  garage_views_week BIGINT,
  props_received_week BIGINT,
  guestbook_entries_week BIGINT,
  new_followers_week BIGINT,
  total_props INTEGER,
  total_views INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM garage_views gv
     JOIN vehicles v ON v.id = gv.vehicle_id
     WHERE v.owner_id = p_user_id
     AND gv.created_at >= NOW() - INTERVAL '7 days') as garage_views_week,
    (SELECT COUNT(*) FROM props pr
     JOIN vehicles v ON v.id = pr.target_id
     WHERE pr.target_type = 'vehicle'
     AND v.owner_id = p_user_id
     AND pr.created_at >= NOW() - INTERVAL '7 days') as props_received_week,
    (SELECT COUNT(*) FROM guestbook_entries ge
     JOIN vehicles v ON v.id = ge.vehicle_id
     WHERE v.owner_id = p_user_id
     AND ge.created_at >= NOW() - INTERVAL '7 days') as guestbook_entries_week,
    (SELECT COUNT(*) FROM follows f
     WHERE f.following_id = p_user_id
     AND f.created_at >= NOW() - INTERVAL '7 days') as new_followers_week,
    COALESCE((SELECT SUM(v.props_count) FROM vehicles v WHERE v.owner_id = p_user_id), 0)::INTEGER as total_props,
    COALESCE((SELECT SUM(v.view_count) FROM vehicles v WHERE v.owner_id = p_user_id), 0)::INTEGER as total_views;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
