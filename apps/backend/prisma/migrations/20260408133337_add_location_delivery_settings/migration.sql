-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "delivery_default_city" TEXT,
ADD COLUMN     "delivery_default_country" TEXT,
ADD COLUMN     "delivery_default_postal_code" TEXT,
ADD COLUMN     "delivery_default_state_region" TEXT,
ADD COLUMN     "supports_delivery" BOOLEAN NOT NULL DEFAULT false;
