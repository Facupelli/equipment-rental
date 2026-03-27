import { createZodDto } from 'nestjs-zod';
import { getRentalProductQuerySchema } from '@repo/schemas';

export class GetRentalProductTypesRequestDto extends createZodDto(getRentalProductQuerySchema) {}
