import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetAssetByIdRequestSchema = z.object({
  id: z.uuid(),
});

export class GetAssetByIdRequestDto extends createZodDto(GetAssetByIdRequestSchema) {}
