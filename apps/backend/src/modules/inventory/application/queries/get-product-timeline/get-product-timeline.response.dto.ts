import { productTimelineResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetProductTimelineResponseSchema = productTimelineResponseSchema;

export class GetProductTimelineResponseDto extends createZodDto(GetProductTimelineResponseSchema) {}

export type GetProductTimelineResponse = z.infer<typeof GetProductTimelineResponseSchema>;
