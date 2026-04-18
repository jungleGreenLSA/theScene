-- ============================================
-- CLUB CREATOR CAN MANAGE LOCATIONS
-- The original club_locations policy required the user to be an
-- admin/founder via club_members — but on first club creation, that
-- row hasn't been inserted yet, so the very first chapter insert
-- fails with an RLS error. Replace with a policy that also allows
-- the user listed as clubs.created_by.
-- Safe to re-run.
-- ============================================

DROP POLICY IF EXISTS "Club admins can manage locations" ON club_locations;

CREATE POLICY "Club admins can manage locations"
  ON club_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_locations.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'founder')
    )
    OR EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_locations.club_id
        AND clubs.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_locations.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'founder')
    )
    OR EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_locations.club_id
        AND clubs.created_by = auth.uid()
    )
  );
