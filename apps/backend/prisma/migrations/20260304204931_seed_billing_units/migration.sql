INSERT INTO billing_units (id, label, duration_minutes, sort_order)
VALUES
  (gen_random_uuid(), 'Hour', 60,    30),
  (gen_random_uuid(), 'Day',  1440,  20),
  (gen_random_uuid(), 'Week', 10080, 10)
ON CONFLICT (label) DO NOTHING;
