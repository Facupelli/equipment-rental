/*
  Warnings:

  - You are about to drop the column `phone` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `tax_id` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "phone",
DROP COLUMN "tax_id";
