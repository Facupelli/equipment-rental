import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateAssetResponseSchema = z.object({
  id: z.uuid(),
});

export class CreateAssetResponseDto extends createZodDto(CreateAssetResponseSchema) {}

export type CreateAssetResponse = z.infer<typeof CreateAssetResponseSchema>;
