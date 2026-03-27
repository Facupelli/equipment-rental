import { addScheduleToLocationSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class AddScheduleToLocationDto extends createZodDto(addScheduleToLocationSchema) {}
