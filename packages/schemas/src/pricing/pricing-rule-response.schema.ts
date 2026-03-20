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
