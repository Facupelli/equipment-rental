/*
  Warnings:

  - You are about to drop the column `closeTime` on the `location_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `openTime` on the `location_schedules` table. All the data in the column will be lost.
  - Added the required column `close_time` to the `location_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `open_time` to the `location_schedules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "location_schedules" DROP COLUMN "closeTime",
DROP COLUMN "openTime",
ADD COLUMN     "close_time" INTEGER NOT NULL,
ADD COLUMN     "open_time" INTEGER NOT NULL;
