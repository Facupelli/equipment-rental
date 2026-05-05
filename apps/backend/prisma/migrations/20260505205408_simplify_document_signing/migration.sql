-- CreateEnum
CREATE TYPE "SigningDocumentType" AS ENUM ('RENTAL_AGREEMENT');

-- CreateEnum
CREATE TYPE "DocumentSigningRequestStatus" AS ENUM ('PENDING', 'SIGNED', 'EXPIRED', 'VOIDED');

-- CreateTable
CREATE TABLE "document_signing_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "document_type" "SigningDocumentType" NOT NULL,
    "document_number" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "document_hash" TEXT NOT NULL,
    "status" "DocumentSigningRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "signed_at" TIMESTAMP(3),
    "signer_full_name" TEXT,
    "signer_document_number" TEXT,
    "acceptance_text_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_signing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_signing_requests_token_hash_key" ON "document_signing_requests"("token_hash");

-- CreateIndex
CREATE INDEX "document_signing_requests_tenant_id_idx" ON "document_signing_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "document_signing_requests_order_id_idx" ON "document_signing_requests"("order_id");

-- CreateIndex
CREATE INDEX "document_signing_requests_customer_id_idx" ON "document_signing_requests"("customer_id");

-- CreateIndex
CREATE INDEX "document_signing_requests_tenant_id_status_expires_at_idx" ON "document_signing_requests"("tenant_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "document_signing_requests_tenant_id_order_id_document_type_idx" ON "document_signing_requests"("tenant_id", "order_id", "document_type");

-- AddForeignKey
ALTER TABLE "document_signing_requests" ADD CONSTRAINT "document_signing_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_signing_requests" ADD CONSTRAINT "document_signing_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_signing_requests" ADD CONSTRAINT "document_signing_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
