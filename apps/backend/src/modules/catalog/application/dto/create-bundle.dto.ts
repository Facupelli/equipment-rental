import { CreateBundleSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateBundleDto extends createZodDto(CreateBundleSchema) {}
