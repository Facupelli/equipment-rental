import dayjs from "dayjs";
import { z } from "zod";
import {
  AddScheduleToLocationSchema,
  type AddScheduleToLocationDto,
} from "@repo/schemas";
import { ScheduleSlotType } from "@repo/types";

// ---------------------------------------------------------------------------
// Helpers — minutes <-> "HH:mm" string
// ---------------------------------------------------------------------------

/** Converts minutes-from-midnight (e.g. 540) to a time string ("09:00"). */
export function minutesToTimeString(minutes: number): string {
  return dayjs().startOf("day").add(minutes, "minute").format("HH:mm");
}

/** Converts a time string ("09:00") to minutes from midnight (540). */
export function timeStringToMinutes(time: string): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

// ---------------------------------------------------------------------------
// Form schema
// HTML-compatible types — strings for time pickers, nullable primitives for
// the mutually-exclusive day/date choice. The `mode` field drives which branch
// is active in the UI and which gets sent to the API.
// ---------------------------------------------------------------------------

export const scheduleSlotFormSchema = z
  .object({
    type: z.enum(ScheduleSlotType),
    mode: z.enum(["weekly", "specific"]),

    // Weekly branch — integer 0-6
    dayOfWeek: z.number().int().min(0).max(6).nullable(),

    // Specific-date branch — ISO date string "YYYY-MM-DD"
    specificDate: z.string().nullable(),

    // Native time input gives "HH:mm"
    openTime: z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time (HH:mm)"),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time (HH:mm)"),

    slotIntervalMinutes: z.number().int().positive(),
  })
  .refine(
    (data) => {
      if (data.mode === "weekly") return data.dayOfWeek !== null;
      return data.specificDate !== null && data.specificDate.length > 0;
    },
    {
      message: "A day or specific date is required.",
      path: ["dayOfWeek"],
    },
  )
  .refine(
    (data) => {
      const open = timeStringToMinutes(data.openTime);
      const close = timeStringToMinutes(data.closeTime);
      return open < close;
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
  type: ScheduleSlotType;
  mode: "weekly" | "specific";
  dayOfWeek?: number;
  specificDate?: string;
}): ScheduleSlotFormValues {
  return {
    type: opts.type,
    mode: opts.mode,
    dayOfWeek: opts.dayOfWeek ?? null,
    specificDate: opts.specificDate ?? null,
    openTime: "08:00",
    closeTime: "18:00",
    slotIntervalMinutes: 30,
  };
}

/** Prefills the form from an existing LocationSchedule record (edit mode). */
export function scheduleToFormValues(schedule: {
  type: ScheduleSlotType;
  dayOfWeek: number | null;
  specificDate: Date | string | null;
  openTime: number;
  closeTime: number;
  slotIntervalMinutes: number;
}): ScheduleSlotFormValues {
  const mode: "weekly" | "specific" =
    schedule.dayOfWeek !== null ? "weekly" : "specific";

  const specificDate =
    schedule.specificDate !== null
      ? dayjs(schedule.specificDate).format("YYYY-MM-DD")
      : null;

  return {
    type: schedule.type,
    mode,
    dayOfWeek: schedule.dayOfWeek,
    specificDate,
    openTime: minutesToTimeString(schedule.openTime),
    closeTime: minutesToTimeString(schedule.closeTime),
    slotIntervalMinutes: schedule.slotIntervalMinutes,
  };
}

// ---------------------------------------------------------------------------
// DTO conversion — form values → API payload
// ---------------------------------------------------------------------------

export function toAddScheduleDto(
  values: ScheduleSlotFormValues,
): AddScheduleToLocationDto {
  const dto = {
    type: values.type,
    dayOfWeek: values.mode === "weekly" ? values.dayOfWeek : null,
    specificDate: values.mode === "specific" ? values.specificDate : null,
    openTime: timeStringToMinutes(values.openTime),
    closeTime: timeStringToMinutes(values.closeTime),
    slotIntervalMinutes: values.slotIntervalMinutes,
  };

  // Validate against the canonical API schema before sending.
  // This catches any edge-case mismatch between form and API contracts early.
  return AddScheduleToLocationSchema.parse(dto);
}
