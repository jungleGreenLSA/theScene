-- 024_social_links.sql
-- Add TikTok / Twitch / personal website URL fields to profiles, and a
-- DB-side sanitize step that scrubs creator-aggregator links
-- (beacons / linktree / bio.link / about.me / lnk.bio) so the platform
-- stays focused on enthusiast sharing rather than paid link-in-bio
-- funnels.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS twitch_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT;

CREATE OR REPLACE FUNCTION sanitize_social_url(url TEXT) RETURNS TEXT AS $$
DECLARE
  trimmed TEXT;
BEGIN
  IF url IS NULL THEN RETURN NULL; END IF;
  trimmed := trim(url);
  IF trimmed = '' THEN RETURN NULL; END IF;

  -- Strip creator-aggregator domains regardless of scheme or path
  IF lower(trimmed) ~ '(^|[./@])(beacons\.ai|linktr\.ee|linktree\.com|bio\.link|lnk\.bio|about\.me|snipfeed\.co|allmylinks\.com|carrd\.co|komi\.io|stan\.store|koji\.to)([/?#]|$)' THEN
    RETURN NULL;
  END IF;

  -- Force a scheme so client-side rendering can safely link to it
  IF trimmed !~* '^https?://' THEN
    trimmed := 'https://' || trimmed;
  END IF;

  RETURN trimmed;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION profiles_sanitize_social_urls()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tiktok_url = sanitize_social_url(NEW.tiktok_url);
  NEW.twitch_url = sanitize_social_url(NEW.twitch_url);
  NEW.website_url = sanitize_social_url(NEW.website_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_sanitize_social ON profiles;
CREATE TRIGGER trg_profiles_sanitize_social
BEFORE INSERT OR UPDATE OF tiktok_url, twitch_url, website_url ON profiles
FOR EACH ROW
EXECUTE FUNCTION profiles_sanitize_social_urls();

-- Backfill: run sanitize over any existing values so the aggregator
-- block applies to rows that pre-date the trigger (tiktok/twitch/website
-- are all new columns today, so this is a no-op — included for safety
-- if the migration is re-run after data exists).
UPDATE profiles
SET
  tiktok_url = sanitize_social_url(tiktok_url),
  twitch_url = sanitize_social_url(twitch_url),
  website_url = sanitize_social_url(website_url)
WHERE tiktok_url IS NOT NULL OR twitch_url IS NOT NULL OR website_url IS NOT NULL;
