-- ============================================
-- CLUB MEMBERSHIP: JOIN REQUESTS + APPROVALS
-- Lets users request to join a club (status=pending) and lets
-- admins/founders approve (→ active) or reject.
-- Safe to re-run.
-- ============================================

ALTER TABLE club_members ADD COLUMN IF NOT EXISTS status TEXT
  DEFAULT 'active'
  CHECK (status IN ('active', 'pending', 'rejected'));

UPDATE club_members SET status = 'active' WHERE status IS NULL;

-- Replace the old INSERT policy so users can create their own pending request.
DROP POLICY IF EXISTS "Club admins can add members" ON club_members;
DROP POLICY IF EXISTS "Admins add or users request" ON club_members;
CREATE POLICY "Admins add or users request"
  ON club_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'founder')
    )
    OR EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_members.club_id
        AND clubs.created_by = auth.uid()
    )
    OR (
      auth.uid() = user_id
      AND status = 'pending'
      AND role = 'member'
    )
  );

DROP POLICY IF EXISTS "Admins update members" ON club_members;
CREATE POLICY "Admins update members"
  ON club_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'founder')
    )
  );

DROP POLICY IF EXISTS "Users cancel own pending request" ON club_members;
CREATE POLICY "Users cancel own pending request"
  ON club_members FOR DELETE
  USING (
    auth.uid() = user_id AND status = 'pending'
  );
