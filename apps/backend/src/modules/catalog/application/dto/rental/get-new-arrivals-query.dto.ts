import { getNewArrivalsParamsSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetNewArrivalsQueryDto extends createZodDto(getNewArrivalsParamsSchema) {}
