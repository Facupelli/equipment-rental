import type { LocationScheduleResponseDto } from "@repo/schemas";
import {
	DAY_LABELS,
	ORDERED_DAYS,
} from "../constants/location-schedule.constants";

export interface DayScheduleRow {
	dayOfWeek: number;
	label: string;
	// Arrays because a day can have multiple non-overlapping windows per type
	pickups: LocationScheduleResponseDto[];
	returns: LocationScheduleResponseDto[];
}

export function groupSchedulesByDay(schedules: LocationScheduleResponseDto[]): {
	weeklyRows: DayScheduleRow[];
	overrides: LocationScheduleResponseDto[];
} {
	const weekly = schedules.filter((s) => s.dayOfWeek !== null);
	const overrides = schedules.filter((s) => s.specificDate !== null);

	const byDay = new Map<
		number,
		{
			pickups: LocationScheduleResponseDto[];
			returns: LocationScheduleResponseDto[];
		}
	>();

	for (const day of ORDERED_DAYS) {
		byDay.set(day, { pickups: [], returns: [] });
	}

	for (const schedule of weekly) {
		const day = schedule.dayOfWeek as number;
		const entry = byDay.get(day)!;

		if (schedule.type === "PICKUP") {
			entry.pickups.push(schedule);
		} else {
			entry.returns.push(schedule);
		}
	}

	// Sort windows within each day by openTime so the stacked list is ordered
	const weeklyRows: DayScheduleRow[] = ORDERED_DAYS.map((day) => {
		const entry = byDay.get(day)!;
		return {
			dayOfWeek: day,
			label: DAY_LABELS[day],
			pickups: entry.pickups.sort((a, b) => a.openTime - b.openTime),
			returns: entry.returns.sort((a, b) => a.openTime - b.openTime),
		};
	});

	return { weeklyRows, overrides };
}

// ---------------------------------------------------------------------------
// formatTimeRange — 540, 1020 → "09:00 – 17:00"
// ---------------------------------------------------------------------------

export function formatTimeRange(openTime: number, closeTime: number): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	const fmt = (minutes: number) =>
		`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
	return `${fmt(openTime)} – ${fmt(closeTime)}`;
}
