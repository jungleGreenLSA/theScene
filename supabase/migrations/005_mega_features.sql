-- ============================================
-- THE SCENE - Migration 005
-- Mega feature drop: Spot a Ride, Check-Ins,
-- What Would You Do, Build Cost Tracker,
-- Dyno Sheets, Sound Clips, Crew Runs,
-- Challenges, QR Codes, Leaderboards
-- ============================================

-- ============================================
-- SPOT A RIDE
-- "Your car was spotted at Starbucks on Elm St!"
-- ============================================
CREATE TABLE sightings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spotter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  location_name TEXT,
  city TEXT,
  state TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  description TEXT,
  claimed_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  props_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sightings_location ON sightings(city, state);
CREATE INDEX idx_sightings_claimed ON sightings(claimed_vehicle_id);
CREATE INDEX idx_sightings_created ON sightings(created_at DESC);

ALTER TABLE sightings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sightings viewable" ON sightings FOR SELECT USING (true);
CREATE POLICY "Authenticated can post sightings" ON sightings FOR INSERT WITH CHECK (auth.uid() = spotter_id);
CREATE POLICY "Spotters can delete own" ON sightings FOR DELETE USING (auth.uid() = spotter_id);

-- ============================================
-- LOCATION CHECK-INS
-- "Parked at Cars & Coffee, McKinney TX"
-- ============================================
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  note TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkins_user ON checkins(user_id);
CREATE INDEX idx_checkins_location ON checkins(city, state);
CREATE INDEX idx_checkins_created ON checkins(created_at DESC);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Checkins viewable" ON checkins FOR SELECT USING (true);
CREATE POLICY "Users can checkin" ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- WHAT WOULD YOU DO (Community Voting)
-- ============================================
CREATE TABLE wwyd_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  budget TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wwyd_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES wwyd_posts(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE wwyd_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES wwyd_posts(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES wwyd_options(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, voter_id)
);

ALTER TABLE wwyd_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wwyd_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE wwyd_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "WWYD posts viewable" ON wwyd_posts FOR SELECT USING (true);
CREATE POLICY "Users can create WWYD" ON wwyd_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "WWYD options viewable" ON wwyd_options FOR SELECT USING (true);
CREATE POLICY "WWYD votes viewable" ON wwyd_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON wwyd_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ============================================
-- BUILD COST TRACKER (Premium feature)
-- ============================================
CREATE TABLE build_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  mod_id UUID REFERENCES vehicle_modifications(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  vendor TEXT,
  date_purchased DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE build_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Build costs viewable on public vehicles" ON build_costs FOR SELECT USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.is_public = true)
);
CREATE POLICY "Owners can manage costs" ON build_costs FOR ALL USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.owner_id = auth.uid())
);

-- ============================================
-- DYNO SHEETS
-- ============================================
CREATE TABLE dyno_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  whp DECIMAL(8,2),
  wtq DECIMAL(8,2),
  tuner TEXT,
  fuel_type TEXT,
  boost_level TEXT,
  notes TEXT,
  props_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dyno_vehicle ON dyno_sheets(vehicle_id);
CREATE INDEX idx_dyno_whp ON dyno_sheets(whp DESC);

ALTER TABLE dyno_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dyno sheets viewable" ON dyno_sheets FOR SELECT USING (true);
CREATE POLICY "Owners can manage dyno sheets" ON dyno_sheets FOR ALL USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.owner_id = auth.uid())
);

-- ============================================
-- SOUND CLIPS
-- ============================================
CREATE TABLE sound_clips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  exhaust_setup TEXT,
  props_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sound_clips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sound clips viewable" ON sound_clips FOR SELECT USING (true);
CREATE POLICY "Owners can manage clips" ON sound_clips FOR ALL USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.owner_id = auth.uid())
);

-- ============================================
-- CREW RUNS / GROUP DRIVES
-- ============================================
CREATE TABLE crew_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  run_date TIMESTAMPTZ NOT NULL,
  start_location TEXT NOT NULL,
  start_city TEXT,
  start_state TEXT,
  end_location TEXT,
  end_city TEXT,
  end_state TEXT,
  estimated_distance TEXT,
  estimated_duration TEXT,
  route_notes TEXT,
  cover_image_url TEXT,
  max_participants INTEGER,
  rsvp_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crew_run_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES crew_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'going' CHECK (status IN ('interested', 'going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(run_id, user_id)
);

ALTER TABLE crew_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_run_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Crew runs viewable" ON crew_runs FOR SELECT USING (true);
CREATE POLICY "Users can create runs" ON crew_runs FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update runs" ON crew_runs FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "RSVPs viewable" ON crew_run_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can RSVP" ON crew_run_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel RSVP" ON crew_run_rsvps FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SEASONAL CHALLENGES
-- ============================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE challenge_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES challenge_entries(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entry_id, voter_id)
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges viewable" ON challenges FOR SELECT USING (true);
CREATE POLICY "Challenge entries viewable" ON challenge_entries FOR SELECT USING (true);
CREATE POLICY "Users can enter challenges" ON challenge_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Challenge votes viewable" ON challenge_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote in challenges" ON challenge_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ============================================
-- GARAGE TOURS (multi-photo walkaround)
-- ============================================
CREATE TABLE garage_tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Garage Tour',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE garage_tour_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id UUID NOT NULL REFERENCES garage_tours(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  section TEXT CHECK (section IN ('front', 'rear', 'driver_side', 'passenger_side', 'interior', 'engine_bay', 'trunk', 'underside', 'wheels', 'detail', 'other')),
  caption TEXT,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE garage_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE garage_tour_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tours viewable" ON garage_tours FOR SELECT USING (true);
CREATE POLICY "Owners can manage tours" ON garage_tours FOR ALL USING (
  EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = vehicle_id AND vehicles.owner_id = auth.uid())
);
CREATE POLICY "Tour photos viewable" ON garage_tour_photos FOR SELECT USING (true);
CREATE POLICY "Owners can manage tour photos" ON garage_tour_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM garage_tours gt JOIN vehicles v ON v.id = gt.vehicle_id WHERE gt.id = tour_id AND v.owner_id = auth.uid())
);

-- ============================================
-- EVENT ATTENDANCE LEADERBOARD function
-- ============================================
CREATE OR REPLACE FUNCTION get_event_leaderboard(p_year INTEGER DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  location TEXT,
  event_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    er.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.location,
    COUNT(er.id) as event_count
  FROM event_rsvps er
  JOIN profiles p ON p.id = er.user_id
  WHERE er.status IN ('going', 'checked_in')
    AND (p_year IS NULL OR EXTRACT(YEAR FROM er.created_at) = p_year)
  GROUP BY er.user_id, p.username, p.display_name, p.avatar_url, p.location
  ORDER BY event_count DESC
  LIMIT 25;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Add audio bucket support
-- ============================================
-- Note: Create an 'audio' storage bucket in Supabase dashboard
-- with 10MB limit and audio/mpeg, audio/mp4, audio/wav MIME types

-- ============================================
-- Update activity feed action types
-- ============================================
ALTER TABLE activity_feed DROP CONSTRAINT IF EXISTS activity_feed_action_check;
ALTER TABLE activity_feed ADD CONSTRAINT activity_feed_action_check CHECK (action IN (
  'joined', 'added_photo', 'updated_vehicle', 'added_vehicle',
  'created_event', 'club_added_member', 'posted_car_show',
  'updated_profile', 'followed_user', 'posted_flyer',
  'spotted_ride', 'checked_in', 'posted_wwyd', 'posted_dyno',
  'posted_sound_clip', 'created_crew_run', 'entered_challenge',
  'posted_garage_tour'
));
