ALTER TABLE booking_line_items
ADD CONSTRAINT chk_line_item_reference
CHECK (
    (inventory_item_id IS NOT NULL AND product_id IS NULL) OR 
    (inventory_item_id IS NULL AND product_id IS NOT NULL)
);


CREATE INDEX idx_bookings_rental_period ON bookings USING GIST (rental_period);
CREATE INDEX idx_blackout_periods_blocked_period ON blackout_periods USING GIST (blocked_period);
