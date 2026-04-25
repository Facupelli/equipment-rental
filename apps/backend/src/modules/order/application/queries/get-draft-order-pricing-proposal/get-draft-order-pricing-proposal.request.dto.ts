import { createZodDto } from 'nestjs-zod';
import { draftOrderPricingProposalRequestSchema, getDraftOrderPricingParamSchema } from '@repo/schemas';

export class GetDraftOrderPricingProposalRequestDto extends createZodDto(draftOrderPricingProposalRequestSchema) {}

export class GetDraftOrderPricingProposalParamDto extends createZodDto(getDraftOrderPricingParamSchema) {}
