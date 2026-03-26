import { getAssetsQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetAssetsRequestDto extends createZodDto(getAssetsQuerySchema) {}
