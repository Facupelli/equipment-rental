import { BookingStatus } from "@repo/types";
import { z } from "zod";

/**
 * Summarizes a booking's product line items into a human-readable string.
 * The first product name is always present; the optional suffix indicates
 * how many additional line items exist (e.g. "Camera Kit (+2 more)").
 */
const ProductSummarySchema = z.object({
  firstName: z.string(),
  additionalCount: z.number().int().nonnegative(),
});

// ─── Scheduled Out (Pick-Ups) ──────────────────────────────────────────────────

const BookingCardSchema = z.object({
  bookingId: z.uuid(),
  customerName: z.string(),
  productSummary: ProductSummarySchema,
  /** ISO 8601 — lower(rental_period) cast to the tenant's timezone */
  scheduledTime: z.iso.datetime({ offset: true }),
  status: z.enum([
    BookingStatus.RESERVED,
    BookingStatus.PENDING_CONFIRMATION,
    BookingStatus.ACTIVE,
  ]),
});

// ─── Due Back (Returns) ────────────────────────────────────────────────────────

const ReturnCardSchema = z.object({
  bookingId: z.uuid(),
  customerName: z.string(),
  productSummary: ProductSummarySchema,
  /** ISO 8601 — upper(rental_period) cast to the tenant's timezone */
  scheduledReturnTime: z.string().datetime({ offset: true }),
  /**
   * Derived in SQL: upper(rental_period) < now() AND status = 'ACTIVE'.
   * The DB is the source of truth — we never let the client derive this.
   */
  isOverdue: z.boolean(),
  status: z.enum([BookingStatus.ACTIVE, BookingStatus.RESERVED]),
});

export const GetTodayOverviewResponseSchema = z.object({
  /** ISO 8601 timestamp of when this response was generated. */
  generatedAt: z.iso.datetime({ offset: true }),
  /** Total number of bookings starting today (drives the stat card). */
  pickUpsCount: z.number().int().nonnegative(),
  /** Total number of bookings ending today (drives the stat card). */
  returnsCount: z.number().int().nonnegative(),
  /** Bookings whose rental period starts today, ordered by scheduled time ASC. */
  scheduledOut: z.array(BookingCardSchema),
  /** Bookings whose rental period ends today, ordered by scheduled return time ASC. */
  dueBack: z.array(ReturnCardSchema),
});

export type GetTodayOverviewResponse = z.infer<
  typeof GetTodayOverviewResponseSchema
>;
export type BookingCard = z.infer<typeof BookingCardSchema>;
export type ReturnCard = z.infer<typeof ReturnCardSchema>;
export type ProductSummary = z.infer<typeof ProductSummarySchema>;
