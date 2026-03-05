import { createZodDto } from 'nestjs-zod';
import { getProductTypesQuerySchema } from '@repo/schemas';

export class GetProductTypesQueryDto extends createZodDto(getProductTypesQuerySchema) {}
