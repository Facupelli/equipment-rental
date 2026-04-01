import { updateProductTypeSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateProductTypeRequestDto extends createZodDto(updateProductTypeSchema) {}
