import { createZodDto } from 'nestjs-zod';
import { AssetListResponseSchema } from '@repo/schemas';

export class AssetListResponseDto extends createZodDto(AssetListResponseSchema) {}
