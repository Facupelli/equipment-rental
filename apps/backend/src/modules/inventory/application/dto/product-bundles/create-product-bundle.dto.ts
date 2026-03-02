import { createProductBundleSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateProductBundleDto extends createZodDto(createProductBundleSchema) {}
