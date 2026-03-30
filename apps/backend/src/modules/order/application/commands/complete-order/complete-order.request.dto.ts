import { getOrderByIdParamSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CompleteOrderRequestDto extends createZodDto(getOrderByIdParamSchema) {}
