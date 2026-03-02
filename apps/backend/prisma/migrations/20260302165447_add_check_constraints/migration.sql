CREATE EXTENSION IF NOT EXISTS btree_gist;

-- -----------------------------------------------------------------------------
-- 1. ORDERS 
-- -----------------------------------------------------------------------------

CREATE INDEX idx_orders_booking_range_gist
  ON orders USING GIST (booking_range);

-- Tenant-scoped composite — used in every availability query
CREATE INDEX idx_orders_tenant_booking_range_gist
  ON orders USING GIST (tenant_id, booking_range);


-- -----------------------------------------------------------------------------
-- 2. BLACKOUT_PERIODS — blocked_period (tstzrange)
-- -----------------------------------------------------------------------------

CREATE INDEX idx_blackout_periods_blocked_period_gist
  ON blackout_periods USING GIST (blocked_period);

CREATE INDEX idx_blackout_periods_tenant_item_gist
  ON blackout_periods USING GIST (tenant_id, inventory_item_id, blocked_period);


-- -----------------------------------------------------------------------------
-- 3. PRODUCTS — STI check constraints
-- -----------------------------------------------------------------------------

-- BULK must have total_stock. SERIALIZED must not.
ALTER TABLE products
  ADD CONSTRAINT chk_products_bulk_stock CHECK (
    (tracking_type = 'BULK'       AND total_stock IS NOT NULL) OR
    (tracking_type = 'SERIALIZED' AND total_stock IS NULL)
  );

-- BULK must have location_id. SERIALIZED must not (location lives on inventory_item).
ALTER TABLE products
  ADD CONSTRAINT chk_products_bulk_location CHECK (
    (tracking_type = 'BULK'       AND location_id IS NOT NULL) OR
    (tracking_type = 'SERIALIZED' AND location_id IS NULL)
  );


-- -----------------------------------------------------------------------------
-- 4. BOOKINGS — tracking type mutual exclusivity
-- -----------------------------------------------------------------------------

ALTER TABLE bookings
  ADD CONSTRAINT chk_bookings_tracking_type CHECK (
    (inventory_item_id IS NOT NULL AND quantity IS NULL) OR
    (inventory_item_id IS NULL     AND quantity IS NOT NULL)
  );


-- -----------------------------------------------------------------------------
-- 5. PRICING_TIERS — scope mutual exclusivity
--    Scoped to a product OR an inventory item. Never both, never neither.
-- -----------------------------------------------------------------------------

ALTER TABLE pricing_tiers
  ADD CONSTRAINT chk_pricing_tiers_scope CHECK (
    (product_id IS NOT NULL AND inventory_item_id IS NULL) OR
    (product_id IS NULL     AND inventory_item_id IS NOT NULL)
  );


-- -----------------------------------------------------------------------------
-- 6. BLACKOUT_PERIODS — quantity sanity
-- -----------------------------------------------------------------------------

ALTER TABLE blackout_periods
  ADD CONSTRAINT chk_blackout_periods_quantity CHECK (
    blocked_quantity >= 1
  );
