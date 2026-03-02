-- AlterTable
ALTER TABLE "booking_line_items" ADD COLUMN     "bundle_id" TEXT,
ADD COLUMN     "parent_line_item_id" TEXT,
ALTER COLUMN "product_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "product_bundles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_components" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "bundle_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_pricing_tiers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "billing_unit_id" TEXT NOT NULL,
    "from_unit" DECIMAL(5,2) NOT NULL,
    "price_per_unit" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_bundles_tenant_id_idx" ON "product_bundles"("tenant_id");

-- CreateIndex
CREATE INDEX "bundle_components_bundle_id_idx" ON "bundle_components"("bundle_id");

-- CreateIndex
CREATE INDEX "bundle_components_tenant_id_idx" ON "bundle_components"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_components_bundle_id_product_id_key" ON "bundle_components"("bundle_id", "product_id");

-- CreateIndex
CREATE INDEX "bundle_pricing_tiers_bundle_id_idx" ON "bundle_pricing_tiers"("bundle_id");

-- CreateIndex
CREATE INDEX "bundle_pricing_tiers_tenant_id_idx" ON "bundle_pricing_tiers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_pricing_tiers_bundle_id_billing_unit_id_from_unit_key" ON "bundle_pricing_tiers"("bundle_id", "billing_unit_id", "from_unit");

-- CreateIndex
CREATE INDEX "booking_line_items_bundle_id_idx" ON "booking_line_items"("bundle_id");

-- CreateIndex
CREATE INDEX "booking_line_items_parent_line_item_id_idx" ON "booking_line_items"("parent_line_item_id");

-- AddForeignKey
ALTER TABLE "product_bundles" ADD CONSTRAINT "product_bundles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_components" ADD CONSTRAINT "bundle_components_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_components" ADD CONSTRAINT "bundle_components_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "product_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_components" ADD CONSTRAINT "bundle_components_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_pricing_tiers" ADD CONSTRAINT "bundle_pricing_tiers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_pricing_tiers" ADD CONSTRAINT "bundle_pricing_tiers_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "product_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_pricing_tiers" ADD CONSTRAINT "bundle_pricing_tiers_billing_unit_id_fkey" FOREIGN KEY ("billing_unit_id") REFERENCES "billing_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_line_items" ADD CONSTRAINT "booking_line_items_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "product_bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_line_items" ADD CONSTRAINT "booking_line_items_parent_line_item_id_fkey" FOREIGN KEY ("parent_line_item_id") REFERENCES "booking_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
