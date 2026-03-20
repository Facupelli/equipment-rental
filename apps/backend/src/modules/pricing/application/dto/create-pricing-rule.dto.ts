import { createPricingRuleSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreatePricingRuleDto extends createZodDto(createPricingRuleSchema) {}
