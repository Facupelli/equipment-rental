import { createDraftOrderSchema, getOrderByIdParamSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class EditOrderRequestDto extends createZodDto(createDraftOrderSchema) {}

export class EditOrderParamDto extends createZodDto(getOrderByIdParamSchema) {}
