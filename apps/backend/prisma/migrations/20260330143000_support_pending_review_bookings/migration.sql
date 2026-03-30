ALTER TABLE "orders"
  ADD COLUMN "period_start" TIMESTAMPTZ,
  ADD COLUMN "period_end" TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "asset_assignments"
    WHERE "order_id" IS NOT NULL
    GROUP BY "order_id"
    HAVING COUNT(DISTINCT "period"::text) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot backfill order period: found orders with inconsistent assignment periods.';
  END IF;
END $$;

UPDATE "orders" o
SET
  "period_start" = periods.period_start,
  "period_end" = periods.period_end
FROM (
  SELECT
    "order_id",
    MIN(LOWER("period")) AS period_start,
    MAX(UPPER("period")) AS period_end
  FROM "asset_assignments"
  WHERE "order_id" IS NOT NULL
  GROUP BY "order_id"
) periods
WHERE periods."order_id" = o."id";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "orders"
    WHERE "period_start" IS NULL OR "period_end" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot backfill order period: one or more orders have no assignment-backed rental window.';
  END IF;
END $$;

ALTER TABLE "orders"
  ALTER COLUMN "period_start" SET NOT NULL,
  ALTER COLUMN "period_end" SET NOT NULL;

ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";

CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING_REVIEW',
  'CONFIRMED',
  'REJECTED',
  'EXPIRED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED'
);

ALTER TABLE "orders"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING (
    CASE
      WHEN "status"::text IN ('PENDING_SOURCING', 'SOURCED') THEN 'CONFIRMED'
      ELSE "status"::text
    END::"OrderStatus"
  ),
  ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

DROP TYPE "OrderStatus_old";

CREATE INDEX "orders_tenant_id_location_id_period_start_period_end_idx"
ON "orders"("tenant_id", "location_id", "period_start", "period_end");
