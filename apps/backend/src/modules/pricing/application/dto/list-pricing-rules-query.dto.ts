import { listPricingRulesQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ListPricingRulesQueryDto extends createZodDto(listPricingRulesQuerySchema) {}
