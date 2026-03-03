-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_SOURCING', 'SOURCED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderItemType" AS ENUM ('PRODUCT', 'BUNDLE');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('ORDER', 'BLACKOUT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AssignmentSource" AS ENUM ('OWNED', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "TrackingMode" AS ENUM ('IDENTIFIED', 'POOLED');

-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('SEASONAL', 'VOLUME', 'COUPON', 'CUSTOMER_SPECIFIC');

-- CreateEnum
CREATE TYPE "PricingRuleScope" AS ENUM ('ORDER', 'PRODUCT_TYPE', 'CATEGORY', 'BUNDLE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "user_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "is_company" BOOLEAN NOT NULL DEFAULT false,
    "company_name" TEXT,
    "tax_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_refresh_tokens" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "customer_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_units" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "billing_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_billing_units" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "billing_unit_id" TEXT NOT NULL,

    CONSTRAINT "tenant_billing_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_types" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT,
    "billing_unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tracking_mode" "TrackingMode" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "attributes" JSONB NOT NULL,
    "included_items" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "product_type_id" TEXT NOT NULL,
    "owner_id" TEXT,
    "serial_number" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_assignments" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "order_item_id" TEXT,
    "order_id" TEXT,
    "type" "AssignmentType" NOT NULL,
    "source" "AssignmentSource",
    "reason" TEXT,
    "period" tstzrange NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_SOURCING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "type" "OrderItemType" NOT NULL,
    "product_type_id" TEXT,
    "bundle_id" TEXT,
    "price_snapshot" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_components" (
    "id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "product_type_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "bundle_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_snapshots" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "bundle_id" TEXT NOT NULL,
    "bundle_name" TEXT NOT NULL,
    "bundle_price" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_snapshot_components" (
    "id" TEXT NOT NULL,
    "bundle_snapshot_id" TEXT NOT NULL,
    "product_type_id" TEXT NOT NULL,
    "product_type_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "bundle_snapshot_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_tiers" (
    "id" TEXT NOT NULL,
    "product_type_id" TEXT,
    "bundle_id" TEXT,
    "location_id" TEXT,
    "from_unit" INTEGER NOT NULL,
    "to_unit" INTEGER,
    "price_per_unit" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "PricingRuleType" NOT NULL,
    "scope" "PricingRuleScope" NOT NULL,
    "priority" INTEGER NOT NULL,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "condition" JSONB NOT NULL,
    "effect" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_tenant_id_is_active_deleted_at_idx" ON "users"("tenant_id", "is_active", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "user_refresh_tokens_user_id_idx" ON "user_refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "user_refresh_tokens_token_hash_idx" ON "user_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "customers_tenant_id_is_active_deleted_at_idx" ON "customers"("tenant_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "customers_tenant_id_is_company_idx" ON "customers"("tenant_id", "is_company");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_email_key" ON "customers"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "customer_refresh_tokens_customer_id_idx" ON "customer_refresh_tokens"("customer_id");

-- CreateIndex
CREATE INDEX "customer_refresh_tokens_token_hash_idx" ON "customer_refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "locations_tenant_id_is_active_idx" ON "locations"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "owners_tenant_id_is_active_idx" ON "owners"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "billing_units_label_key" ON "billing_units"("label");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_billing_units_tenant_id_billing_unit_id_key" ON "tenant_billing_units"("tenant_id", "billing_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_tenant_id_name_key" ON "product_categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "product_types_tenant_id_is_active_deleted_at_category_id_idx" ON "product_types"("tenant_id", "is_active", "deleted_at", "category_id");

-- CreateIndex
CREATE INDEX "assets_location_id_product_type_id_is_active_deleted_at_idx" ON "assets"("location_id", "product_type_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "assets_product_type_id_location_id_is_active_deleted_at_idx" ON "assets"("product_type_id", "location_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "asset_assignments_order_id_idx" ON "asset_assignments"("order_id");

-- CreateIndex
CREATE INDEX "asset_assignments_order_item_id_idx" ON "asset_assignments"("order_item_id");

-- CreateIndex
CREATE INDEX "asset_assignments_asset_id_type_idx" ON "asset_assignments"("asset_id", "type");

-- CreateIndex
CREATE INDEX "orders_tenant_id_location_id_status_created_at_idx" ON "orders"("tenant_id", "location_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_tenant_id_deleted_at_idx" ON "orders"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "bundles_tenant_id_is_active_idx" ON "bundles"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_components_bundle_id_product_type_id_key" ON "bundle_components"("bundle_id", "product_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_snapshots_order_item_id_key" ON "bundle_snapshots"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_tiers_product_type_id_location_id_from_unit_key" ON "pricing_tiers"("product_type_id", "location_id", "from_unit");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_tiers_bundle_id_location_id_from_unit_key" ON "pricing_tiers"("bundle_id", "location_id", "from_unit");

-- CreateIndex
CREATE INDEX "pricing_rules_tenant_id_is_active_type_scope_idx" ON "pricing_rules"("tenant_id", "is_active", "type", "scope");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_refresh_tokens" ADD CONSTRAINT "user_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_refresh_tokens" ADD CONSTRAINT "customer_refresh_tokens_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_billing_units" ADD CONSTRAINT "tenant_billing_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_billing_units" ADD CONSTRAINT "tenant_billing_units_billing_unit_id_fkey" FOREIGN KEY ("billing_unit_id") REFERENCES "billing_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_types" ADD CONSTRAINT "product_types_billing_unit_id_fkey" FOREIGN KEY ("billing_unit_id") REFERENCES "billing_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_components" ADD CONSTRAINT "bundle_components_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_components" ADD CONSTRAINT "bundle_components_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_snapshots" ADD CONSTRAINT "bundle_snapshots_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_snapshot_components" ADD CONSTRAINT "bundle_snapshot_components_bundle_snapshot_id_fkey" FOREIGN KEY ("bundle_snapshot_id") REFERENCES "bundle_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_snapshot_components" ADD CONSTRAINT "bundle_snapshot_components_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_bundle_id_fkey" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
