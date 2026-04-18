-- ============================================
-- WWYD: let users update their vote, trigger-maintained vote_count
-- ============================================
-- Prior state: client-side UPDATE on wwyd_options was blocked by RLS
-- (no UPDATE policy existed). Votes looked like they disappeared.
-- Now: DB trigger keeps vote_count accurate from wwyd_votes.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION update_wwyd_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE wwyd_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE wwyd_options SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.option_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_wwyd_vote_count ON wwyd_votes;
CREATE TRIGGER trg_wwyd_vote_count
  AFTER INSERT OR DELETE ON wwyd_votes
  FOR EACH ROW EXECUTE FUNCTION update_wwyd_vote_count();

-- Backfill any existing vote counts
UPDATE wwyd_options o
  SET vote_count = (SELECT COUNT(*) FROM wwyd_votes v WHERE v.option_id = o.id);

-- ============================================
-- NOTIFICATIONS: extend type whitelist
-- ============================================
-- Existing check constraint only allows a narrow list — we need
-- 'club_join_request', 'club_approved', 'club_rejected' added.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'follow', 'props', 'comment', 'guestbook', 'event_rsvp', 'mention', 'featured',
    'club_join_request', 'club_approved', 'club_rejected'
  ));

-- ============================================
-- NOTIFICATIONS: auto-notify club founder/admins on join request
-- ============================================
CREATE OR REPLACE FUNCTION notify_club_join_request()
RETURNS TRIGGER AS $$
DECLARE
  club_name TEXT;
  requester_name TEXT;
  admin_row RECORD;
BEGIN
  IF NEW.status != 'pending' THEN RETURN NEW; END IF;

  SELECT name INTO club_name FROM clubs WHERE id = NEW.club_id;
  SELECT COALESCE(display_name, username) INTO requester_name FROM profiles WHERE id = NEW.user_id;

  -- Notify the club creator + any admins/founders (excluding the requester themselves)
  FOR admin_row IN
    SELECT DISTINCT user_id FROM (
      SELECT created_by AS user_id FROM clubs WHERE id = NEW.club_id
      UNION
      SELECT user_id FROM club_members WHERE club_id = NEW.club_id AND role IN ('admin', 'founder') AND status = 'active'
    ) t
    WHERE user_id IS NOT NULL AND user_id != NEW.user_id
  LOOP
    INSERT INTO notifications (user_id, type, actor_id, target_type, target_id, message)
    VALUES (
      admin_row.user_id,
      'club_join_request',
      NEW.user_id,
      'club',
      NEW.club_id,
      requester_name || ' requested to join ' || club_name
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_club_join_request ON club_members;
CREATE TRIGGER trg_notify_club_join_request
  AFTER INSERT ON club_members
  FOR EACH ROW EXECUTE FUNCTION notify_club_join_request();

-- ============================================
-- NOTIFICATIONS: notify requester when approved/rejected
-- ============================================
CREATE OR REPLACE FUNCTION notify_club_request_decision()
RETURNS TRIGGER AS $$
DECLARE
  club_name TEXT;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'active' THEN
    SELECT name INTO club_name FROM clubs WHERE id = NEW.club_id;
    INSERT INTO notifications (user_id, type, actor_id, target_type, target_id, message)
    VALUES (NEW.user_id, 'club_approved', NEW.added_by, 'club', NEW.club_id,
      'You were approved to join ' || club_name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_club_approval ON club_members;
CREATE TRIGGER trg_notify_club_approval
  AFTER UPDATE OF status ON club_members
  FOR EACH ROW EXECUTE FUNCTION notify_club_request_decision();

-- ============================================
-- NOTIFICATIONS: guestbook signed
-- ============================================
CREATE OR REPLACE FUNCTION notify_guestbook_signed()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  signer_name TEXT;
BEGIN
  SELECT v.owner_id INTO v_owner_id FROM vehicles v WHERE v.id = NEW.vehicle_id;
  IF v_owner_id IS NULL OR v_owner_id = NEW.author_id THEN RETURN NEW; END IF;

  SELECT COALESCE(display_name, username) INTO signer_name FROM profiles WHERE id = NEW.author_id;
  INSERT INTO notifications (user_id, type, actor_id, target_type, target_id, message)
  VALUES (v_owner_id, 'guestbook', NEW.author_id, 'vehicle', NEW.vehicle_id,
    signer_name || ' signed your guestbook');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_guestbook ON guestbook_entries;
CREATE TRIGGER trg_notify_guestbook
  AFTER INSERT ON guestbook_entries
  FOR EACH ROW EXECUTE FUNCTION notify_guestbook_signed();
