import { z } from "zod";

export enum BookingItemType {
  PRODUCT = "PRODUCT",
  BUNDLE = "BUNDLE",
}

const productItemSchema = z.object({
  type: z.literal(BookingItemType.PRODUCT),
  productId: z.uuid(),
  quantity: z.number().int().positive().default(1),
});

const bundleItemSchema = z.object({
  type: z.literal(BookingItemType.BUNDLE),
  bundleId: z.uuid(),
});

export const createOrderSchema = z
  .object({
    customerId: z.uuid(),

    startDate: z.coerce.date(),
    endDate: z.coerce.date(),

    notes: z.string().max(1000).optional(),

    items: z
      .array(
        z.discriminatedUnion("type", [productItemSchema, bundleItemSchema]),
      )
      .min(1, "A booking must have at least one line item."),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate.",
    path: ["endDate"],
  });
