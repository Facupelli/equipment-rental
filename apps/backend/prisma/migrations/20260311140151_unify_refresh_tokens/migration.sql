/*
  Warnings:

  - You are about to drop the `customer_refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_refresh_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'CUSTOMER');

-- DropForeignKey
ALTER TABLE "customer_refresh_tokens" DROP CONSTRAINT "customer_refresh_tokens_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "user_refresh_tokens" DROP CONSTRAINT "user_refresh_tokens_user_id_fkey";

-- DropTable
DROP TABLE "customer_refresh_tokens";

-- DropTable
DROP TABLE "user_refresh_tokens";

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "actor_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refresh_tokens_actor_type_actor_id_idx" ON "refresh_tokens"("actor_type", "actor_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");
