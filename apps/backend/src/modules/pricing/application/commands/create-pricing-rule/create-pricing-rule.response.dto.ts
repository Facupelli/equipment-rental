import { z } from 'zod';

export const CreatePricingRuleResponseSchema = z.object({
  id: z.string().uuid(),
});

export type CreatePricingRuleResponseDto = z.infer<typeof CreatePricingRuleResponseSchema>;
