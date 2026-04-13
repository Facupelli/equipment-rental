import { z } from 'zod';

export const CreateLongRentalDiscountResponseSchema = z.object({
  id: z.string().uuid(),
});

export type CreateLongRentalDiscountResponseDto = z.infer<typeof CreateLongRentalDiscountResponseSchema>;
