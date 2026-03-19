-- CreateEnum
CREATE TYPE "ContractBasis" AS ENUM ('NET_COLLECTED');

-- CreateEnum
CREATE TYPE "SplitStatus" AS ENUM ('PENDING', 'CONFIRMED', 'VOID', 'SETTLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'PIX', 'CASH', 'OTHER');

-- CreateTable
CREATE TABLE "owner_contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "owner_share" DECIMAL(65,30) NOT NULL,
    "rental_share" DECIMAL(65,30) NOT NULL,
    "basis" "ContractBasis" NOT NULL DEFAULT 'NET_COLLECTED',
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_owner_splits" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "status" "SplitStatus" NOT NULL DEFAULT 'PENDING',
    "owner_share" DECIMAL(65,30) NOT NULL,
    "rental_share" DECIMAL(65,30) NOT NULL,
    "basis" "ContractBasis" NOT NULL,
    "gross_amount" DECIMAL(65,30) NOT NULL,
    "net_amount" DECIMAL(65,30) NOT NULL,
    "owner_amount" DECIMAL(65,30) NOT NULL,
    "rental_amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_item_owner_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_payment_splits" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "split_id" TEXT NOT NULL,

    CONSTRAINT "owner_payment_splits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "owner_contracts_owner_id_asset_id_valid_from_valid_until_idx" ON "owner_contracts"("owner_id", "asset_id", "valid_from", "valid_until");

-- CreateIndex
CREATE INDEX "owner_contracts_tenant_id_is_active_idx" ON "owner_contracts"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "order_item_owner_splits_owner_id_status_idx" ON "order_item_owner_splits"("owner_id", "status");

-- CreateIndex
CREATE INDEX "order_item_owner_splits_order_item_id_idx" ON "order_item_owner_splits"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_owner_splits_order_item_id_asset_id_key" ON "order_item_owner_splits"("order_item_id", "asset_id");

-- CreateIndex
CREATE INDEX "owner_payments_tenant_id_owner_id_paid_at_idx" ON "owner_payments"("tenant_id", "owner_id", "paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "owner_payment_splits_split_id_key" ON "owner_payment_splits"("split_id");

-- AddForeignKey
ALTER TABLE "owner_contracts" ADD CONSTRAINT "owner_contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_contracts" ADD CONSTRAINT "owner_contracts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_contracts" ADD CONSTRAINT "owner_contracts_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_owner_splits" ADD CONSTRAINT "order_item_owner_splits_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_owner_splits" ADD CONSTRAINT "order_item_owner_splits_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_owner_splits" ADD CONSTRAINT "order_item_owner_splits_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_owner_splits" ADD CONSTRAINT "order_item_owner_splits_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "owner_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_payments" ADD CONSTRAINT "owner_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_payments" ADD CONSTRAINT "owner_payments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_payment_splits" ADD CONSTRAINT "owner_payment_splits_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "owner_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_payment_splits" ADD CONSTRAINT "owner_payment_splits_split_id_fkey" FOREIGN KEY ("split_id") REFERENCES "order_item_owner_splits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
