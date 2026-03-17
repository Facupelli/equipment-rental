import { z } from "zod";
import { ScheduleSlotType } from "@repo/types";

export const addScheduleToLocationSchema = z
  .object({
    type: z.enum(ScheduleSlotType),

    dayOfWeek: z.int().min(0).max(6).nullable(),
    specificDate: z.iso.date().nullable(),

    openTime: z.int().min(0).max(1439),
    closeTime: z.int().min(0).max(1439),
    slotIntervalMinutes: z.int().min(1).nullable(),
  })
  .refine(
    (data) => (data.dayOfWeek === null) !== (data.specificDate === null),
    {
      message: "Exactly one of dayOfWeek or specificDate must be provided.",
      path: ["dayOfWeek"],
    },
  )
  .refine((data) => data.openTime <= data.closeTime, {
    message: "openTime must be less than or equal to closeTime.",
    path: ["openTime"],
  })
  .refine(
    (data) => {
      const isFixedHour = data.openTime === data.closeTime;
      const hasInterval = data.slotIntervalMinutes !== null;
      return isFixedHour !== hasInterval;
    },
    {
      message:
        "Fixed-hour schedules must have no interval. Windowed schedules must have an interval.",
      path: ["slotIntervalMinutes"],
    },
  );

export type AddScheduleToLocationDto = z.infer<
  typeof addScheduleToLocationSchema
>;

export const bulkAddScheduleToLocationSchema = z.object({
  items: z.array(addScheduleToLocationSchema),
});

export type BulkAddScheduleToLocationDto = z.infer<
  typeof bulkAddScheduleToLocationSchema
>;
