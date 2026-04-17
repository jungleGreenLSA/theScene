-- ============================================
-- SIGHTINGS: PROPS + INSTAGRAM HANDLE
-- Lets people give props on car shows and sightings, and lets the
-- spotter attach the IG handle they noticed on the car (via a sticker,
-- plate frame, etc.) so owners on IG can be found.
-- ============================================

-- Expand props.target_type to include 'sighting'. Drop the old CHECK and
-- replace with the full set of allowed targets.
ALTER TABLE props DROP CONSTRAINT IF EXISTS props_target_type_check;
ALTER TABLE props ADD CONSTRAINT props_target_type_check
  CHECK (target_type IN ('vehicle', 'post', 'event', 'event_photo', 'sighting'));

-- IG handle spotted on the car (no auth, just a string)
ALTER TABLE sightings ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
