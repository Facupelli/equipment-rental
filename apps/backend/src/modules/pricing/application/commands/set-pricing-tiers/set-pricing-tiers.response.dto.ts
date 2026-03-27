import { z } from 'zod';

export const SetPricingTiersResponseSchema = z.object({
  success: z.literal(true),
});

export type SetPricingTiersResponseDto = z.infer<typeof SetPricingTiersResponseSchema>;
