import { createPricingRuleSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreatePricingRuleRequestDto extends createZodDto(createPricingRuleSchema) {}
