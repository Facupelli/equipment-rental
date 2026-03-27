import { CreateBundleSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateBundleRequestDto extends createZodDto(CreateBundleSchema) {}
