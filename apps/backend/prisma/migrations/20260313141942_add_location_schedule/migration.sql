-- CreateEnum
CREATE TYPE "ScheduleSlotType" AS ENUM ('PICKUP', 'RETURN', 'BOTH');

-- CreateTable
CREATE TABLE "rental_schedules" (
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

    CONSTRAINT "rental_schedules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rental_schedules" ADD CONSTRAINT "rental_schedules_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
