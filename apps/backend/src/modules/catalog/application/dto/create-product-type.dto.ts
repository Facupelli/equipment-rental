import { ProductTypeCreateSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateProductTypeDto extends createZodDto(ProductTypeCreateSchema) {}
