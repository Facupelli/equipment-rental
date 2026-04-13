import { paginatedSchema } from "../api/api.schema";
import { z } from "zod";
import { longRentalDiscountTierSchema } from "./long-rental-discount.schema";

export const longRentalDiscountViewSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	priority: z.number().int(),
	isActive: z.boolean(),
	tiers: z.array(longRentalDiscountTierSchema),
	excludedProductTypeIds: z.array(z.uuid()),
	excludedBundleIds: z.array(z.uuid()),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type LongRentalDiscountView = z.infer<
	typeof longRentalDiscountViewSchema
>;

export const listLongRentalDiscountsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().trim().optional(),
});

export type ListLongRentalDiscountsQueryDto = z.infer<
	typeof listLongRentalDiscountsQuerySchema
>;

export const listLongRentalDiscountsResponseSchema = paginatedSchema(
	longRentalDiscountViewSchema,
);

export type ListLongRentalDiscountsResponseDto = z.infer<
	typeof listLongRentalDiscountsResponseSchema
>;
