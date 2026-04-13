import { paginatedSchema } from "../api/api.schema";
import { z } from "zod";
import {
	promotionConditionSchema,
	promotionEffectSchema,
	promotionTypeSchema,
} from "./promotion.schema";

export const promotionViewSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	type: promotionTypeSchema,
	priority: z.number().int(),
	stackable: z.boolean(),
	isActive: z.boolean(),
	condition: promotionConditionSchema,
	effect: promotionEffectSchema,
	excludedProductTypeIds: z.array(z.uuid()),
	excludedBundleIds: z.array(z.uuid()),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export type PromotionView = z.infer<typeof promotionViewSchema>;

export const listPromotionsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	search: z.string().trim().optional(),
	type: promotionTypeSchema.optional(),
});

export type ListPromotionsQueryDto = z.infer<typeof listPromotionsQuerySchema>;

export const listPromotionsResponseSchema =
	paginatedSchema(promotionViewSchema);

export type ListPromotionsResponseDto = z.infer<
	typeof listPromotionsResponseSchema
>;
