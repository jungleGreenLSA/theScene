-- Add last_name to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
