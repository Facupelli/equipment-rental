import { AddScheduleToLocationSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class AddScheduleToLocationDto extends createZodDto(AddScheduleToLocationSchema) {}
