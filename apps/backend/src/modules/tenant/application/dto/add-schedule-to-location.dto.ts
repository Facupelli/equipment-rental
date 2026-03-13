import { addScheduleToLocationSchema, bulkAddScheduleToLocationSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class AddScheduleToLocationDto extends createZodDto(addScheduleToLocationSchema) {}
export class BulkAddScheduleToLocationDto extends createZodDto(bulkAddScheduleToLocationSchema) {}
