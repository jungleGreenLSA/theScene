-- ============================================
-- SHOPS
-- Performance shops, detail shops, fab shops, etc. that members can
-- browse and tag on their vehicles.
-- Safe to re-run.
-- ============================================

CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  website TEXT,
  instagram_handle TEXT,
  phone TEXT,
  specialties TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill columns that might be missing if the table was created by
-- a partial earlier run of this migration.
ALTER TABLE shops ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS logo_url TEXT;

CREATE INDEX IF NOT EXISTS idx_shops_name ON shops USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_shops_state_lat ON shops(state, lat, lng);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shops viewable by all" ON shops;
CREATE POLICY "Shops viewable by all" ON shops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can create shops" ON shops;
CREATE POLICY "Authenticated can create shops" ON shops FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Creator can update own shop" ON shops;
CREATE POLICY "Creator can update own shop" ON shops FOR UPDATE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creator can delete own shop" ON shops;
CREATE POLICY "Creator can delete own shop" ON shops FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- VEHICLE ↔ SHOP TAGS
-- ============================================

CREATE TABLE IF NOT EXISTS vehicle_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, shop_id)
);

ALTER TABLE vehicle_shops ADD COLUMN IF NOT EXISTS note TEXT;

CREATE INDEX IF NOT EXISTS idx_vehicle_shops_vehicle ON vehicle_shops(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_shops_shop ON vehicle_shops(shop_id);

ALTER TABLE vehicle_shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vehicle-shop tags viewable" ON vehicle_shops;
CREATE POLICY "Vehicle-shop tags viewable" ON vehicle_shops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vehicle owner can tag shops" ON vehicle_shops;
CREATE POLICY "Vehicle owner can tag shops" ON vehicle_shops FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Vehicle owner can untag shops" ON vehicle_shops;
CREATE POLICY "Vehicle owner can untag shops" ON vehicle_shops FOR DELETE
  USING (EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND owner_id = auth.uid()));
