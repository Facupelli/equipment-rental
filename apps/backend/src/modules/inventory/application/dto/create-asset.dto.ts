import { AssetCreateSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateAssetDto extends createZodDto(AssetCreateSchema) {}
