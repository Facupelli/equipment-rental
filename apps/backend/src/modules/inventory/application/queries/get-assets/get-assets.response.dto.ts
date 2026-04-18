import { groupedAssetsResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetAssetsResponseSchema = groupedAssetsResponseSchema;

export class GetAssetsResponseDto extends createZodDto(GetAssetsResponseSchema) {}

export type GetAssetsResponse = z.infer<typeof GetAssetsResponseSchema>;
