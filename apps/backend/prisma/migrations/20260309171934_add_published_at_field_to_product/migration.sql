/*
  Warnings:

  - You are about to drop the column `is_active` on the `bundles` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `product_types` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "bundles_tenant_id_is_active_idx";

-- DropIndex
DROP INDEX "product_types_tenant_id_is_active_deleted_at_category_id_idx";

-- AlterTable
ALTER TABLE "bundles" DROP COLUMN "is_active",
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "retired_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "product_types" DROP COLUMN "is_active",
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "retired_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "bundles_tenant_id_published_at_idx" ON "bundles"("tenant_id", "published_at");

-- CreateIndex
CREATE INDEX "product_types_tenant_id_published_at_deleted_at_category_id_idx" ON "product_types"("tenant_id", "published_at", "deleted_at", "category_id");
