import { CreateBlackoutPeriodSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateBlackoutPeriodDto extends createZodDto(CreateBlackoutPeriodSchema) {}
