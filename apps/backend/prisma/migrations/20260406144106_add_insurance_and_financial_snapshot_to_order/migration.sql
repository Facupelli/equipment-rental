-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "financial_snapshot" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "insurance_selected" BOOLEAN NOT NULL DEFAULT false;
