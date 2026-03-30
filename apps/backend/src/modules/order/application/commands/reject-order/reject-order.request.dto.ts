import { getOrderByIdParamSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class RejectOrderRequestDto extends createZodDto(getOrderByIdParamSchema) {}
