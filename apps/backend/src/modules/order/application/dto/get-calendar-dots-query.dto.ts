import { GetCalendarDotsQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetCalendarDotsQueryDto extends createZodDto(GetCalendarDotsQuerySchema) {}
