import { createZodDto } from 'nestjs-zod';
import { getPendingReviewOrdersQuerySchema } from '@repo/schemas';

export class GetPendingReviewOrdersRequestDto extends createZodDto(getPendingReviewOrdersQuerySchema) {}
