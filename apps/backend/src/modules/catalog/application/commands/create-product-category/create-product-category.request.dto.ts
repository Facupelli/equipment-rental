import { createZodDto } from 'nestjs-zod';
import { createProductCategorySchema } from '@repo/schemas';

export class CreateProductCategoryRequestDto extends createZodDto(createProductCategorySchema) {}
