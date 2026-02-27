-- AlterTable
ALTER TABLE "products" ADD COLUMN     "included_items" JSONB NOT NULL DEFAULT '[]';
