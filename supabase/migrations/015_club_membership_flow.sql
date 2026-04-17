-- ============================================
-- CLUB MEMBERSHIP: JOIN REQUESTS + APPROVALS
-- Lets users request to join a club (status=pending) and lets
-- admins/founders approve (→ active) or reject.
-- ============================================

ALTER TABLE club_members ADD COLUMN IF NOT EXISTS status TEXT
  DEFAULT 'active'
  CHECK (status IN ('active', 'pending', 'rejected'));

-- Backfill any rows missing a status
UPDATE club_members SET status = 'active' WHERE status IS NULL;

-- Replace the old INSERT policy so users can create their own pending request.
DROP POLICY IF EXISTS "Club admins can add members" ON club_members;

CREATE POLICY "Admins add or users request"
  ON club_members FOR INSERT
  WITH CHECK (
    -- Admins/founders/club creator can add anyone
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
      -- Users can create their own pending join request
      auth.uid() = user_id
      AND status = 'pending'
      AND role = 'member'
    )
  );

-- Admins/founders can update member status (approve/reject, change roles)
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

-- Users can cancel their own pending request (delete own pending row)
CREATE POLICY "Users cancel own pending request"
  ON club_members FOR DELETE
  USING (
    auth.uid() = user_id AND status = 'pending'
  );
