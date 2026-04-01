import { UpdateBundleSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateBundleRequestDto extends createZodDto(UpdateBundleSchema) {}
