/*
  Warnings:

  - A unique constraint covering the columns `[final_copy_token_hash]` on the table `signing_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SigningAuditEventType" ADD VALUE 'SIGNED_PDF_GENERATED';
ALTER TYPE "SigningAuditEventType" ADD VALUE 'SIGNED_PDF_STORED';
ALTER TYPE "SigningAuditEventType" ADD VALUE 'IDENTITY_DECLARED';
ALTER TYPE "SigningAuditEventType" ADD VALUE 'ACCEPTANCE_CONFIRMED';
ALTER TYPE "SigningAuditEventType" ADD VALUE 'AGREEMENT_HASH_CREATED';
ALTER TYPE "SigningAuditEventType" ADD VALUE 'FINAL_COPY_EMAIL_REQUESTED';
ALTER TYPE "SigningAuditEventType" ADD VALUE 'FINAL_COPY_EMAIL_SENT';
ALTER TYPE "SigningAuditEventType" ADD VALUE 'FINAL_COPY_EMAIL_FAILED';

-- AlterTable
ALTER TABLE "signing_sessions" ADD COLUMN     "final_copy_expires_at" TIMESTAMP(3),
ADD COLUMN     "final_copy_token_hash" TEXT,
ADD COLUMN     "final_copy_used_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "signing_sessions_final_copy_token_hash_key" ON "signing_sessions"("final_copy_token_hash");
