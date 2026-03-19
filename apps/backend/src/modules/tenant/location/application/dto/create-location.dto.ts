import { createLocationSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateLocationDto extends createZodDto(createLocationSchema) {}
