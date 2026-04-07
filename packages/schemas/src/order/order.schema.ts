import { FulfillmentMethod } from "@repo/types";
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

export const deliveryRequestSchema = z.object({
  recipientName: z.string().trim().min(1, "Recipient name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  addressLine1: z.string().trim().min(1, "Address line 1 is required"),
  addressLine2: z.string().trim().optional().nullable(),
  city: z.string().trim().min(1, "City is required"),
  stateRegion: z.string().trim().min(1, "State/region is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
  instructions: z.string().trim().optional().nullable(),
});

export const createOrderSchema = z
  .object({
    locationId: z.uuid(),
    periodStart: z.iso.datetime(),
    periodEnd: z.iso.datetime(),
    pickupTime: z.number().min(0).max(1439),
    returnTime: z.number().min(0).max(1439),
    items: z.array(orderItemSchema).min(1, "At least one item is required"),
    currency: z.string().min(1, "Currency is required"),
    insuranceSelected: z.boolean().default(false),
    fulfillmentMethod: z.enum(FulfillmentMethod),
    deliveryRequest: deliveryRequestSchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (
      value.fulfillmentMethod === FulfillmentMethod.DELIVERY &&
      !value.deliveryRequest
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Delivery request is required when fulfillment method is DELIVERY",
        path: ["deliveryRequest"],
      });
    }

    if (
      value.fulfillmentMethod === FulfillmentMethod.PICKUP &&
      value.deliveryRequest
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Delivery request must be omitted when fulfillment method is PICKUP",
        path: ["deliveryRequest"],
      });
    }
  });

export type ProductOrderItemDto = z.infer<typeof productOrderItemSchema>;
export type BundleOrderItemDto = z.infer<typeof bundleOrderItemSchema>;
export type OrderItemDto = z.infer<typeof orderItemSchema>;
export type DeliveryRequestDto = z.infer<typeof deliveryRequestSchema>;
export type CreateOrderDto = z.infer<typeof createOrderSchema>;
