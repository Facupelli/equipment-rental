import { GetCalendarDotsQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetCalendarDotsRequestDto extends createZodDto(GetCalendarDotsQuerySchema) {}
