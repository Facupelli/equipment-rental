/*
  Warnings:

  - Made the column `product_id` on table `pricing_tiers` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "pricing_tiers" DROP CONSTRAINT "pricing_tiers_product_id_fkey";

-- AlterTable
ALTER TABLE "pricing_tiers" ALTER COLUMN "product_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
