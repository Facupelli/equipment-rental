import { createPricingTierSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreatePricingTierDto extends createZodDto(createPricingTierSchema) {}
