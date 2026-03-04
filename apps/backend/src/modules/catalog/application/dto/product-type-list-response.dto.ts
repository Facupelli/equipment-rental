import { createZodDto } from 'nestjs-zod';
import { ProductTypeListResponseSchema } from '@repo/schemas';

export class ProductTypeListResponseDto extends createZodDto(ProductTypeListResponseSchema) {}
