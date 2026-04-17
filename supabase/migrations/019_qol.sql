-- ============================================
-- QUALITY-OF-LIFE SCHEMA BITS
-- Onboarding state, profile cover photo, sighting-claim permissions.
-- ============================================

-- Profile cover photo (mirrors clubs.cover_image_url for users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Onboarding completion marker — null means "hasn't finished the wizard yet"
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Let a logged-in user claim a sighting with a vehicle they own.
-- The USING clause lets anyone attempt; the WITH CHECK constrains the
-- final row so claimed_vehicle_id must be a vehicle auth.uid() owns.
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
