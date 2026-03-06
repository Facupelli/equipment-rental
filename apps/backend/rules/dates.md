# Date Handling in Rental Apps — A Practical Guide

> **The core idea, before anything else:** A date is not a string. A date is not a display label.
> A date is either a _precise moment in time_ or a _calendar intent_, and those are two
> fundamentally different things. Confusing them is the root cause of 90% of date bugs.

---

## 1. The Mental Model: Three Layers

Think of dates as living in three distinct layers. Code should never skip layers.

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3 — DISPLAY                                               │
│  "Mar 15, 2025"  ·  "March 15, 2:00 PM – 5:00 PM"  ·  "3 days" │
│  Human-readable strings. Timezone-aware. Never stored.           │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 2 — LOGIC (dayjs objects)                                 │
│  dayjs() instances — used for math, comparison, ranges.          │
│  Always UTC internally. Timezone applied only at display time.   │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 1 — STORAGE / TRANSPORT                                   │
│  UTC ISO strings: "2025-03-15T00:00:00.000Z"                    │
│  What Postgres stores, what the API sends and receives.          │
└──────────────────────────────────────────────────────────────────┘
```

**The golden rule: only cross layer boundaries through explicit, named functions.**
Never call `.format()` in the middle of business logic. Never do date math on a raw string.

---

## 2. Two Rental Types, One Column, One Contract

The app supports **daily rentals** (whole-day, calendar-intent) and **hourly rentals**
(precise time slots). Both are stored in the same `tstzrange` column in Postgres.
This works cleanly — but only if you enforce a strict contract at both ends of the pipeline.

### The Unified Contract

|                          | Daily rental                             | Hourly rental                     |
| ------------------------ | ---------------------------------------- | --------------------------------- |
| **Client sends**         | `"YYYY-MM-DD"` date string only          | Full datetime with timezone       |
| **Server normalizes to** | UTC midnight: `2025-03-15T00:00:00.000Z` | UTC: `2025-03-15T14:00:00.000Z`   |
| **Stored as**            | `tstzrange` with UTC midnight bounds     | `tstzrange` as-is                 |
| **Display formatter**    | Date-only — strip time, never apply tz   | Datetime — apply listing timezone |

The footgun is not `tstzrange`. The footgun is **accepting timezone-aware input for a
date-only concept**. Solve it at the input boundary and the column type works for both.

```typescript
// ❌ Dangerous — client sends timezone-aware datetime for a daily rental
{
  start: '2025-03-10T00:00:00-03:00';
} // silently becomes 03:00 UTC — wrong day

// ✅ Safe — client sends date string, server normalizes
{
  start: '2025-03-10';
} // server stores 2025-03-10T00:00:00.000Z — always correct
```

### Why UTC midnight works for daily rentals

UTC midnight is not a "timezone choice" — it's a **convention**. The stored value
`2025-03-15T00:00:00.000Z` does not mean "midnight in some timezone." It means
"the calendar day March 15." The time component is meaningless and must be discarded
on the way out, not converted.

```typescript
// User in Argentina (UTC-3) books "March 10"
// Frontend sends: "2025-03-10"           ← date string, no timezone
// Server stores:  2025-03-10T00:00:00Z   ← UTC midnight, normalized
// Display back:   "March 10"             ← strip time, never tz-convert
//                                           NOT "March 9, 9:00 PM" ❌
```

The discipline is symmetric: **control the input, honor it at the output.**

---

## 3. Three Kinds of Values

With this model, every date value in the system is one of exactly three things:

### A. System Timestamps

Examples: `created_at`, `paid_at`, `cancelled_at`

True UTC moments. Store and transport as ISO strings. Display with listing or user timezone.

### B. Daily Rental Bounds (UTC midnight convention)

Examples: `tstzrange` bounds for a daily booking

Stored as UTC midnight, but semantically a calendar day. **Never apply timezone
conversion when displaying.** Extract the date portion only.

### C. Hourly Rental Bounds (true timestamps)

Examples: `tstzrange` bounds for an hourly booking

True UTC moments, just like system timestamps. Display with listing timezone.

The `rental_type` field on the booking is what routes between B and C at display time.
Without it, you cannot safely format a `tstzrange` value.

---

## 4. File Organization

```
src/
└── lib/
    └── dates/
        ├── index.ts      ← single import point; re-exports everything
        ├── dayjs.ts      ← configured dayjs instance (utc + timezone plugins)
        ├── parse.ts      ← Layer 1 → Layer 2: raw strings → dayjs
        ├── format.ts     ← Layer 2 → Layer 3: dayjs → display strings
        ├── compute.ts    ← Layer 2 → Layer 2: pure date math
        └── booking.ts    ← domain logic: rental-specific types and calculations
```

- `parse.ts` — defensive wall against bad input. One fix here covers the whole app.
- `format.ts` — the only place that produces human-readable strings.
- `compute.ts` — never touches strings. Dayjs in, dayjs or primitive out.
- `booking.ts` — composes the layers above into domain concepts.

---

## 5. `parse.ts` — Layer 1 → Layer 2

```typescript
import dayjs, { Dayjs } from './dayjs';

/**
 * Parse a UTC ISO timestamp from the DB or API.
 * Use for: created_at, paid_at, cancelled_at,
 *          and tstzrange bounds of HOURLY rentals.
 */
export function parseTimestamp(value: string | null | undefined): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs.utc(value);
  return parsed.isValid() ? parsed : null;
}

/**
 * Parse a tstzrange bound that represents a DAILY rental.
 * The time component is ignored — only the date matters.
 * Stored as UTC midnight; we read back the date portion only.
 */
export function parseDailyBound(value: string | null | undefined): Dayjs | null {
  if (!value) return null;
  // Parse as UTC, then floor to day — defensive against any stored offset
  const parsed = dayjs.utc(value).startOf('day');
  return parsed.isValid() ? parsed : null;
}

/**
 * Normalize a client-sent date string ("YYYY-MM-DD") to UTC midnight
 * before storing in the tstzrange column.
 *
 * Call this server-side on input. Never trust a client-sent datetime
 * for a daily rental.
 */
export function normalizeToUtcMidnight(dateString: string): Dayjs {
  const parsed = dayjs.utc(dateString, 'YYYY-MM-DD', true); // strict — rejects garbage
  if (!parsed.isValid()) throw new Error(`Invalid date string: "${dateString}"`);
  return parsed.startOf('day');
}

/**
 * Current moment in UTC. Single source of truth for "now".
 * Never call dayjs() or new Date() directly in business logic.
 */
export function nowUtc(): Dayjs {
  return dayjs.utc();
}

// ─── Serializers (Layer 2 → Layer 1) ──────────────────────────────────────

/** Serialize to UTC ISO string for DB/API transport. */
export function toISOString(date: Dayjs): string {
  return date.utc().toISOString();
}

/**
 * Serialize a daily rental bound back to a plain date string.
 * Use when sending to the client — prevents timezone leakage.
 */
export function toDateString(date: Dayjs): string {
  return date.utc().format('YYYY-MM-DD');
}
```

---

## 6. `format.ts` — Layer 2 → Layer 3

The only file that produces human-readable strings. Every formatter is typed to its
semantic context — you cannot accidentally apply the wrong formatter to the wrong value.

```typescript
import { Dayjs } from 'dayjs';

// ─── Daily rental formatters ───────────────────────────────────────────────
// These NEVER apply timezone conversion. The date is the value.

/**
 * "March 15, 2025"
 */
export function formatDate(date: Dayjs | null): string {
  if (!date) return '—';
  return date.utc().format('MMMM D, YYYY');
}

/**
 * "Mar 15, 2025" — for tables and lists
 */
export function formatDateShort(date: Dayjs | null): string {
  if (!date) return '—';
  return date.utc().format('MMM D, YYYY');
}

/**
 * "Mar 15 – Mar 22, 2025" — daily booking range
 */
export function formatDailyRange(start: Dayjs, end: Dayjs): string {
  const s = start.utc();
  const e = end.utc();
  if (s.year() === e.year()) {
    return `${s.format('MMM D')} – ${e.format('MMM D, YYYY')}`;
  }
  return `${s.format('MMM D, YYYY')} – ${e.format('MMM D, YYYY')}`;
}

// ─── Hourly rental formatters ──────────────────────────────────────────────
// These ALWAYS apply the listing timezone. The time is meaningful.

/**
 * "Mar 15, 2025 at 2:00 PM" — single hourly bound in listing timezone
 */
export function formatDatetime(timestamp: Dayjs | null, listingTz: string): string {
  if (!timestamp) return '—';
  return timestamp.tz(listingTz).format('MMM D, YYYY [at] h:mm A');
}

/**
 * "March 15, 2:00 PM – 5:00 PM" — hourly booking range in listing timezone.
 * Omits redundant date when start and end fall on the same day.
 */
export function formatHourlyRange(start: Dayjs, end: Dayjs, listingTz: string): string {
  const s = start.tz(listingTz);
  const e = end.tz(listingTz);
  if (s.isSame(e, 'day')) {
    return `${s.format('MMMM D, h:mm A')} – ${e.format('h:mm A')}`;
  }
  return `${s.format('MMM D, h:mm A')} – ${e.format('MMM D, h:mm A, YYYY')}`;
}

// ─── System timestamp formatters ──────────────────────────────────────────

/**
 * "Mar 15, 2025 at 2:30 PM" — system event in listing or user timezone
 */
export function formatTimestamp(timestamp: Dayjs | null, tz: string): string {
  if (!timestamp) return '—';
  return timestamp.tz(tz).format('MMM D, YYYY [at] h:mm A');
}

/**
 * "3 days ago" / "in 2 hours" — relative time for activity feeds.
 * Requires the relativeTime dayjs plugin.
 */
export function formatRelative(timestamp: Dayjs | null): string {
  if (!timestamp) return '—';
  return timestamp.fromNow();
}
```

---

## 7. `compute.ts` — Layer 2 → Layer 2

Pure date logic. No formatting, no parsing. No knowledge of rental types.

```typescript
import { Dayjs } from 'dayjs';
import { nowUtc } from './parse';

/**
 * Number of nights between two daily bounds.
 * Uses day-level diff — time component is irrelevant.
 */
export function countNights(start: Dayjs, end: Dayjs): number {
  return end.utc().startOf('day').diff(start.utc().startOf('day'), 'day');
}

/**
 * Duration in hours between two hourly bounds.
 */
export function countHours(start: Dayjs, end: Dayjs): number {
  return end.diff(start, 'hour', true); // true = allow fractional hours
}

/**
 * Whether two ranges overlap.
 * Touching bounds (end A == start B) do NOT overlap — correct for back-to-back rentals.
 */
export function rangesOverlap(aStart: Dayjs, aEnd: Dayjs, bStart: Dayjs, bEnd: Dayjs): boolean {
  return aStart.isBefore(bEnd) && aEnd.isAfter(bStart);
}

/**
 * Whether a booking's end is in the past.
 * daily → compare at day granularity (ignores stored time component)
 * hourly → compare at minute granularity
 */
export function isExpired(end: Dayjs, granularity: 'day' | 'minute' = 'day'): boolean {
  return end.isBefore(nowUtc(), granularity);
}

/**
 * Whether a booking is currently active.
 */
export function isActive(start: Dayjs, end: Dayjs, granularity: 'day' | 'minute' = 'day'): boolean {
  const now = nowUtc();
  return !now.isBefore(start, granularity) && now.isBefore(end, granularity);
}

/**
 * All calendar date strings ("YYYY-MM-DD") in a daily range.
 * End date is exclusive — the check-out day is available for the next guest.
 */
export function expandDailyRange(start: Dayjs, end: Dayjs): string[] {
  const dates: string[] = [];
  let cursor = start.utc().startOf('day');
  const endDay = end.utc().startOf('day');
  while (cursor.isBefore(endDay)) {
    dates.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }
  return dates;
}

/**
 * Earliest allowed end given a start and a minimum duration policy.
 */
export function minEnd(start: Dayjs, min: number, unit: 'day' | 'hour'): Dayjs {
  return start.add(min, unit);
}
```

---

## 8. `booking.ts` — Domain Concepts

Composes the layers above into rental-specific logic. This is the only file that
understands what `rental_type` means.

```typescript
import { Dayjs } from 'dayjs';
import { parseDailyBound, parseTimestamp, normalizeToUtcMidnight, toISOString, toDateString } from './parse';
import { formatDailyRange, formatHourlyRange } from './format';
import { rangesOverlap, countNights, countHours, isActive, isExpired } from './compute';

export type RentalType = 'daily' | 'hourly';
export type BookingStatus = 'upcoming' | 'active' | 'expired' | 'cancelled';

export type RawBookingRange = {
  start: string; // ISO string from DB (tstzrange lower bound)
  end: string; // ISO string from DB (tstzrange upper bound)
};

export type BookingRange = {
  rentalType: RentalType;
  start: Dayjs;
  end: Dayjs;
};

// ─── Parsing ───────────────────────────────────────────────────────────────

/**
 * Parse a tstzrange row into a typed BookingRange.
 * Routes to the correct parser based on rental type.
 */
export function parseBookingRange(raw: RawBookingRange, rentalType: RentalType): BookingRange {
  if (rentalType === 'daily') {
    return {
      rentalType,
      start: parseDailyBound(raw.start)!,
      end: parseDailyBound(raw.end)!,
    };
  }
  return {
    rentalType,
    start: parseTimestamp(raw.start)!,
    end: parseTimestamp(raw.end)!,
  };
}

/**
 * Normalize client input into DB-ready ISO strings.
 * For daily: accepts "YYYY-MM-DD" only, throws on datetime strings.
 * For hourly: accepts any valid datetime string.
 */
export function normalizeBookingInput(
  input: { start: string; end: string },
  rentalType: RentalType,
): { start: string; end: string } {
  if (rentalType === 'daily') {
    if (input.start.includes('T') || input.end.includes('T')) {
      throw new Error('Daily rentals must send date strings (YYYY-MM-DD), not datetimes.');
    }
    return {
      start: toISOString(normalizeToUtcMidnight(input.start)),
      end: toISOString(normalizeToUtcMidnight(input.end)),
    };
  }
  const start = parseTimestamp(input.start);
  const end = parseTimestamp(input.end);
  if (!start || !end) throw new Error('Invalid hourly datetime input.');
  return { start: toISOString(start), end: toISOString(end) };
}

// ─── Serialization for client transport ───────────────────────────────────

/**
 * Serialize a BookingRange back to transport-safe strings.
 * Daily rentals return date strings — never UTC midnight timestamps.
 * Hourly rentals return ISO strings.
 */
export function serializeBookingRange(range: BookingRange): { start: string; end: string } {
  if (range.rentalType === 'daily') {
    return { start: toDateString(range.start), end: toDateString(range.end) };
  }
  return { start: toISOString(range.start), end: toISOString(range.end) };
}

// ─── Display ───────────────────────────────────────────────────────────────

/**
 * Format a booking range for display. Routes by rental type.
 * listingTz is required for hourly rentals; ignored for daily.
 */
export function formatBookingRange(range: BookingRange, listingTz?: string): string {
  if (range.rentalType === 'daily') {
    return formatDailyRange(range.start, range.end);
  }
  if (!listingTz) throw new Error('listingTz is required for hourly rental display.');
  return formatHourlyRange(range.start, range.end, listingTz);
}

// ─── Status ────────────────────────────────────────────────────────────────

export function getBookingStatus(range: BookingRange, cancelledAt?: string | null): BookingStatus {
  if (cancelledAt) return 'cancelled';
  const granularity = range.rentalType === 'daily' ? 'day' : 'minute';
  if (isExpired(range.end, granularity)) return 'expired';
  if (isActive(range.start, range.end, granularity)) return 'active';
  return 'upcoming';
}

// ─── Availability ──────────────────────────────────────────────────────────

/**
 * Whether a proposed range would overlap any existing booking.
 * Works for both rental types — tstzrange semantics are uniform.
 */
export function wouldOverlap(proposed: BookingRange, existing: BookingRange[]): boolean {
  return existing.some((b) => rangesOverlap(proposed.start, proposed.end, b.start, b.end));
}

// ─── Duration ──────────────────────────────────────────────────────────────

export function getBookingDuration(range: BookingRange): { value: number; unit: 'nights' | 'hours' } {
  if (range.rentalType === 'daily') {
    return { value: countNights(range.start, range.end), unit: 'nights' };
  }
  return { value: countHours(range.start, range.end), unit: 'hours' };
}
```

---

## 9. `index.ts` — The Clean Public API

Everything imported from one place. No raw dayjs in components, ever.

```typescript
// Parse / serialize (L1 ↔ L2)
export { parseTimestamp, parseDailyBound, normalizeToUtcMidnight, nowUtc, toISOString, toDateString } from './parse';

// Format (L2 → L3)
export {
  formatDate,
  formatDateShort,
  formatDailyRange,
  formatDatetime,
  formatHourlyRange,
  formatTimestamp,
  formatRelative,
} from './format';

// Compute (L2 → L2)
export { countNights, countHours, rangesOverlap, isExpired, isActive, expandDailyRange, minEnd } from './compute';

// Domain
export {
  parseBookingRange,
  normalizeBookingInput,
  serializeBookingRange,
  formatBookingRange,
  getBookingStatus,
  wouldOverlap,
  getBookingDuration,
} from './booking';
export type { RentalType, BookingStatus, BookingRange, RawBookingRange } from './booking';
```

Usage anywhere in the app:

```typescript
import { parseBookingRange, formatBookingRange, wouldOverlap } from '~/lib/dates';
```

---

## 10. Naming Conventions

| Prefix       | Meaning                         | Example                                           |
| ------------ | ------------------------------- | ------------------------------------------------- |
| `parse*`     | Raw string → Dayjs              | `parseTimestamp`, `parseDailyBound`               |
| `normalize*` | Raw client input → DB-ready     | `normalizeToUtcMidnight`, `normalizeBookingInput` |
| `format*`    | Dayjs → display string          | `formatDate`, `formatHourlyRange`                 |
| `to*`        | Dayjs → transport string        | `toISOString`, `toDateString`                     |
| `serialize*` | Domain object → transport shape | `serializeBookingRange`                           |
| `count*`     | Returns a number                | `countNights`, `countHours`                       |
| `is*`        | Returns boolean                 | `isActive`, `isExpired`                           |
| `get*`       | Returns derived value           | `getBookingStatus`, `getBookingDuration`          |
| `expand*`    | Range → array                   | `expandDailyRange`                                |

---

## 11. Common Pitfalls

**❌ Formatting a daily rental bound with a timezone-aware formatter**

```typescript
// Guest in UTC-3 sees "March 9, 9:00 PM" for a March 10 booking
formatTimestamp(booking.start, 'America/Argentina/Buenos_Aires');
```

**✅ Use the daily formatter — strips time, never tz-converts**

```typescript
formatDate(booking.start); // "March 10" — always correct
```

---

**❌ Accepting a datetime string from the client for a daily rental**

```typescript
// "2025-03-10T00:00:00-03:00" silently becomes 03:00 UTC — wrong day in DB
await db.insert({ range: `[${input.start}, ${input.end})` });
```

**✅ Validate and normalize on the server**

```typescript
const normalized = normalizeBookingInput(input, 'daily'); // throws if datetime sent
await db.insert({ range: `[${normalized.start}, ${normalized.end})` });
```

---

**❌ Sending UTC midnight timestamps to the client for daily rentals**

```typescript
// Client receives "2025-03-10T00:00:00.000Z", applies local tz → wrong date
res.json({ start: booking.start, end: booking.end });
```

**✅ Serialize through the domain layer before transport**

```typescript
const range = parseBookingRange(booking, 'daily');
res.json(serializeBookingRange(range)); // { start: "2025-03-10", end: "2025-03-15" }
```

---

**❌ Using bare `dayjs()` or `new Date()` in logic**

```typescript
const isExpired = booking.end < new Date();
```

**✅ Use `nowUtc()`**

```typescript
const isExpired = booking.end.isBefore(nowUtc(), 'day');
```

---

## 12. Summary

| Boundary              | Daily rental                              | Hourly rental                                       |
| --------------------- | ----------------------------------------- | --------------------------------------------------- |
| **Client → server**   | `"YYYY-MM-DD"` string only                | ISO datetime with offset                            |
| **Server normalizes** | UTC midnight via `normalizeToUtcMidnight` | UTC via `parseTimestamp`                            |
| **Stored in DB**      | `tstzrange` (UTC midnight bounds)         | `tstzrange` (true UTC)                              |
| **Server → client**   | `"YYYY-MM-DD"` via `toDateString`         | ISO string via `toISOString`                        |
| **Display**           | `formatDate` / `formatDailyRange` — no tz | `formatDatetime` / `formatHourlyRange` + listing tz |
| **Duration unit**     | nights                                    | hours                                               |
| **"Now" comparison**  | `"day"` granularity                       | `"minute"` granularity                              |

**The invariant:** `rental_type` must always travel with a `tstzrange` value.
Without it, you cannot safely parse, display, or serialize a booking range.
