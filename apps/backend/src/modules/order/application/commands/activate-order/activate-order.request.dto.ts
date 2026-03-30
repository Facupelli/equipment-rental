import { getOrderByIdParamSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ActivateOrderRequestDto extends createZodDto(getOrderByIdParamSchema) {}
