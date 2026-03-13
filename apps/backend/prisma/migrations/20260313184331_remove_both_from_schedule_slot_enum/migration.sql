/*
  Warnings:

  - The values [BOTH] on the enum `ScheduleSlotType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScheduleSlotType_new" AS ENUM ('PICKUP', 'RETURN');
ALTER TABLE "location_schedules" ALTER COLUMN "type" TYPE "ScheduleSlotType_new" USING ("type"::text::"ScheduleSlotType_new");
ALTER TYPE "ScheduleSlotType" RENAME TO "ScheduleSlotType_old";
ALTER TYPE "ScheduleSlotType_new" RENAME TO "ScheduleSlotType";
DROP TYPE "public"."ScheduleSlotType_old";
COMMIT;
