import { getInventoryItemsQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetInventoryItemsQueryDto extends createZodDto(getInventoryItemsQuerySchema) {}
