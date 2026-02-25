/*
  Warnings:

  - Made the column `rental_period` on table `bookings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "rental_period" SET NOT NULL;
