-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLACKLISTED', 'PENDING_KYC', 'INACTIVE');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE';
