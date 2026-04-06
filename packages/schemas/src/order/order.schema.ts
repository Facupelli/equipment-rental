import { z } from "zod";

export const productOrderItemSchema = z.object({
  type: z.literal("PRODUCT"),
  productTypeId: z.uuid(),
  assetId: z.uuid().optional(),
  quantity: z.number().default(1),
});

export const bundleOrderItemSchema = z.object({
  type: z.literal("BUNDLE"),
  bundleId: z.uuid(),
});

export const orderItemSchema = z.discriminatedUnion("type", [
  productOrderItemSchema,
  bundleOrderItemSchema,
]);

export const createOrderSchema = z.object({
  locationId: z.uuid(),
  periodStart: z.iso.datetime(),
  periodEnd: z.iso.datetime(),
  pickupTime: z.number().min(0).max(1439),
  returnTime: z.number().min(0).max(1439),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  currency: z.string().min(1, "Currency is required"),
  insuranceSelected: z.boolean().default(false),
});

export type ProductOrderItemDto = z.infer<typeof productOrderItemSchema>;
export type BundleOrderItemDto = z.infer<typeof bundleOrderItemSchema>;
export type OrderItemDto = z.infer<typeof orderItemSchema>;
export type CreateOrderDto = z.infer<typeof createOrderSchema>;
