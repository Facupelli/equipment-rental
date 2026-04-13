import { z } from 'zod';

export const CreatePromotionResponseSchema = z.object({
  id: z.string().uuid(),
});

export type CreatePromotionResponseDto = z.infer<typeof CreatePromotionResponseSchema>;
