/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,order_number]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_number` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bundles" ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "order_number" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "product_types" ADD COLUMN     "image_url" TEXT;

-- CreateTable
CREATE TABLE "tenant_order_sequences" (
    "tenant_id" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_order_sequences_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_order_number_key" ON "orders"("tenant_id", "order_number");

-- AddForeignKey
ALTER TABLE "tenant_order_sequences" ADD CONSTRAINT "tenant_order_sequences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- -----------------------------------------------------------------------------
-- Trigger function: atomically increments the tenant counter and assigns
-- the next order_number before the row is written.
-- The INSERT ... ON CONFLICT handles first-ever order for a new tenant
-- automatically — no manual seeding of tenant_order_sequences needed.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_assign_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO tenant_order_sequences (tenant_id, last_number, updated_at)
  VALUES (NEW.tenant_id, 1, NOW())
  ON CONFLICT (tenant_id) DO UPDATE
    SET last_number = tenant_order_sequences.last_number + 1,
        updated_at  = NOW()
  RETURNING last_number INTO v_next;

  NEW.order_number := v_next;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION fn_assign_order_number();
