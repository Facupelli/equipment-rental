import { CartPriceResult as SharedCartPriceResult, cartPriceResultSchema } from '@repo/schemas';
import { z } from 'zod';

export const CalculateCartPricesResponseSchema = cartPriceResultSchema;

export type CalculateCartPricesResponseDto = SharedCartPriceResult &
  z.infer<typeof CalculateCartPricesResponseSchema> & {
    itemsSubtotal: number;
    insuranceApplied: boolean;
    insuranceAmount: number;
  };
