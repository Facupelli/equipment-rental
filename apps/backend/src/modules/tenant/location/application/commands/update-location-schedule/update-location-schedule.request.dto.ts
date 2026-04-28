import { addScheduleToLocationSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateLocationScheduleRequestDto extends createZodDto(addScheduleToLocationSchema) {}
