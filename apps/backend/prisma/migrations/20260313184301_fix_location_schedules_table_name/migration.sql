/*
  Warnings:

  - You are about to drop the `rental_schedules` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "rental_schedules" DROP CONSTRAINT "rental_schedules_location_id_fkey";

-- DropTable
DROP TABLE "rental_schedules";

-- CreateTable
CREATE TABLE "location_schedules" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "type" "ScheduleSlotType" NOT NULL,
    "day_of_week" INTEGER,
    "specific_date" DATE,
    "openTime" INTEGER NOT NULL,
    "closeTime" INTEGER NOT NULL,
    "slot_interval_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_schedules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "location_schedules" ADD CONSTRAINT "location_schedules_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
