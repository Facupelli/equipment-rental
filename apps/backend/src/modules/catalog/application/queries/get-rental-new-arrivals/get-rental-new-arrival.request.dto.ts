import { getNewArrivalsParamsSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetNewArrivalsRequestDto extends createZodDto(getNewArrivalsParamsSchema) {}
