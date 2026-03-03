/*
  Warnings:

  - Added the required column `booking_range` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "blackout_periods" ADD COLUMN     "product_id" TEXT,
ALTER COLUMN "inventory_item_id" DROP NOT NULL,
ALTER COLUMN "blocked_quantity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "booking_range" tstzrange NOT NULL;

-- CreateTable
CREATE TABLE "order_bundles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "bundle_price" DECIMAL(10,2) NOT NULL,
    "price_breakdown" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_bundles_order_id_idx" ON "order_bundles"("order_id");

-- CreateIndex
CREATE INDEX "order_bundles_tenant_id_idx" ON "order_bundles"("tenant_id");

-- AddForeignKey
ALTER TABLE "blackout_periods" ADD CONSTRAINT "blackout_periods_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_bundles" ADD CONSTRAINT "order_bundles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_bundles" ADD CONSTRAINT "order_bundles_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_bundles" ADD CONSTRAINT "order_bundles_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "product_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
