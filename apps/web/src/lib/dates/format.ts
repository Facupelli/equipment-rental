import { type Dayjs } from "dayjs";
import { countNights } from "./compute";

/**
 * "Mar 15 – Mar 22, 2025" — daily booking range
 */
export function formatDailyRange(start: Dayjs, end: Dayjs): string {
  const s = start.utc();
  const e = end.utc();
  if (s.year() === e.year()) {
    return `${s.format("MMM D")} – ${e.format("MMM D, YYYY")}`;
  }
  return `${s.format("MMM D, YYYY")} – ${e.format("MMM D, YYYY")}`;
}

/**
 * "Mar 15, 2025" — for tables and lists.
 * Never applies timezone conversion — the date is the value.
 */
export function formatDateShort(date: Dayjs | null): string {
  if (!date) {
    return "—";
  }
  return date.utc().format("MMM D, YYYY");
}

/**
 * Human-readable rental duration between two daily bounds.
 * Builds on countNights from compute.ts — no raw date math here.
 *
 * Examples: "3 Days" | "2 Weeks" | "2 Weeks, 1 Day"
 */
export function formatRentalDuration(start: Dayjs, end: Dayjs): string {
  const totalDays = countNights(start, end);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  if (weeks === 0) {
    return `${totalDays} ${totalDays === 1 ? "Day" : "Days"}`;
  }
  if (days === 0) {
    return `${weeks} ${weeks === 1 ? "Week" : "Weeks"}`;
  }
  return `${weeks} ${weeks === 1 ? "Week" : "Weeks"}, ${days} ${days === 1 ? "Day" : "Days"}`;
}
