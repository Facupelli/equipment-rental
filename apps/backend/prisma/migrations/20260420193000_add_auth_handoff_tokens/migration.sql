-- CreateTable
CREATE TABLE "auth_handoff_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "actor_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "auth_handoff_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_handoff_tokens_token_hash_key" ON "auth_handoff_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "auth_handoff_tokens_actor_type_actor_id_idx" ON "auth_handoff_tokens"("actor_type", "actor_id");

-- CreateIndex
CREATE INDEX "auth_handoff_tokens_tenant_id_idx" ON "auth_handoff_tokens"("tenant_id");
