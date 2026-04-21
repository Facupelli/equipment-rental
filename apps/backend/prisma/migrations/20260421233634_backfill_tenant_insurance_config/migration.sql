UPDATE "tenants"
SET "config" = jsonb_set(
  jsonb_set(
    "config"::jsonb,
    '{pricing,insuranceEnabled}',
    'false'::jsonb,
    true
  ),
  '{pricing,insuranceRatePercent}',
  '0'::jsonb,
  true
)
WHERE
  ("config"::jsonb #> '{pricing,insuranceEnabled}') IS NULL
  OR ("config"::jsonb #> '{pricing,insuranceRatePercent}') IS NULL;
