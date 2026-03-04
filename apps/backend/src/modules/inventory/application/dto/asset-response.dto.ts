import { createZodDto } from 'nestjs-zod';
import { AssetResponseSchema } from '@repo/schemas';

export class AssetResponseDto extends createZodDto(AssetResponseSchema) {}
