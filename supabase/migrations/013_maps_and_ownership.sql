-- ============================================
-- MAPS + OWNERSHIP DELETE POLICIES
-- Adds lat/lng for geocoded heatmaps and lets owners delete
-- their events, clubs, and WWYD posts from the UI.
--
-- Safe to re-run: all CREATE POLICY statements are preceded by
-- DROP POLICY IF EXISTS so running this twice no longer errors out
-- with "policy ... already exists".
-- ============================================

-- Geocoded coordinates for heatmap plotting
ALTER TABLE events ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE events ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE events ADD COLUMN IF NOT EXISTS zip_code TEXT;

ALTER TABLE club_locations ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE club_locations ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE club_locations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE club_locations ADD COLUMN IF NOT EXISTS zip_code TEXT;

ALTER TABLE sightings ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE sightings ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_events_state_lat ON events(state, lat, lng);
CREATE INDEX IF NOT EXISTS idx_club_locations_state ON club_locations(state, lat, lng);

-- DELETE policies — let owners remove their own content
DROP POLICY IF EXISTS "Organizers can delete own events" ON events;
CREATE POLICY "Organizers can delete own events"
  ON events FOR DELETE
  USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Founders can delete own clubs" ON clubs;
CREATE POLICY "Founders can delete own clubs"
  ON clubs FOR DELETE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authors can delete own WWYD posts" ON wwyd_posts;
CREATE POLICY "Authors can delete own WWYD posts"
  ON wwyd_posts FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- RSVP COUNT SYNC
-- Keeps events.rsvp_count in sync so the listing page
-- shows the correct "N interested" number.
-- ============================================
CREATE OR REPLACE FUNCTION sync_event_rsvp_count() RETURNS TRIGGER AS $$
DECLARE
  target_event UUID;
BEGIN
  target_event := COALESCE(NEW.event_id, OLD.event_id);
  UPDATE events
  SET rsvp_count = (
    SELECT COUNT(*) FROM event_rsvps
    WHERE event_id = target_event
      AND status IN ('going', 'maybe', 'checked_in')
  )
  WHERE id = target_event;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_rsvp_count ON event_rsvps;
CREATE TRIGGER trg_event_rsvp_count
  AFTER INSERT OR UPDATE OR DELETE ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION sync_event_rsvp_count();

-- Backfill existing rsvp_count values
UPDATE events e SET rsvp_count = (
  SELECT COUNT(*) FROM event_rsvps r
  WHERE r.event_id = e.id AND r.status IN ('going', 'maybe', 'checked_in')
);
