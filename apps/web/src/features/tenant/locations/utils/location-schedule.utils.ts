import type { LocationScheduleResponseDto } from "@repo/schemas";
import {
  DAY_LABELS,
  ORDERED_DAYS,
} from "../constants/location-schedule.constants";

export interface DayScheduleRow {
  dayOfWeek: number;
  label: string;
  pickup: LocationScheduleResponseDto | null;
  return: LocationScheduleResponseDto | null;
}

// ---------------------------------------------------------------------------
// groupSchedulesByDay
// Partitions a flat list of LocationSchedule records into:
//   - weeklyRows: 7 DayRow entries (Mon–Sun), each with optional pickup/return
//   - overrides: records that have specificDate set (not null)
//
// Only records with dayOfWeek !== null feed the weekly table.
// Records with specificDate !== null go to the overrides panel.
// ---------------------------------------------------------------------------

export function groupSchedulesByDay(schedules: LocationScheduleResponseDto[]): {
  weeklyRows: DayScheduleRow[];
  overrides: LocationScheduleResponseDto[];
} {
  const weekly = schedules.filter((s) => s.dayOfWeek !== null);
  const overrides = schedules.filter((s) => s.specificDate !== null);

  const byDay = new Map<
    number,
    {
      pickup: LocationScheduleResponseDto | null;
      return: LocationScheduleResponseDto | null;
    }
  >();

  for (const day of ORDERED_DAYS) {
    byDay.set(day, { pickup: null, return: null });
  }

  for (const schedule of weekly) {
    const day = schedule.dayOfWeek as number;
    const entry = byDay.get(day) ?? { pickup: null, return: null };

    if (schedule.type === "PICKUP") {
      entry.pickup = schedule;
    } else {
      entry.return = schedule;
    }

    byDay.set(day, entry);
  }

  const weeklyRows: DayScheduleRow[] = ORDERED_DAYS.map((day) => ({
    dayOfWeek: day,
    label: DAY_LABELS[day],
    pickup: byDay.get(day)!.pickup,
    return: byDay.get(day)!.return,
  }));

  return { weeklyRows, overrides };
}

// ---------------------------------------------------------------------------
// formatTimeRange — "540, 1020" → "09:00 – 17:00"
// ---------------------------------------------------------------------------

export function formatTimeRange(openTime: number, closeTime: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (minutes: number) =>
    `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  return `${fmt(openTime)} – ${fmt(closeTime)}`;
}
