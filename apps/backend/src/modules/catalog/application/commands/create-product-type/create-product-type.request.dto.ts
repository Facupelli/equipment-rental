import { createProductTypeSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateProductTypeRequestDto extends createZodDto(createProductTypeSchema) {}
