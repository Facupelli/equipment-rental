import { createZodDto } from 'nestjs-zod';
import { getRentalProductQuerySchema } from '@repo/schemas';

export class GetRentalProductTypesQueryDto extends createZodDto(getRentalProductQuerySchema) {}
