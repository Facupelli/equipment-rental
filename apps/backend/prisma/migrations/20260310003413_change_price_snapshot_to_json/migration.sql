/*
  Warnings:

  - Changed the type of `price_snapshot` on the `order_items` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "price_snapshot",
ADD COLUMN     "price_snapshot" JSONB NOT NULL;
