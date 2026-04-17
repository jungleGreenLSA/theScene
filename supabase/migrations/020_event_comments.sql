-- ============================================
-- EVENT COMMENTS
-- Threaded-free comment stream on car show pages.
-- ============================================

CREATE TABLE IF NOT EXISTS event_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_comments_event ON event_comments(event_id, created_at DESC);

ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event comments viewable" ON event_comments FOR SELECT USING (NOT is_hidden);
CREATE POLICY "Authenticated can post event comments" ON event_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own event comments" ON event_comments FOR DELETE
  USING (auth.uid() = author_id);
CREATE POLICY "Event organizer can delete any comment" ON event_comments FOR DELETE
  USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_comments.event_id AND events.organizer_id = auth.uid()));
