/*
  Warnings:

  - You are about to drop the column `booking_range` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `customer_id` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `grand_total` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `total_discount` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `total_tax` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the `booking_line_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `promotions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `order_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_price` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "booking_line_items" DROP CONSTRAINT "booking_line_items_bundle_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_line_items" DROP CONSTRAINT "booking_line_items_inventory_item_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_line_items" DROP CONSTRAINT "booking_line_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_line_items" DROP CONSTRAINT "booking_line_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "booking_line_items" DROP CONSTRAINT "booking_line_items_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "pricing_tiers" DROP CONSTRAINT "pricing_tiers_product_id_fkey";

-- DropForeignKey
ALTER TABLE "promotions" DROP CONSTRAINT "promotions_tenant_id_fkey";

-- DropIndex
DROP INDEX "bookings_customer_id_idx";

-- DropIndex
DROP INDEX "bookings_tenant_id_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "booking_range",
DROP COLUMN "created_at",
DROP COLUMN "customer_id",
DROP COLUMN "grand_total",
DROP COLUMN "notes",
DROP COLUMN "status",
DROP COLUMN "subtotal",
DROP COLUMN "total_discount",
DROP COLUMN "total_tax",
DROP COLUMN "updated_at",
ADD COLUMN     "bundle_id" TEXT,
ADD COLUMN     "inventory_item_id" TEXT,
ADD COLUMN     "order_id" TEXT NOT NULL,
ADD COLUMN     "price_breakdown" JSONB,
ADD COLUMN     "product_id" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "unit_price" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "pricing_tiers" ALTER COLUMN "product_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "location_id" TEXT;

-- DropTable
DROP TABLE "booking_line_items";

-- DropTable
DROP TABLE "promotions";

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'RESERVED',
    "notes" TEXT,
    "booking_range" tstzrange NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "total_discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_tenant_id_idx" ON "orders"("tenant_id");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "bookings_tenant_id_product_id_idx" ON "bookings"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "bookings_tenant_id_order_id_idx" ON "bookings"("tenant_id", "order_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "product_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
