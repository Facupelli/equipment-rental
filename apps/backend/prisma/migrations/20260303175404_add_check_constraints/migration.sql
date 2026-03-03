-- This is an empty migration.-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS btree_gist;


-- ---------------------------------------------------------------------------
-- ASSET ASSIGNMENT — overlap constraint
-- ---------------------------------------------------------------------------


ALTER TABLE asset_assignments
  ADD CONSTRAINT no_asset_overlap
  EXCLUDE USING gist (asset_id WITH =, period WITH &&);


-- ---------------------------------------------------------------------------
-- ORDER ITEM — type consistency check
-- Ensures PRODUCT items always have product_type_id
-- and BUNDLE items always have bundle_id, never both
-- ---------------------------------------------------------------------------

ALTER TABLE order_items
  ADD CONSTRAINT order_item_type_consistency CHECK (
    (type = 'PRODUCT' AND product_type_id IS NOT NULL AND bundle_id IS NULL)
    OR
    (type = 'BUNDLE'  AND bundle_id IS NOT NULL AND product_type_id IS NULL)
  );


-- ---------------------------------------------------------------------------
-- ASSET ASSIGNMENT — type/source consistency check
-- OWNED/EXTERNAL source only makes sense on ORDER type assignments
-- BLACKOUT and MAINTENANCE never have a source
-- ---------------------------------------------------------------------------

ALTER TABLE asset_assignments
  ADD CONSTRAINT assignment_type_source_consistency CHECK (
    (type = 'ORDER'       AND source IS NOT NULL)
    OR
    (type = 'BLACKOUT'    AND source IS NULL)
    OR
    (type = 'MAINTENANCE' AND source IS NULL)
  );


-- ---------------------------------------------------------------------------
-- ASSET ASSIGNMENT — order linkage consistency check
-- ORDER type must have both order_id and order_item_id
-- BLACKOUT and MAINTENANCE must have neither
-- ---------------------------------------------------------------------------

ALTER TABLE asset_assignments
  ADD CONSTRAINT assignment_type_order_consistency CHECK (
    (type = 'ORDER'       AND order_id IS NOT NULL AND order_item_id IS NOT NULL)
    OR
    (type = 'BLACKOUT'    AND order_id IS NULL AND order_item_id IS NULL)
    OR
    (type = 'MAINTENANCE' AND order_id IS NULL AND order_item_id IS NULL)
  );


-- ---------------------------------------------------------------------------
-- PRICING TIER — ownership consistency check
-- A tier must belong to either a product type or a bundle, never both
-- ---------------------------------------------------------------------------

ALTER TABLE pricing_tiers
  ADD CONSTRAINT pricing_tier_owner_consistency CHECK (
    (product_type_id IS NOT NULL AND bundle_id IS NULL)
    OR
    (bundle_id IS NOT NULL AND product_type_id IS NULL)
  );


  -- Full text search on product name (only add if you implement text search)
CREATE INDEX idx_product_types_name_fts
  ON product_types USING gin (to_tsvector('spanish', name));
