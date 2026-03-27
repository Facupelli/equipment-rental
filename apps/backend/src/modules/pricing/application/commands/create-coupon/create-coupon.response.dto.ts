import { z } from 'zod';

export const CreateCouponResponseSchema = z.object({
  id: z.string().uuid(),
});

export type CreateCouponResponseDto = z.infer<typeof CreateCouponResponseSchema>;
