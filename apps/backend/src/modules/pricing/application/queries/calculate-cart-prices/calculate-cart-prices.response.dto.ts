import { cartPriceResultSchema } from '@repo/schemas';
import { z } from 'zod';

export const CalculateCartPricesResponseSchema = cartPriceResultSchema;

export type CalculateCartPricesResponseDto = z.infer<typeof CalculateCartPricesResponseSchema>;
