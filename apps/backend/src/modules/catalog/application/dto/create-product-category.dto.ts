import { ProductCategoryCreateSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateProductCategoryDto extends createZodDto(ProductCategoryCreateSchema) {}
