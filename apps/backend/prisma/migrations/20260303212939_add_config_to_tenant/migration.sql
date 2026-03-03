/*
  Warnings:

  - Added the required column `config` to the `tenants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "config" JSONB NOT NULL;
