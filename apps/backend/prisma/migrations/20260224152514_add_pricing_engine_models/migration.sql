/*
  Warnings:

  - You are about to drop the column `max_days` on the `pricing_tiers` table. All the data in the column will be lost.
  - You are about to drop the column `min_days` on the `pricing_tiers` table. All the data in the column will be lost.
  - You are about to drop the column `price_per_day` on the `pricing_tiers` table. All the data in the column will be lost.
  - You are about to drop the column `base_rental_price` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenant_id,product_id,inventory_item_id,billing_unit_id,from_unit]` on the table `pricing_tiers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `billing_unit_id` to the `pricing_tiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `pricing_tiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `from_unit` to the `pricing_tiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_per_unit` to the `pricing_tiers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pricing_tiers" DROP CONSTRAINT "pricing_tiers_inventory_item_id_fkey";

-- DropForeignKey
ALTER TABLE "pricing_tiers" DROP CONSTRAINT "pricing_tiers_product_id_fkey";

-- DropForeignKey
ALTER TABLE "pricing_tiers" DROP CONSTRAINT "pricing_tiers_tenant_id_fkey";

-- DropIndex
DROP INDEX "pricing_tiers_inventory_item_id_idx";

-- DropIndex
DROP INDEX "pricing_tiers_product_id_idx";

-- DropIndex
DROP INDEX "pricing_tiers_tenant_id_idx";

-- AlterTable
ALTER TABLE "pricing_tiers" DROP COLUMN "max_days",
DROP COLUMN "min_days",
DROP COLUMN "price_per_day",
ADD COLUMN     "billing_unit_id" TEXT NOT NULL,
ADD COLUMN     "currency" CHAR(3) NOT NULL,
ADD COLUMN     "from_unit" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "price_per_unit" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "base_rental_price";

-- CreateTable
CREATE TABLE "billing_units" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration_hours" DECIMAL(6,2) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_units_tenant_id_name_key" ON "billing_units"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_tiers_tenant_id_product_id_inventory_item_id_billin_key" ON "pricing_tiers"("tenant_id", "product_id", "inventory_item_id", "billing_unit_id", "from_unit");

-- AddForeignKey
ALTER TABLE "billing_units" ADD CONSTRAINT "billing_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_billing_unit_id_fkey" FOREIGN KEY ("billing_unit_id") REFERENCES "billing_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
