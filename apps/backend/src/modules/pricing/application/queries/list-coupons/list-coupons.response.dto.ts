import { couponViewSchema, paginatedSchema } from '@repo/schemas';
import { z } from 'zod';

export const ListCouponsResponseSchema = paginatedSchema(couponViewSchema);

export type ListCouponsResponseDto = z.infer<typeof ListCouponsResponseSchema>;
