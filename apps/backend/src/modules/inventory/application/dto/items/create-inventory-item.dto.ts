import { createInventoryItemSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateInventoryItemDto extends createZodDto(createInventoryItemSchema) {}
