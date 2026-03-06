import { z } from "zod";

// ── Request schemas ────────────────────────────────────────────────────────

export const cartProductItemSchema = z.object({
  type: z.literal("PRODUCT"),
  productTypeId: z.uuid(),
  quantity: z.number().int().min(1),
});

export const cartBundleItemSchema = z.object({
  type: z.literal("BUNDLE"),
  bundleId: z.uuid(),
  quantity: z.number().int().min(1),
});

export const cartItemSchema = z.discriminatedUnion("type", [
  cartProductItemSchema,
  cartBundleItemSchema,
]);

export const calculateCartPricesRequestSchema = z.object({
  locationId: z.uuid(),
  currency: z.string().length(3),
  period: z.object({
    start: z.iso.datetime(),
    end: z.iso.datetime(),
  }),
  items: z.array(cartItemSchema),
});

// ── Response schemas ───────────────────────────────────────────────────────

export const cartPriceLineItemSchema = z.object({
  type: z.enum(["PRODUCT", "BUNDLE"]),
  /** productTypeId for PRODUCT items, bundleId for BUNDLE items */
  id: z.uuid(),
  quantity: z.number().int().min(1),
  /** Price for a single unit — decimal */
  pricePerUnit: z.number().nonnegative(),
  /** pricePerUnit × quantity — decimal */
  subtotal: z.number().nonnegative(),
});

export const cartPriceResultSchema = z.object({
  lineItems: z.array(cartPriceLineItemSchema),
  total: z.number().nonnegative(),
});

// ── Inferred types ─────────────────────────────────────────────────────────

export type CalculateCartPricesRequest = z.infer<
  typeof calculateCartPricesRequestSchema
>;
export type CartPriceResult = z.infer<typeof cartPriceResultSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type CartProductItem = z.infer<typeof cartProductItemSchema>;
export type CartBundleItem = z.infer<typeof cartBundleItemSchema>;
export type CartPriceLineItem = z.infer<typeof cartPriceLineItemSchema>;
