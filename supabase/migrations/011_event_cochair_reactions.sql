-- ============================================
-- THE SCENE - Migration 011
-- Event co-chairs + feed reactions
-- ============================================

-- Event co-chairs
CREATE TABLE event_cochairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_cochairs_event ON event_cochairs(event_id);
ALTER TABLE event_cochairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cochairs viewable" ON event_cochairs FOR SELECT USING (true);
CREATE POLICY "Organizers can add cochairs" ON event_cochairs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = auth.uid())
  OR EXISTS (SELECT 1 FROM event_cochairs ec WHERE ec.event_id = event_cochairs.event_id AND ec.user_id = auth.uid())
);
CREATE POLICY "Organizers can remove cochairs" ON event_cochairs FOR DELETE USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = auth.uid())
);

-- Feed reactions (hearts, etc on activity feed items)
CREATE TABLE feed_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT DEFAULT 'heart' CHECK (reaction IN ('heart', 'fire', 'props', 'trophy')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

CREATE INDEX idx_feed_reactions_activity ON feed_reactions(activity_id);
ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions viewable" ON feed_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react" ON feed_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unreact" ON feed_reactions FOR DELETE USING (auth.uid() = user_id);

-- Update event_rsvps to support status types
ALTER TABLE event_rsvps DROP CONSTRAINT IF EXISTS event_rsvps_status_check;
ALTER TABLE event_rsvps ADD CONSTRAINT event_rsvps_status_check CHECK (status IN ('interested', 'going', 'maybe', 'not_going', 'checked_in'));
