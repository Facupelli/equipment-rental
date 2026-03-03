import { PricingRuleScope, PricingRuleType } from "@repo/types";
import z from "zod";

export const PricingRuleSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  type: z.enum(PricingRuleType),
  scope: z.enum(PricingRuleScope),
  priority: z.number().int(),
  stackable: z.boolean().default(false),
  isActive: z.boolean().default(true),
  condition: z.record(z.string(), z.unknown()),
  effect: z.record(z.string(), z.unknown()),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date(),
});

export const PricingRuleCreateSchema = PricingRuleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const PricingRuleUpdateSchema = PricingRuleSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export type PricingRule = z.infer<typeof PricingRuleSchema>;
export type PricingRuleCreate = z.infer<typeof PricingRuleCreateSchema>;
export type PricingRuleUpdate = z.infer<typeof PricingRuleUpdateSchema>;
