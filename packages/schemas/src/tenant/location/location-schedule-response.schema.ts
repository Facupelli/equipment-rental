import { z } from "zod";
import { ScheduleSlotType } from "@repo/types";

export const locationScheduleSlotsResponseSchema = z.array(
  z.int().min(0).max(1439),
);

export type LocationScheduleSlotsResponse = z.infer<
  typeof locationScheduleSlotsResponseSchema
>;

export const getLocationScheduleSlotsQuerySchema = z.object({
  date: z.coerce.date(),
  type: z.enum([ScheduleSlotType.PICKUP, ScheduleSlotType.RETURN]),
});

export type GetLocationScheduleSlotsQueryDto = z.infer<
  typeof getLocationScheduleSlotsQuerySchema
>;

// -----------------------------------------------------------------------

export const LocationScheduleResponseSchema = z.object({
  id: z.uuid(),
  locationId: z.uuid(),
  type: z.enum(ScheduleSlotType),
  dayOfWeek: z.number().int().min(0).max(6).nullable(),
  specificDate: z.date().nullable(),
  openTime: z.number().int().min(0).max(1439),
  closeTime: z.number().int().min(0).max(1439),
  slotIntervalMinutes: z.number().nullable(),
});

export type LocationScheduleResponseDto = z.infer<
  typeof LocationScheduleResponseSchema
>;
