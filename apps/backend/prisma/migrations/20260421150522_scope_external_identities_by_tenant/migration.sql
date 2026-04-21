/*
  Warnings:

  - Added the required column `tenant_id` to the `external_identities` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "external_identities_provider_provider_subject_key";

-- AlterTable
ALTER TABLE "external_identities" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "external_identities_tenant_id_provider_provider_subject_idx" ON "external_identities"("tenant_id", "provider", "provider_subject");

-- AddForeignKey
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
