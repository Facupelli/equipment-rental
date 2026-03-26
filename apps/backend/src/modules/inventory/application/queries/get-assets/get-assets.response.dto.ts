import { assetResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetAssetsResponseSchema = z.object({
  data: z.array(assetResponseSchema),
  meta: z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export class GetAssetsResponseDto extends createZodDto(GetAssetsResponseSchema) {}

export type GetAssetsResponse = z.infer<typeof GetAssetsResponseSchema>;
