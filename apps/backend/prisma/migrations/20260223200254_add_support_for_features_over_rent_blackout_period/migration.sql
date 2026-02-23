-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_CONFIRMATION';

-- DropForeignKey
ALTER TABLE "booking_line_items" DROP CONSTRAINT "booking_line_items_owner_id_fkey";

-- AlterTable
ALTER TABLE "booking_line_items" ADD COLUMN     "is_externally_sourced" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price_breakdown" JSONB,
ADD COLUMN     "product_id" TEXT,
ALTER COLUMN "owner_id" DROP NOT NULL,
ALTER COLUMN "inventory_item_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "pricing_config" JSONB;

-- CreateTable
CREATE TABLE "pricing_tiers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT,
    "inventory_item_id" TEXT,
    "min_days" DECIMAL(5,2) NOT NULL,
    "max_days" DECIMAL(5,2),
    "price_per_day" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackout_periods" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blocked_period" tstzrange,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blackout_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricing_tiers_tenant_id_idx" ON "pricing_tiers"("tenant_id");

-- CreateIndex
CREATE INDEX "pricing_tiers_product_id_idx" ON "pricing_tiers"("product_id");

-- CreateIndex
CREATE INDEX "pricing_tiers_inventory_item_id_idx" ON "pricing_tiers"("inventory_item_id");

-- CreateIndex
CREATE INDEX "blackout_periods_tenant_id_idx" ON "blackout_periods"("tenant_id");

-- CreateIndex
CREATE INDEX "blackout_periods_inventory_item_id_idx" ON "blackout_periods"("inventory_item_id");

-- CreateIndex
CREATE INDEX "booking_line_items_product_id_idx" ON "booking_line_items"("product_id");

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackout_periods" ADD CONSTRAINT "blackout_periods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackout_periods" ADD CONSTRAINT "blackout_periods_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_line_items" ADD CONSTRAINT "booking_line_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_line_items" ADD CONSTRAINT "booking_line_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
