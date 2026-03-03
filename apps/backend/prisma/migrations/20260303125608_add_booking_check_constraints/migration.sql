-- GiST index for fast overlap queries on bookings directly
CREATE INDEX bookings_booking_range_gist
ON bookings USING GIST (booking_range);

-- -----------------------------------------------------------------------------
-- 2. Exclusion constraint — no two bookings for the same inventory_item_id
--    with overlapping booking_range.
--
--    WHERE clause restricts to SERIALIZED bookings only (BULK bookings have
--    inventory_item_id = NULL and are excluded from this constraint).
--
--    Requires btree_gist extension for combining equality (=) and range (&&)
--    operators in the same exclusion constraint.
-- -----------------------------------------------------------------------------
ALTER TABLE bookings
ADD CONSTRAINT bookings_no_double_booking
EXCLUDE USING GIST (
  inventory_item_id WITH =,
  booking_range     WITH &&
) WHERE (inventory_item_id IS NOT NULL);
