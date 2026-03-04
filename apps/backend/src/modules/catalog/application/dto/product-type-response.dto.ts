import { createZodDto } from 'nestjs-zod';
import { ProductTypeResponseSchema } from '@repo/schemas';

export class ProductTypeResponseDto extends createZodDto(ProductTypeResponseSchema) {}
