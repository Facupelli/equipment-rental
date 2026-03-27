import { listPricingRulesQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ListPricingRulesRequestDto extends createZodDto(listPricingRulesQuerySchema) {}
