-- ============================================
-- THE SCENE - Migration 006
-- Premium features: Analytics, Build Journal,
-- Collections, Video support, Custom themes
-- ============================================

-- ============================================
-- GARAGE ANALYTICS (who viewed your garage)
-- ============================================
CREATE TABLE garage_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'direct' CHECK (source IN ('explore', 'direct', 'qr_code', 'shared_link', 'search', 'similar_builds', 'feed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_garage_views_vehicle ON garage_views(vehicle_id, created_at DESC);
CREATE INDEX idx_garage_views_viewer ON garage_views(viewer_id);

ALTER TABLE garage_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vehicle owners can view their analytics" ON garage_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.owner_id = auth.uid())
);
CREATE POLICY "System can insert views" ON garage_views FOR INSERT WITH CHECK (true);

-- ============================================
-- BUILD JOURNAL (chronological build progress)
-- ============================================
CREATE TABLE build_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  before_image_url TEXT,
  after_image_url TEXT,
  milestone_type TEXT CHECK (milestone_type IN ('mod_install', 'maintenance', 'milestone', 'purchase', 'event', 'photo_shoot', 'dyno', 'other')),
  cost DECIMAL(10, 2),
  journal_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_build_journal_vehicle ON build_journal(vehicle_id, journal_date DESC);

ALTER TABLE build_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Journal entries viewable on public vehicles" ON build_journal FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.is_public = true)
);
CREATE POLICY "Owners can manage journal" ON build_journal FOR ALL USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.owner_id = auth.uid())
);

-- ============================================
-- COLLECTIONS / WISHLISTS (save builds you like)
-- ============================================
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Saved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('vehicle', 'event', 'post', 'photo', 'mod')),
  target_id UUID NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, target_type, target_id)
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own collections" ON collections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own collection items" ON collection_items FOR ALL USING (
  EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_id AND collections.user_id = auth.uid())
);

-- ============================================
-- CUSTOM GARAGE THEMES (premium personalization)
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS garage_theme TEXT DEFAULT 'default' CHECK (garage_theme IN ('default', 'midnight', 'carbon', 'neon_green', 'neon_blue', 'neon_red', 'gold', 'stealth'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS garage_accent_color TEXT DEFAULT '#7c3aed';

-- ============================================
-- VIDEO SUPPORT on vehicles
-- ============================================
CREATE TABLE vehicle_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  duration_seconds INTEGER,
  video_type TEXT CHECK (video_type IN ('pull', 'launch', 'walkaround', 'exhaust', 'dyno', 'track', 'other')),
  props_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vehicle_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Videos viewable on public vehicles" ON vehicle_videos FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.is_public = true)
);
CREATE POLICY "Owners can manage videos" ON vehicle_videos FOR ALL USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.owner_id = auth.uid())
);

-- ============================================
-- MOD PRICE COMPARISON aggregate function
-- ============================================
CREATE OR REPLACE FUNCTION get_mod_price_comparison(p_item_search TEXT)
RETURNS TABLE (
  item TEXT,
  brand TEXT,
  avg_cost DECIMAL(10,2),
  min_cost DECIMAL(10,2),
  max_cost DECIMAL(10,2),
  install_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.item,
    bc.brand,
    ROUND(AVG(bc.cost), 2) as avg_cost,
    MIN(bc.cost) as min_cost,
    MAX(bc.cost) as max_cost,
    COUNT(*) as install_count
  FROM build_costs bc
  WHERE bc.item ILIKE '%' || p_item_search || '%'
    OR bc.brand ILIKE '%' || p_item_search || '%'
  GROUP BY bc.item, bc.brand
  ORDER BY install_count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GARAGE ANALYTICS aggregation function
-- ============================================
CREATE OR REPLACE FUNCTION get_garage_analytics(p_vehicle_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_views BIGINT,
  unique_viewers BIGINT,
  views_from_explore BIGINT,
  views_from_search BIGINT,
  views_from_direct BIGINT,
  views_from_qr BIGINT,
  views_from_feed BIGINT,
  daily_views JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_views,
    COUNT(DISTINCT gv.viewer_id) as unique_viewers,
    COUNT(*) FILTER (WHERE gv.source = 'explore') as views_from_explore,
    COUNT(*) FILTER (WHERE gv.source = 'search') as views_from_search,
    COUNT(*) FILTER (WHERE gv.source = 'direct') as views_from_direct,
    COUNT(*) FILTER (WHERE gv.source = 'qr_code') as views_from_qr,
    COUNT(*) FILTER (WHERE gv.source = 'feed') as views_from_feed,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('date', d.day::date, 'count', COALESCE(dv.cnt, 0))
        ORDER BY d.day
      ),
      '[]'::jsonb
    ) as daily_views
  FROM garage_views gv
  CROSS JOIN LATERAL (
    SELECT generate_series(
      (NOW() - (p_days || ' days')::interval)::date,
      CURRENT_DATE,
      '1 day'::interval
    ) as day
  ) d
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as cnt
    FROM garage_views gv2
    WHERE gv2.vehicle_id = p_vehicle_id
      AND gv2.created_at::date = d.day::date
  ) dv ON true
  WHERE gv.vehicle_id = p_vehicle_id
    AND gv.created_at >= NOW() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Build sheet export function
-- Returns all vehicle data as JSON
-- ============================================
CREATE OR REPLACE FUNCTION get_build_sheet(p_vehicle_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'vehicle', row_to_json(v),
    'owner', jsonb_build_object('username', p.username, 'display_name', p.display_name, 'location', p.location),
    'modifications', COALESCE((
      SELECT jsonb_agg(row_to_json(m) ORDER BY m.category, m.sort_order)
      FROM vehicle_modifications m WHERE m.vehicle_id = v.id
    ), '[]'::jsonb),
    'images', COALESCE((
      SELECT jsonb_agg(row_to_json(i) ORDER BY i.sort_order)
      FROM vehicle_images i WHERE i.vehicle_id = v.id
    ), '[]'::jsonb),
    'build_costs', COALESCE((
      SELECT jsonb_agg(row_to_json(bc) ORDER BY bc.created_at)
      FROM build_costs bc WHERE bc.vehicle_id = v.id
    ), '[]'::jsonb),
    'total_build_cost', COALESCE((
      SELECT SUM(bc.cost) FROM build_costs bc WHERE bc.vehicle_id = v.id
    ), 0),
    'dyno_sheets', COALESCE((
      SELECT jsonb_agg(row_to_json(ds) ORDER BY ds.created_at DESC)
      FROM dyno_sheets ds WHERE ds.vehicle_id = v.id
    ), '[]'::jsonb),
    'journal', COALESCE((
      SELECT jsonb_agg(row_to_json(bj) ORDER BY bj.journal_date DESC)
      FROM build_journal bj WHERE bj.vehicle_id = v.id
    ), '[]'::jsonb)
  ) INTO result
  FROM vehicles v
  JOIN profiles p ON p.id = v.owner_id
  WHERE v.id = p_vehicle_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Create video storage bucket note
-- Create a 'videos' bucket in Supabase dashboard
-- Public: ON, Size limit: 50MB
-- MIME types: video/mp4, video/quicktime, video/webm
-- ============================================
