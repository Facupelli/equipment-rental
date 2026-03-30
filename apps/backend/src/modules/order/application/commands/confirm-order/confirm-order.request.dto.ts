import { getOrderByIdParamSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ConfirmOrderRequestDto extends createZodDto(getOrderByIdParamSchema) {}
