import { paginatedSchema } from "../api/api.schema";
import { z } from "zod";
import {
  promotionActivationTypeSchema,
  promotionApplicabilitySchema,
  promotionConditionSchema,
  promotionEffectSchema,
  promotionStackingTypeSchema,
} from "./promotion.schema";

export const promotionViewSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  activationType: promotionActivationTypeSchema,
  priority: z.number().int(),
  stackingType: promotionStackingTypeSchema,
  validFrom: z.coerce.date().nullable(),
  validUntil: z.coerce.date().nullable(),
  isActive: z.boolean(),
  conditions: z.array(promotionConditionSchema),
  applicability: promotionApplicabilitySchema,
  effect: promotionEffectSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PromotionView = z.infer<typeof promotionViewSchema>;

export const listPromotionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  activationType: promotionActivationTypeSchema.optional(),
});

export type ListPromotionsQueryDto = z.infer<typeof listPromotionsQuerySchema>;

export const listPromotionsResponseSchema =
  paginatedSchema(promotionViewSchema);

export type ListPromotionsResponseDto = z.infer<
  typeof listPromotionsResponseSchema
>;
