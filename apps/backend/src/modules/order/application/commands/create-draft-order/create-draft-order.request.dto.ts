import { createDraftOrderSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateDraftOrderRequestDto extends createZodDto(createDraftOrderSchema) {}
