import { updateLocationSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateLocationRequestDto extends createZodDto(updateLocationSchema) {}
