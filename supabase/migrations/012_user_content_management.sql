-- ============================================
-- USER CONTENT MANAGEMENT
-- Lets users delete their own guestbook entries and WWYD votes
-- from the /activity page.
-- ============================================

CREATE POLICY "Authors can delete own guestbook entries"
  ON guestbook_entries FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Voters can delete own WWYD votes"
  ON wwyd_votes FOR DELETE
  USING (auth.uid() = voter_id);
