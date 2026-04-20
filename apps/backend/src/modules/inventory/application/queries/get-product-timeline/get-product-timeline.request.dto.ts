import { getProductTimelineQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetProductTimelineRequestDto extends createZodDto(getProductTimelineQuerySchema) {}
