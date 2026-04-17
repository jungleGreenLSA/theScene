-- ============================================
-- SHOPS
-- Performance shops, detail shops, fab shops, etc. that members can
-- browse and tag on their vehicles.
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

CREATE INDEX IF NOT EXISTS idx_shops_name ON shops USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_shops_state_lat ON shops(state, lat, lng);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops viewable by all" ON shops FOR SELECT USING (true);
CREATE POLICY "Authenticated can create shops" ON shops FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);
CREATE POLICY "Creator can update own shop" ON shops FOR UPDATE
  USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete own shop" ON shops FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- VEHICLE ↔ SHOP TAGS
-- A member can tag shops their build has worked with.
-- ============================================

CREATE TABLE IF NOT EXISTS vehicle_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_shops_vehicle ON vehicle_shops(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_shops_shop ON vehicle_shops(shop_id);

ALTER TABLE vehicle_shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle-shop tags viewable" ON vehicle_shops FOR SELECT USING (true);
CREATE POLICY "Vehicle owner can tag shops" ON vehicle_shops FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND owner_id = auth.uid()));
CREATE POLICY "Vehicle owner can untag shops" ON vehicle_shops FOR DELETE
  USING (EXISTS (SELECT 1 FROM vehicles WHERE id = vehicle_id AND owner_id = auth.uid()));
