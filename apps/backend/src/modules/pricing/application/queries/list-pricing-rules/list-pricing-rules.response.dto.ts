import { paginatedSchema, pricingRuleViewSchema } from '@repo/schemas';
import { z } from 'zod';

export const ListPricingRulesResponseSchema = paginatedSchema(pricingRuleViewSchema);

export type ListPricingRulesResponseDto = z.infer<typeof ListPricingRulesResponseSchema>;
