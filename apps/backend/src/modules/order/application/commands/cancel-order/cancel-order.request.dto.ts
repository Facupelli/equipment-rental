import { getOrderByIdParamSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CancelOrderRequestDto extends createZodDto(getOrderByIdParamSchema) {}
