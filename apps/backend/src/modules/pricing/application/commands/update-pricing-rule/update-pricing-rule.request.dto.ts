import { createPricingRuleSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdatePricingRuleRequestDto extends createZodDto(createPricingRuleSchema) {}
