/*
  Warnings:

  - Added the required column `pdf_byte_size` to the `document_signing_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pdf_file_name` to the `document_signing_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pdf_storage_key` to the `document_signing_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "document_signing_requests" ADD COLUMN     "pdf_byte_size" INTEGER NOT NULL,
ADD COLUMN     "pdf_content_type" TEXT NOT NULL DEFAULT 'application/pdf',
ADD COLUMN     "pdf_file_name" TEXT NOT NULL,
ADD COLUMN     "pdf_storage_key" TEXT NOT NULL;
