import { createCouponSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateCouponRequestDto extends createZodDto(createCouponSchema) {}
