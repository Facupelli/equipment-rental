import { getLocationScheduleSlotsQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetLocationScheduleSlotsQueryDto extends createZodDto(getLocationScheduleSlotsQuerySchema) {}
