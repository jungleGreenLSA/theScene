-- ============================================
-- NEARBY FILTERS
-- Per-user toggles that scope the main listing pages to the user's
-- home state. All default off so behavior doesn't change for existing
-- users until they opt in.
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS filter_clubs_nearby BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS filter_events_nearby BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS filter_people_nearby BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS filter_marketplace_nearby BOOLEAN DEFAULT FALSE;
