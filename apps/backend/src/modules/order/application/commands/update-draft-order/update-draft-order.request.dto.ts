import { createDraftOrderSchema, getOrderByIdParamSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateDraftOrderRequestDto extends createZodDto(createDraftOrderSchema) {}

export class UpdateDraftOrderParamDto extends createZodDto(getOrderByIdParamSchema) {}
