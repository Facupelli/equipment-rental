import { createZodDto } from 'nestjs-zod';
import { GetAssetsQuerySchema } from '@repo/schemas';

export class GetAssetsQueryDto extends createZodDto(GetAssetsQuerySchema) {}
