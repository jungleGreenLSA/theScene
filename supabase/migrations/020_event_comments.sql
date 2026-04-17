-- ============================================
-- EVENT COMMENTS
-- Threaded-free comment stream on car show pages.
-- Safe to re-run.
-- ============================================

CREATE TABLE IF NOT EXISTS event_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist on re-runs where the table was created by an
-- earlier partial run without every column.
ALTER TABLE event_comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE event_comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_event_comments_event ON event_comments(event_id, created_at DESC);

ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event comments viewable" ON event_comments;
CREATE POLICY "Event comments viewable" ON event_comments FOR SELECT USING (NOT is_hidden);

DROP POLICY IF EXISTS "Authenticated can post event comments" ON event_comments;
CREATE POLICY "Authenticated can post event comments" ON event_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete own event comments" ON event_comments;
CREATE POLICY "Authors can delete own event comments" ON event_comments FOR DELETE
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Event organizer can delete any comment" ON event_comments;
CREATE POLICY "Event organizer can delete any comment" ON event_comments FOR DELETE
  USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_comments.event_id AND events.organizer_id = auth.uid()));
