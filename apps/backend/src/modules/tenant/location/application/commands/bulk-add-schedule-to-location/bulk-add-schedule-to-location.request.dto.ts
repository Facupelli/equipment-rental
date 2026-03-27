import { bulkAddScheduleToLocationSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class BulkAddScheduleToLocationDto extends createZodDto(bulkAddScheduleToLocationSchema) {}
