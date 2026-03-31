BEGIN;

UPDATE "tenants"
SET "config" = jsonb_strip_nulls(
  CASE
    -- config is NULL entirely: initialize with full defaults
    WHEN "config" IS NULL THEN
      '{"pricing":{"overRentalEnabled":false,"maxOverRentThreshold":0,"weekendCountsAsOne":false,"roundingRule":"ROUND_UP","currency":"ARS","locale":"es-ES"},"timezone":"UTC","newArrivalsWindowDays":30,"bookingMode":"INSTANT_BOOK"}'::jsonb

    -- config exists but pricing key is missing: inject full pricing defaults
    WHEN "config"->'pricing' IS NULL THEN
      "config" || '{"pricing":{"overRentalEnabled":false,"maxOverRentThreshold":0,"weekendCountsAsOne":false,"roundingRule":"ROUND_UP","currency":"ARS","locale":"es-ES"}}'::jsonb

    -- normal case: rename defaultCurrency → currency, add locale
    ELSE
      jsonb_set(
        jsonb_set(
          "config" #- '{pricing,defaultCurrency}',        -- remove old key
          '{pricing,currency}',                           -- add new key
          COALESCE(
            "config"->'pricing'->'defaultCurrency',
            '"ARS"'::jsonb                                -- fallback if somehow missing
          )
        ),
        '{pricing,locale}',
        '"es-ES"'::jsonb                                  -- new field, always set
      )
  END
)
WHERE "deleted_at" IS NULL;

COMMIT;
