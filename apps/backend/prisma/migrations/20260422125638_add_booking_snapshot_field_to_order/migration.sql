-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "booking_snapshot" JSONB NOT NULL DEFAULT '{}';
