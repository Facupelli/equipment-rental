import { generateOrderBudgetRequestSchema, getOrderByIdParamSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export type GenerateOrderBudgetRequestDto = z.infer<typeof generateOrderBudgetRequestSchema>;

export class GenerateOrderBudgetBodyDto extends createZodDto(generateOrderBudgetRequestSchema) {}

export class GenerateOrderBudgetParamDto extends createZodDto(getOrderByIdParamSchema) {}
