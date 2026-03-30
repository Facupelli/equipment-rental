CREATE TYPE "OrderAssignmentStage" AS ENUM (
  'HOLD',
  'COMMITTED'
);

ALTER TABLE "asset_assignments"
  ADD COLUMN "stage" "OrderAssignmentStage";

UPDATE "asset_assignments" aa
SET "stage" = CASE
  WHEN o."status" = 'PENDING_REVIEW'::"OrderStatus" THEN 'HOLD'::"OrderAssignmentStage"
  WHEN o."status" IN ('CONFIRMED'::"OrderStatus", 'ACTIVE'::"OrderStatus") THEN 'COMMITTED'::"OrderAssignmentStage"
  ELSE NULL
END
FROM "orders" o
WHERE aa."order_id" = o."id"
  AND aa."type" = 'ORDER'::"AssignmentType";

ALTER TABLE "asset_assignments"
  DROP CONSTRAINT IF EXISTS "assignment_type_source_consistency",
  DROP CONSTRAINT IF EXISTS "assignment_type_order_consistency";

ALTER TABLE "asset_assignments"
  ADD CONSTRAINT "assignment_type_source_consistency" CHECK (
    ("type" = 'ORDER'::"AssignmentType" AND "source" IS NOT NULL)
    OR
    ("type" = 'BLACKOUT'::"AssignmentType" AND "source" IS NULL)
    OR
    ("type" = 'MAINTENANCE'::"AssignmentType" AND "source" IS NULL)
  );

ALTER TABLE "asset_assignments"
  ADD CONSTRAINT "assignment_type_order_consistency" CHECK (
    ("type" = 'ORDER'::"AssignmentType" AND "order_id" IS NOT NULL AND "order_item_id" IS NOT NULL)
    OR
    ("type" = 'BLACKOUT'::"AssignmentType" AND "order_id" IS NULL AND "order_item_id" IS NULL)
    OR
    ("type" = 'MAINTENANCE'::"AssignmentType" AND "order_id" IS NULL AND "order_item_id" IS NULL)
  );

ALTER TABLE "asset_assignments"
  ADD CONSTRAINT "assignment_type_stage_consistency" CHECK (
    ("type" = 'ORDER'::"AssignmentType" AND "stage" IS NOT NULL)
    OR
    ("type" IN ('BLACKOUT'::"AssignmentType", 'MAINTENANCE'::"AssignmentType") AND "stage" IS NULL)
  );
