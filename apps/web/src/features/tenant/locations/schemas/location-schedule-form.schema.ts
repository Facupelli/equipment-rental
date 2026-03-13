import dayjs from "dayjs";
import { z } from "zod";
import {
  addScheduleToLocationSchema,
  type AddScheduleToLocationDto,
  type LocationScheduleResponseDto,
} from "@repo/schemas";

export function minutesToTimeString(minutes: number): string {
  return dayjs().startOf("day").add(minutes, "minute").format("HH:mm");
}

export function timeStringToMinutes(time: string): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

// ---------------------------------------------------------------------------
// Form schema
//
// Key changes from v1:
//   - `dayOfWeek` (singular, nullable) → `daysOfWeek` (array) so the chip
//     toggle can drive multi-day bulk creation in a single submission.
//   - In edit mode the array always has exactly one element.
//   - `specificDate` stays singular — overrides target one date at a time.
// ---------------------------------------------------------------------------

export const scheduleSlotFormSchema = z
  .object({
    type: z.enum(["PICKUP", "RETURN"]),
    mode: z.enum(["weekly", "specific"]),

    daysOfWeek: z.array(z.number().int().min(0).max(6)),

    specificDate: z.string().nullable(),

    openTime: z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time (HH:mm)"),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time (HH:mm)"),

    slotIntervalMinutes: z.number().int().positive(),
  })
  .refine(
    (data) => {
      if (data.mode === "weekly") return data.daysOfWeek.length > 0;
      return data.specificDate !== null && data.specificDate.length > 0;
    },
    {
      message: "Select at least one day or provide a specific date.",
      path: ["daysOfWeek"],
    },
  )
  .refine(
    (data) => {
      return (
        timeStringToMinutes(data.openTime) < timeStringToMinutes(data.closeTime)
      );
    },
    {
      message: "Open time must be before close time.",
      path: ["openTime"],
    },
  );

export type ScheduleSlotFormValues = z.infer<typeof scheduleSlotFormSchema>;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function getScheduleSlotDefaults(opts: {
  type: "PICKUP" | "RETURN";
  mode: "weekly" | "specific";
  daysOfWeek?: number[];
  specificDate?: string;
}): ScheduleSlotFormValues {
  return {
    type: opts.type,
    mode: opts.mode,
    daysOfWeek: opts.daysOfWeek ?? [],
    specificDate: opts.specificDate ?? null,
    openTime: "08:00",
    closeTime: "18:00",
    slotIntervalMinutes: 30,
  };
}

/** Prefills the form from an existing record (edit mode). */
export function scheduleToFormValues(
  schedule: LocationScheduleResponseDto,
): ScheduleSlotFormValues {
  return {
    type: schedule.type,
    mode: schedule.dayOfWeek !== null ? "weekly" : "specific",
    // Single-element array — edit always targets one existing record
    daysOfWeek: schedule.dayOfWeek !== null ? [schedule.dayOfWeek] : [],
    specificDate:
      schedule.specificDate !== null
        ? dayjs(schedule.specificDate).format("YYYY-MM-DD")
        : null,
    openTime: minutesToTimeString(schedule.openTime),
    closeTime: minutesToTimeString(schedule.closeTime),
    slotIntervalMinutes: schedule.slotIntervalMinutes,
  };
}

// ---------------------------------------------------------------------------
// DTO conversion
//
// Returns an array because one form submission may produce N rows (one per
// selected day). The caller routes to bulk-create or single-update depending
// on modal mode — the schema layer does not need to know which.
// ---------------------------------------------------------------------------

export function toAddScheduleDtos(
  values: ScheduleSlotFormValues,
): AddScheduleToLocationDto[] {
  const openTime = timeStringToMinutes(values.openTime);
  const closeTime = timeStringToMinutes(values.closeTime);

  if (values.mode === "specific") {
    return [
      addScheduleToLocationSchema.parse({
        type: values.type,
        dayOfWeek: null,
        specificDate: values.specificDate,
        openTime,
        closeTime,
        slotIntervalMinutes: values.slotIntervalMinutes,
      }),
    ];
  }

  return values.daysOfWeek.map((day) =>
    addScheduleToLocationSchema.parse({
      type: values.type,
      dayOfWeek: day,
      specificDate: null,
      openTime,
      closeTime,
      slotIntervalMinutes: values.slotIntervalMinutes,
    }),
  );
}
