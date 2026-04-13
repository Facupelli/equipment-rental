import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PromotionType } from '../../../domain/types/promotion.types';

export const ListPromotionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  type: z.nativeEnum(PromotionType).optional(),
});

export class ListPromotionsRequestDto extends createZodDto(ListPromotionsSchema) {}
