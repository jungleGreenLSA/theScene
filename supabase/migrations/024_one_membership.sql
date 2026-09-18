-- ============================================
-- THE SCENE - Migration 024
-- One membership. Removes the premium tier,
-- the Stripe fields, and the "Premium" badge.
--
-- The app no longer reads any of these columns, so
-- this is cleanup rather than a requirement — but
-- run it so the schema matches what the site does.
-- ============================================

BEGIN;

-- Helper from 003 — nothing calls it anymore.
DROP FUNCTION IF EXISTS is_premium(UUID);

-- Indexes from 003
DROP INDEX IF EXISTS idx_profiles_tier;
DROP INDEX IF EXISTS idx_profiles_stripe;

-- Tier + billing columns from 003
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_expires_at;

-- "Upgraded to Premium" badge from 009
DELETE FROM user_badges WHERE badge_id IN (SELECT id FROM badges WHERE slug = 'premium_member');
DELETE FROM badges WHERE slug = 'premium_member';

COMMIT;
