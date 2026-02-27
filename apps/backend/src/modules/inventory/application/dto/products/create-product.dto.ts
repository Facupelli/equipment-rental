import { createProductSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateProductDto extends createZodDto(createProductSchema) {}
