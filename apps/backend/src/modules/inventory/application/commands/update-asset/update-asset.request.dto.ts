import { updateAssetSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateAssetRequestDto extends createZodDto(updateAssetSchema) {}
