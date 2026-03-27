import { calculateCartPricesRequestSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CalculateCartPricesRequestDto extends createZodDto(calculateCartPricesRequestSchema) {}
