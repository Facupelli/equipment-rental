import { createPricingTierSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class AddPricingTierDto extends createZodDto(createPricingTierSchema) {}
