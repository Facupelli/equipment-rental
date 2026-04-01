import { createCouponSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateCouponRequestDto extends createZodDto(createCouponSchema) {}
