import { updateProductCategorySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateProductCategoryRequestDto extends createZodDto(updateProductCategorySchema) {}
