import { createZodDto } from 'nestjs-zod';
import { getProductTypesQuerySchema } from '@repo/schemas';

export class GetProductTypesRequestDto extends createZodDto(getProductTypesQuerySchema) {}
