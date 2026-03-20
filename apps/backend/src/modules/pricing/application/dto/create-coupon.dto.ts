import { createCouponSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateCouponDto extends createZodDto(createCouponSchema) {}
