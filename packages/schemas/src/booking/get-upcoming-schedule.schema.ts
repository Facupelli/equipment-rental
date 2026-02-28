import { BookingStatus } from "@repo/types";
import { z } from "zod";

const ProductSummarySchema = z.object({
  firstName: z.string(),
  additionalCount: z.number().int().nonnegative(),
});

const UpcomingBookingSchema = z.object({
  bookingId: z.string().uuid(),
  customerName: z.string(),
  productSummary: ProductSummarySchema,
  status: z.enum([
    BookingStatus.RESERVED,
    BookingStatus.PENDING_CONFIRMATION,
    BookingStatus.ACTIVE,
  ]),
});

// ─── Upcoming Day (grouped by start date) ─────────────────────────────────────
const UpcomingDaySchema = z.object({
  /**
   * ISO 8601 date string (YYYY-MM-DD), already cast to the tenant's timezone.
   * Label derivation ("Tomorrow", "Fri, Oct 25") is intentionally left
   * to the frontend — the backend does not know the user's locale.
   */
  date: z.string().date(),
  bookings: z.array(UpcomingBookingSchema),
});

export const GetUpcomingScheduleResponseSchema = z.object({
  /** ISO 8601 timestamp of when this response was generated. */
  generatedAt: z.string().datetime({ offset: true }),
  /**
   * Days from tomorrow through today + 7, ordered chronologically.
   * Days with no bookings are omitted — the frontend handles empty-state rendering.
   */
  days: z.array(UpcomingDaySchema),
});

export type GetUpcomingScheduleResponse = z.infer<
  typeof GetUpcomingScheduleResponseSchema
>;
export type UpcomingDay = z.infer<typeof UpcomingDaySchema>;
export type UpcomingBooking = z.infer<typeof UpcomingBookingSchema>;
export type UpcomingProductSummary = z.infer<typeof ProductSummarySchema>;
