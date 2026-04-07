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
	insuranceSelected: z.boolean().default(false),
});

// ── Response schemas ───────────────────────────────────────────────────────

export const cartDiscountLineItemSchema = z.object({
	ruleId: z.string(),
	ruleLabel: z.string(),
	type: z.enum(["PERCENTAGE", "FLAT"]),
	value: z.number(),
	discountAmount: z.number().nonnegative(),
});

export const cartPriceLineItemSchema = z.object({
	type: z.enum(["PRODUCT", "BUNDLE"]),
	id: z.uuid(),
	quantity: z.number().int().min(1),
	pricePerBillingUnit: z.number().nonnegative(),
	subtotal: z.number().nonnegative(),
	discounts: z.array(cartDiscountLineItemSchema), // ← new
});

export type CartDiscountLineItem = z.infer<typeof cartDiscountLineItemSchema>;
export type CartPriceLineItem = z.infer<typeof cartPriceLineItemSchema>;

export const cartPriceResultSchema = z.object({
	lineItems: z.array(cartPriceLineItemSchema),
	totalUnits: z.number().int().nonnegative(),
	itemsSubtotal: z.number().nonnegative(),
	insuranceApplied: z.boolean(),
	insuranceAmount: z.number().nonnegative(),
	total: z.number().nonnegative(),
	totalBeforeDiscounts: z.number().nonnegative(),
	totalDiscount: z.number().nonnegative(),
	couponApplied: z.boolean(),
});

// ── Inferred types ─────────────────────────────────────────────────────────

export type CalculateCartPricesRequest = z.infer<
	typeof calculateCartPricesRequestSchema
>;
export type CartPriceResult = z.infer<typeof cartPriceResultSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type CartProductItem = z.infer<typeof cartProductItemSchema>;
export type CartBundleItem = z.infer<typeof cartBundleItemSchema>;
