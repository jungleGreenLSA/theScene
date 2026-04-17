-- ============================================
-- QUALITY-OF-LIFE SCHEMA BITS
-- Onboarding state, profile cover photo, sighting-claim permissions.
-- Safe to re-run.
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "Vehicle owners can claim sightings" ON sightings;
CREATE POLICY "Vehicle owners can claim sightings"
  ON sightings FOR UPDATE
  USING (true)
  WITH CHECK (
    claimed_vehicle_id IS NULL
    OR EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = sightings.claimed_vehicle_id
        AND vehicles.owner_id = auth.uid()
    )
  );
