-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('COUPON', 'SEASONAL', 'CUSTOMER_SPECIFIC');

-- CreateTable
CREATE TABLE "long_rental_discounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tiers" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "long_rental_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "long_rental_discount_exclusions" (
    "id" TEXT NOT NULL,
    "long_rental_discount_id" TEXT NOT NULL,
    "product_type_id" TEXT,
    "bundle_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "long_rental_discount_exclusions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "priority" INTEGER NOT NULL,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "condition" JSONB NOT NULL,
    "effect" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_exclusions" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "product_type_id" TEXT,
    "bundle_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_exclusions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "long_rental_discounts_tenant_id_is_active_priority_idx" ON "long_rental_discounts"("tenant_id", "is_active", "priority");

-- CreateIndex
CREATE INDEX "long_rental_discount_exclusions_long_rental_discount_id_idx" ON "long_rental_discount_exclusions"("long_rental_discount_id");

-- CreateIndex
CREATE UNIQUE INDEX "long_rental_discount_exclusions_long_rental_discount_id_pro_key" ON "long_rental_discount_exclusions"("long_rental_discount_id", "product_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "long_rental_discount_exclusions_long_rental_discount_id_bun_key" ON "long_rental_discount_exclusions"("long_rental_discount_id", "bundle_id");

-- CreateIndex
CREATE INDEX "promotions_tenant_id_is_active_type_priority_idx" ON "promotions"("tenant_id", "is_active", "type", "priority");

-- CreateIndex
CREATE INDEX "promotion_exclusions_promotion_id_idx" ON "promotion_exclusions"("promotion_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_exclusions_promotion_id_product_type_id_key" ON "promotion_exclusions"("promotion_id", "product_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_exclusions_promotion_id_bundle_id_key" ON "promotion_exclusions"("promotion_id", "bundle_id");

-- AddForeignKey
ALTER TABLE "long_rental_discounts" ADD CONSTRAINT "long_rental_discounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "long_rental_discount_exclusions" ADD CONSTRAINT "long_rental_discount_exclusions_long_rental_discount_id_fkey" FOREIGN KEY ("long_rental_discount_id") REFERENCES "long_rental_discounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "long_rental_discount_exclusions" ADD CONSTRAINT "long_rental_discount_exclusions_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "long_rental_discount_exclusions" ADD CONSTRAINT "long_rental_discount_exclusions_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_exclusions" ADD CONSTRAINT "promotion_exclusions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_exclusions" ADD CONSTRAINT "promotion_exclusions_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_exclusions" ADD CONSTRAINT "promotion_exclusions_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
