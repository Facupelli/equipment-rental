import { createZodDto } from 'nestjs-zod';
import { GetProductTypesQuerySchema } from '@repo/schemas';

export class GetProductTypesQueryDto extends createZodDto(GetProductTypesQuerySchema) {}
