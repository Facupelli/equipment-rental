/*
  Warnings:

  - You are about to drop the column `created_by` on the `blackout_periods` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_blackout_periods_blocked_period";

-- DropIndex
DROP INDEX "idx_bookings_rental_period";

-- AlterTable
ALTER TABLE "blackout_periods" DROP COLUMN "created_by";
