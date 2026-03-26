/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,code]` on the table `roles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "code" TEXT NOT NULL DEFAULT 'TENANT_ADMIN';

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_code_key" ON "roles"("tenant_id", "code");
