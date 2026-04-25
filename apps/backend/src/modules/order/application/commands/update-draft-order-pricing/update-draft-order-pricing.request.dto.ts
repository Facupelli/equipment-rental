import { getDraftOrderPricingParamSchema, updateDraftOrderPricingRequestSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export type UpdateDraftOrderPricingRequestDto = z.infer<typeof updateDraftOrderPricingRequestSchema>;

export class UpdateDraftOrderPricingParamDto extends createZodDto(getDraftOrderPricingParamSchema) {}
