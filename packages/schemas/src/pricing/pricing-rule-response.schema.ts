import { PricingRuleScope, PricingRuleType } from "@repo/types";
import { z } from "zod";
import {
  PricingRuleConditionSchema,
  PricingRuleEffectSchema,
} from "./pricing-rule.schema";

export const pricingRuleViewSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: z.enum(PricingRuleType),
  scope: z.enum(PricingRuleScope),
  condition: PricingRuleConditionSchema,
  effect: PricingRuleEffectSchema,
  priority: z.number().int().min(0),
  stackable: z.boolean(),
  isActive: z.boolean(),
});

export type PricingRuleView = z.infer<typeof pricingRuleViewSchema>;

export const listPricingRulesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(1).optional(),
  type: z.enum(PricingRuleType).optional(),
});

export type ListPricingRulesQueryDto = z.infer<
  typeof listPricingRulesQuerySchema
>;
