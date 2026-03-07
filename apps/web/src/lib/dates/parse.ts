import type { Dayjs } from "dayjs";
import dayjs from "./dayjs";

/**
 * Convert a native Date object to a dayjs UTC instance.
 * Use at layer boundaries where external sources (e.g. TanStack Router's
 * z.coerce.date()) produce native Dates instead of ISO strings.
 *
 * This is the only legitimate entry point for native Date objects.
 * Never call dayjs(date) directly outside of this file.
 */
export function fromDate(date: Date): Dayjs {
  return dayjs.utc(date);
}

/** Serialize a dayjs instance to a UTC ISO string for DB/API transport. */
export function toISOString(date: Dayjs): string {
  return date.utc().toISOString();
}
