-- 025_forums.sql
-- Forums feature: two-level taxonomy (category → sub-forum), threads with
-- pin/lock flags, posts with edit history, per-profile signature and
-- post count. Public read; signed-in write; admin moderation.

-- ============================================================
-- CATEGORIES — top-level grouping (Community, Tech & Builds, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "forum_categories_read" ON forum_categories;
CREATE POLICY "forum_categories_read" ON forum_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "forum_categories_admin_write" ON forum_categories;
CREATE POLICY "forum_categories_admin_write" ON forum_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'));

-- ============================================================
-- SUB-FORUMS — leaf boards that hold threads
-- ============================================================

CREATE TABLE IF NOT EXISTS sub_forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  position INT NOT NULL DEFAULT 0,
  is_admin_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_forums_category ON sub_forums(category_id, position);

ALTER TABLE sub_forums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sub_forums_read" ON sub_forums;
CREATE POLICY "sub_forums_read" ON sub_forums FOR SELECT USING (true);
DROP POLICY IF EXISTS "sub_forums_admin_write" ON sub_forums;
CREATE POLICY "sub_forums_admin_write" ON sub_forums FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'));

-- ============================================================
-- THREADS
-- ============================================================

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_forum_id UUID NOT NULL REFERENCES sub_forums(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 4 AND 140),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  reply_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  last_post_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_post_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sub_forum_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_threads_sub_forum_last_post ON forum_threads(sub_forum_id, is_pinned DESC, last_post_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_author ON forum_threads(author_id);

ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "forum_threads_read" ON forum_threads;
CREATE POLICY "forum_threads_read" ON forum_threads FOR SELECT
  USING (is_hidden = false OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'));
DROP POLICY IF EXISTS "forum_threads_insert" ON forum_threads;
CREATE POLICY "forum_threads_insert" ON forum_threads FOR INSERT
  WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "forum_threads_update_own" ON forum_threads;
CREATE POLICY "forum_threads_update_own" ON forum_threads FOR UPDATE
  USING (auth.uid() = author_id AND is_locked = false)
  WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "forum_threads_admin_all" ON forum_threads;
CREATE POLICY "forum_threads_admin_all" ON forum_threads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'));

-- ============================================================
-- POSTS
-- ============================================================

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 20000),
  quote_of_id UUID REFERENCES forum_posts(id) ON DELETE SET NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_thread_created ON forum_posts(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_author ON forum_posts(author_id);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "forum_posts_read" ON forum_posts;
CREATE POLICY "forum_posts_read" ON forum_posts FOR SELECT
  USING (is_hidden = false OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'));
DROP POLICY IF EXISTS "forum_posts_insert" ON forum_posts;
CREATE POLICY "forum_posts_insert" ON forum_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM forum_threads t
      WHERE t.id = thread_id
        AND t.is_hidden = false
        AND (t.is_locked = false OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'))
    )
  );
DROP POLICY IF EXISTS "forum_posts_update_own" ON forum_posts;
CREATE POLICY "forum_posts_update_own" ON forum_posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "forum_posts_admin_all" ON forum_posts;
CREATE POLICY "forum_posts_admin_all" ON forum_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND username = 'squizzle'));

-- ============================================================
-- PROFILE ADDITIONS — signature + denormalized post count + rank
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS forum_signature TEXT,
  ADD COLUMN IF NOT EXISTS forum_post_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forum_rank TEXT NOT NULL DEFAULT 'Member';

-- Rank by post count — returns a label. Pure function, safe to call
-- from a trigger or a view.
CREATE OR REPLACE FUNCTION forum_rank_for_count(n INT) RETURNS TEXT AS $$
BEGIN
  IF n >= 1000 THEN RETURN 'Veteran';
  ELSIF n >= 250 THEN RETURN 'Regular';
  ELSIF n >= 50 THEN RETURN 'Enthusiast';
  ELSIF n >= 10 THEN RETURN 'Contributor';
  ELSE RETURN 'Member';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- TRIGGERS — maintain denormalized counters
-- ============================================================

-- When a post is inserted: bump thread.reply_count, touch last_post_*,
-- increment author's forum_post_count + recompute rank. The thread's
-- opening post is the FIRST post inserted, so reply_count for that
-- thread stays at 0 until the second post arrives.
CREATE OR REPLACE FUNCTION forum_post_after_insert()
RETURNS TRIGGER AS $$
DECLARE
  is_opening_post BOOLEAN;
  new_count INT;
BEGIN
  -- Detect if this is the thread's opening post (no prior posts)
  SELECT NOT EXISTS (
    SELECT 1 FROM forum_posts
    WHERE thread_id = NEW.thread_id AND id <> NEW.id
  ) INTO is_opening_post;

  -- Update the thread row
  UPDATE forum_threads
  SET
    reply_count = reply_count + CASE WHEN is_opening_post THEN 0 ELSE 1 END,
    last_post_at = NEW.created_at,
    last_post_by = NEW.author_id
  WHERE id = NEW.thread_id;

  -- Bump author's post count + recompute rank
  UPDATE profiles
  SET forum_post_count = forum_post_count + 1
  WHERE id = NEW.author_id
  RETURNING forum_post_count INTO new_count;

  IF new_count IS NOT NULL THEN
    UPDATE profiles SET forum_rank = forum_rank_for_count(new_count) WHERE id = NEW.author_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_forum_post_after_insert ON forum_posts;
CREATE TRIGGER trg_forum_post_after_insert
AFTER INSERT ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION forum_post_after_insert();

-- When a post is deleted, decrement the thread's reply_count (but not
-- below zero) and the author's post count. Last-post pointer falls
-- back to the newest remaining post in the thread.
CREATE OR REPLACE FUNCTION forum_post_after_delete()
RETURNS TRIGGER AS $$
DECLARE
  latest_row forum_posts%ROWTYPE;
BEGIN
  UPDATE forum_threads
  SET reply_count = GREATEST(0, reply_count - 1)
  WHERE id = OLD.thread_id;

  SELECT * INTO latest_row
  FROM forum_posts
  WHERE thread_id = OLD.thread_id AND is_hidden = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF latest_row.id IS NOT NULL THEN
    UPDATE forum_threads
    SET last_post_at = latest_row.created_at, last_post_by = latest_row.author_id
    WHERE id = OLD.thread_id;
  END IF;

  UPDATE profiles
  SET forum_post_count = GREATEST(0, forum_post_count - 1)
  WHERE id = OLD.author_id;
  UPDATE profiles
  SET forum_rank = forum_rank_for_count(forum_post_count)
  WHERE id = OLD.author_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_forum_post_after_delete ON forum_posts;
CREATE TRIGGER trg_forum_post_after_delete
AFTER DELETE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION forum_post_after_delete();

-- Keep updated_at fresh on edits
CREATE OR REPLACE FUNCTION forum_post_before_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forum_post_before_update ON forum_posts;
CREATE TRIGGER trg_forum_post_before_update
BEFORE UPDATE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION forum_post_before_update();

-- ============================================================
-- VIEW-COUNT RPC — bumps forum_threads.view_count atomically
-- ============================================================

CREATE OR REPLACE FUNCTION increment_thread_view(p_thread_id UUID)
RETURNS VOID AS $$
  UPDATE forum_threads SET view_count = view_count + 1 WHERE id = p_thread_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================
-- SEEDS — 3 categories, 8 sub-forums that match the prototype
-- ============================================================

INSERT INTO forum_categories (slug, title, description, position) VALUES
  ('community', 'Community', 'Introductions, announcements, and general talk', 1),
  ('tech', 'Tech & Builds', 'Wrenching, tuning, and troubleshooting', 2),
  ('lifestyle', 'Shows, Meets & Marketplace', 'Where we meet up and what we buy', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO sub_forums (category_id, slug, title, description, position, is_admin_only)
SELECT c.id, s.slug, s.title, s.description, s.position, s.admin_only
FROM (VALUES
  ('community', 'announcements',   'Announcements & News',        'Site news, feature drops, and scheduled maintenance. Pinned threads from the team.', 1, true),
  ('community', 'introductions',   'New Member Introductions',    'First post? Say hi here. Tell us what you drive and where you roll from.', 2, false),
  ('community', 'off-topic',       'Off-Topic Lounge',            'Not about cars? Post it here. No politics, no beef, no beacons links.', 3, false),
  ('tech',      'tech-talk',       'Tech Talk',                   'Engine work, forced induction, suspension geometry, electrical — ask here before you break it.', 1, false),
  ('tech',      'detailing',       'Detailing & Paint',           'Ceramic, PPF, wet sanding, and the eternal quick-detailer debate.', 2, false),
  ('tech',      'diy-writeups',    'DIY Writeups',                'Step-by-step guides the community has written. Archive-grade threads live here.', 3, false),
  ('lifestyle', 'events',          'Shows & Events Chatter',      'Recap threads, photo dumps, and "who else is going" coordination.', 1, false),
  ('lifestyle', 'wtb-wts',         'WTB / WTS Discussion',        'Asking and negotiating. Actual listings live in /marketplace.', 2, false)
) AS s(cat_slug, slug, title, description, position, admin_only)
JOIN forum_categories c ON c.slug = s.cat_slug
ON CONFLICT (slug) DO NOTHING;
