import { createBookingSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateBookingDto extends createZodDto(createBookingSchema) {}
