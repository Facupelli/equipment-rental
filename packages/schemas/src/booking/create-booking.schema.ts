import { z } from "zod";

const bookingLineRequestSchema = z.object({
  productId: z.uuid(),

  /** For BULK tracked products. Defaults to 1 if not provided. */
  quantity: z.number().int().positive().default(1),

  /** For SERIALIZED products: optional hint. When provided, the handler will
   *  attempt to assign this specific item. If unavailable, auto-assignment
   *  picks another available item. */
  preferredInventoryItemId: z.uuid().optional(),
});

export const createBookingSchema = z
  .object({
    customerId: z.uuid(),

    startDate: z.coerce.date(),
    endDate: z.coerce.date(),

    notes: z.string().max(1000).optional(),

    lineItems: z
      .array(bookingLineRequestSchema)
      .min(1, "A booking must have at least one line item."),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate.",
    path: ["endDate"],
  });

export type BookingLineRequest = z.infer<typeof bookingLineRequestSchema>;
