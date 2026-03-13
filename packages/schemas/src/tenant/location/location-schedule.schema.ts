import { z } from "zod";
import { ScheduleSlotType } from "@repo/types";

export const AddScheduleToLocationSchema = z
  .object({
    type: z.enum(ScheduleSlotType),

    dayOfWeek: z.int().min(0).max(6).nullable(),
    specificDate: z.iso.date().nullable(),

    openTime: z.int().min(0).max(1439),
    closeTime: z.int().min(0).max(1439),
    slotIntervalMinutes: z.int().min(1),
  })
  .refine(
    (data) => (data.dayOfWeek === null) !== (data.specificDate === null),
    {
      message: "Exactly one of dayOfWeek or specificDate must be provided.",
      path: ["dayOfWeek"],
    },
  )
  .refine((data) => data.openTime < data.closeTime, {
    message: "openTime must be strictly less than closeTime.",
    path: ["openTime"],
  });

export type AddScheduleToLocationDto = z.infer<
  typeof AddScheduleToLocationSchema
>;
