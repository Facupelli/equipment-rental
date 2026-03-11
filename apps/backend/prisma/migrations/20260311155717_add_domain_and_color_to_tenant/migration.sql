/*
  Warnings:

  - A unique constraint covering the columns `[custom_domain]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "custom_domain" TEXT,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "primary_color" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tenants_custom_domain_key" ON "tenants"("custom_domain");
