import { createZodDto } from 'nestjs-zod';
import { ProductCategoryListResponseSchema } from '@repo/schemas';

export class ProductCategoryListResponseDto extends createZodDto(ProductCategoryListResponseSchema) {}
