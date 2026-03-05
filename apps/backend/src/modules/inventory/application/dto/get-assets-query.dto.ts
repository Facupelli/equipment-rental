import { createZodDto } from 'nestjs-zod';
import { getAssetsQuerySchema } from '@repo/schemas';

export class GetAssetsQueryDto extends createZodDto(getAssetsQuerySchema) {}
