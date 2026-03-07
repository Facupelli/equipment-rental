import type { Dayjs } from "dayjs";
import dayjs from "./dayjs";

export function nowUtc(): Dayjs {
  return dayjs.utc();
}

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

/** Serialize a daily rental bound to "YYYY-MM-DD" for API transport. */
export function toDateParam(date: Dayjs): string {
  return date.utc().format("YYYY-MM-DD");
}

/**
 * Parse a tstzrange bound that represents a DAILY rental.
 * The time component is ignored — only the date matters.
 * Stored as UTC midnight; we read back the date portion only.
 */
export function parseDailyBound(
  value: string | null | undefined,
): Dayjs | null {
  if (!value) {
    return null;
  }
  const parsed = dayjs.utc(value).startOf("day");
  return parsed.isValid() ? parsed : null;
}
