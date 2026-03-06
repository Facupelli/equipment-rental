import { calculateCartPricesRequestSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CalculateCartPricesDto extends createZodDto(calculateCartPricesRequestSchema) {}
