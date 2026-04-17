-- ============================================
-- USERNAME COOLDOWN
-- Tracks when a user last changed their username so the UI can
-- enforce a 60-day cooldown between changes.
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;
