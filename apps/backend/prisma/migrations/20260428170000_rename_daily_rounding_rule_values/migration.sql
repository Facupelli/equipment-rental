UPDATE "tenants"
SET "config" = jsonb_set(
  "config",
  '{pricing,roundingRule}',
  CASE
    WHEN "config"->'pricing'->>'roundingRule' = 'IGNORE_PARTIAL_UNIT' THEN '"IGNORE_PARTIAL_DAY"'::jsonb
    WHEN "config"->'pricing'->>'roundingRule' = 'BILL_PARTIAL_AS_FULL_UNIT' THEN '"BILL_ANY_PARTIAL_DAY"'::jsonb
    ELSE "config"->'pricing'->'roundingRule'
  END,
  true
)
WHERE "config"->'pricing'->>'roundingRule' IN ('IGNORE_PARTIAL_UNIT', 'BILL_PARTIAL_AS_FULL_UNIT');
