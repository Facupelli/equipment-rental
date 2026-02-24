/*
  Warnings:

  - Made the column `product_id` on table `booking_line_items` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "booking_line_items" ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'RESERVED',
ALTER COLUMN "product_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "notes" TEXT,
ALTER COLUMN "total_discount" SET DEFAULT 0,
ALTER COLUMN "total_tax" SET DEFAULT 0;
