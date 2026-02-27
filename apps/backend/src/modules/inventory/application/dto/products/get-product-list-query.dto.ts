import { GetProductsQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetProductsQueryDto extends createZodDto(GetProductsQuerySchema) {}
