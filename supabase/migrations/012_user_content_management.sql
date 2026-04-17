-- ============================================
-- USER CONTENT MANAGEMENT
-- Lets users delete their own guestbook entries and WWYD votes
-- from the /activity page.
-- Safe to re-run.
-- ============================================

DROP POLICY IF EXISTS "Authors can delete own guestbook entries" ON guestbook_entries;
CREATE POLICY "Authors can delete own guestbook entries"
  ON guestbook_entries FOR DELETE
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Voters can delete own WWYD votes" ON wwyd_votes;
CREATE POLICY "Voters can delete own WWYD votes"
  ON wwyd_votes FOR DELETE
  USING (auth.uid() = voter_id);
