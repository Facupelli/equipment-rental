UPDATE "tenants"
SET "config" = jsonb_set(
  "config",
  '{pricing,roundingRule}',
  '"IGNORE_PARTIAL_UNIT"'::jsonb,
  true
)
WHERE "config"->'pricing'->>'roundingRule' IN ('ROUND_UP', 'SPLIT')
   OR "config"->'pricing'->>'roundingRule' IS NULL;
