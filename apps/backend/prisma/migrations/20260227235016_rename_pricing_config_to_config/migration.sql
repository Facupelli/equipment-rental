/*
  Warnings:

  - You are about to drop the column `pricing_config` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "pricing_config",
ADD COLUMN     "config" JSONB;
