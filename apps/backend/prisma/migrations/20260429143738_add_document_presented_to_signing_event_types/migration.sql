/*
  Warnings:

  - Added the required column `display_file_name` to the `signing_artifacts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `document_number` to the `signing_artifacts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SigningAuditEventType" ADD VALUE 'DOCUMENT_PRESENTED';
ALTER TYPE "SigningAuditEventType" ADD VALUE 'INVITATION_EMAIL_REQUESTED';
ALTER TYPE "SigningAuditEventType" ADD VALUE 'INVITATION_EMAIL_SENT';
ALTER TYPE "SigningAuditEventType" ADD VALUE 'INVITATION_EMAIL_FAILED';

-- AlterTable
ALTER TABLE "signing_artifacts" ADD COLUMN     "display_file_name" TEXT NOT NULL,
ADD COLUMN     "document_number" TEXT NOT NULL;
