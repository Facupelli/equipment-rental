import { createAssetSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateAssetRequestDto extends createZodDto(createAssetSchema) {}
