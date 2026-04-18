-- ============================================
-- FEED POSTS
-- User-authored timeline posts — photo + caption + hashtags + love
-- reactions. Separate from system-generated activity_feed rows so the
-- two can coexist in the UI without conflating concepts.
-- Safe to re-run.
-- ============================================

CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  love_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS love_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_hashtags ON feed_posts USING gin(hashtags);

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed posts viewable" ON feed_posts;
CREATE POLICY "Feed posts viewable" ON feed_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can post" ON feed_posts;
CREATE POLICY "Authenticated can post" ON feed_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete own posts" ON feed_posts;
CREATE POLICY "Authors can delete own posts" ON feed_posts FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================
-- LOVE REACTIONS
-- One row per (post, user). Composite PK doubles as the
-- uniqueness guarantee.
-- ============================================

CREATE TABLE IF NOT EXISTS feed_post_loves (
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE feed_post_loves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Loves viewable" ON feed_post_loves;
CREATE POLICY "Loves viewable" ON feed_post_loves FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can love" ON feed_post_loves;
CREATE POLICY "Authenticated can love" ON feed_post_loves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlove own" ON feed_post_loves;
CREATE POLICY "Users can unlove own" ON feed_post_loves FOR DELETE
  USING (auth.uid() = user_id);

-- Sync feed_posts.love_count on insert/delete.
CREATE OR REPLACE FUNCTION sync_feed_love_count() RETURNS TRIGGER AS $$
DECLARE
  target_post UUID;
BEGIN
  target_post := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE feed_posts
  SET love_count = (SELECT COUNT(*) FROM feed_post_loves WHERE post_id = target_post)
  WHERE id = target_post;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feed_love_count ON feed_post_loves;
CREATE TRIGGER trg_feed_love_count
  AFTER INSERT OR DELETE ON feed_post_loves
  FOR EACH ROW EXECUTE FUNCTION sync_feed_love_count();
