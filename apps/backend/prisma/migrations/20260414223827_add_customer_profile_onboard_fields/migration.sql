-- CreateEnum
CREATE TYPE "CustomerProfileLeadSource" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'GOOGLE', 'TIKTOK', 'REFERRAL', 'EVENT', 'REPEAT_CUSTOMER', 'OTHER');

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN     "contact1_phone" TEXT NOT NULL DEFAULT 'migration',
ADD COLUMN     "contact2_phone" TEXT NOT NULL DEFAULT 'migration',
ADD COLUMN     "heard_about_us" "CustomerProfileLeadSource" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "heard_about_us_other" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "known_customer_name" TEXT,
ADD COLUMN     "knows_existing_customer" BOOLEAN NOT NULL DEFAULT false;
