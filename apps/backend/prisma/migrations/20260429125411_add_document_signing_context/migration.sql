-- CreateEnum
CREATE TYPE "SigningDocumentType" AS ENUM ('RENTAL_AGREEMENT');

-- CreateEnum
CREATE TYPE "SigningSessionStatus" AS ENUM ('PENDING', 'OPENED', 'SIGNED', 'EXPIRED', 'VOIDED');

-- CreateEnum
CREATE TYPE "SigningArtifactKind" AS ENUM ('UNSIGNED_PDF', 'SIGNED_PDF');

-- CreateEnum
CREATE TYPE "SigningAuditEventType" AS ENUM ('SESSION_CREATED', 'SESSION_OPENED', 'SESSION_SIGNED', 'SESSION_EXPIRED', 'SESSION_VOIDED', 'ARTIFACT_RECORDED', 'ANCHOR_LINKED');

-- CreateEnum
CREATE TYPE "SigningAnchorPublisherType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateTable
CREATE TABLE "signing_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "document_type" "SigningDocumentType" NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "unsigned_document_hash" TEXT NOT NULL,
    "unsigned_artifact_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "status" "SigningSessionStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "opened_at" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "declared_full_name" TEXT,
    "declared_document_number" TEXT,
    "acceptance_text_version" TEXT,
    "agreement_hash" TEXT,
    "signed_artifact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signing_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signing_artifacts" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "kind" "SigningArtifactKind" NOT NULL,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signing_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signing_audit_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "SigningAuditEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "previous_hash" TEXT,
    "current_hash" TEXT NOT NULL,

    CONSTRAINT "signing_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signing_anchors" (
    "id" TEXT NOT NULL,
    "root_hash" TEXT NOT NULL,
    "cutoff_reference" TEXT NOT NULL,
    "anchored_at" TIMESTAMP(3) NOT NULL,
    "publisher_type" "SigningAnchorPublisherType" NOT NULL,
    "publisher_reference" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signing_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signing_sessions_unsigned_artifact_id_key" ON "signing_sessions"("unsigned_artifact_id");

-- CreateIndex
CREATE UNIQUE INDEX "signing_sessions_token_hash_key" ON "signing_sessions"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "signing_sessions_signed_artifact_id_key" ON "signing_sessions"("signed_artifact_id");

-- CreateIndex
CREATE INDEX "signing_sessions_tenant_id_idx" ON "signing_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "signing_sessions_order_id_idx" ON "signing_sessions"("order_id");

-- CreateIndex
CREATE INDEX "signing_sessions_customer_id_idx" ON "signing_sessions"("customer_id");

-- CreateIndex
CREATE INDEX "signing_sessions_tenant_id_status_expires_at_idx" ON "signing_sessions"("tenant_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "signing_sessions_tenant_id_order_id_document_type_idx" ON "signing_sessions"("tenant_id", "order_id", "document_type");

-- CreateIndex
CREATE INDEX "signing_artifacts_session_id_idx" ON "signing_artifacts"("session_id");

-- CreateIndex
CREATE INDEX "signing_artifacts_session_id_kind_idx" ON "signing_artifacts"("session_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "signing_artifacts_session_id_kind_key" ON "signing_artifacts"("session_id", "kind");

-- CreateIndex
CREATE INDEX "signing_audit_events_session_id_occurred_at_idx" ON "signing_audit_events"("session_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "signing_audit_events_session_id_sequence_key" ON "signing_audit_events"("session_id", "sequence");

-- CreateIndex
CREATE INDEX "signing_anchors_root_hash_idx" ON "signing_anchors"("root_hash");

-- CreateIndex
CREATE INDEX "signing_anchors_anchored_at_idx" ON "signing_anchors"("anchored_at");

-- CreateIndex
CREATE UNIQUE INDEX "signing_anchors_publisher_type_publisher_reference_key" ON "signing_anchors"("publisher_type", "publisher_reference");

-- AddForeignKey
ALTER TABLE "signing_sessions" ADD CONSTRAINT "signing_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signing_sessions" ADD CONSTRAINT "signing_sessions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signing_sessions" ADD CONSTRAINT "signing_sessions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signing_sessions" ADD CONSTRAINT "signing_sessions_unsigned_artifact_id_fkey" FOREIGN KEY ("unsigned_artifact_id") REFERENCES "signing_artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signing_sessions" ADD CONSTRAINT "signing_sessions_signed_artifact_id_fkey" FOREIGN KEY ("signed_artifact_id") REFERENCES "signing_artifacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signing_artifacts" ADD CONSTRAINT "signing_artifacts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "signing_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signing_audit_events" ADD CONSTRAINT "signing_audit_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "signing_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
