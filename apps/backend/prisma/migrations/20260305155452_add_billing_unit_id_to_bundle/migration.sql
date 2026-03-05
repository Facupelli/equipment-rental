/*
  Warnings:

  - Added the required column `billing_unit_id` to the `bundles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bundles" ADD COLUMN     "billing_unit_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_billing_unit_id_fkey" FOREIGN KEY ("billing_unit_id") REFERENCES "billing_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
