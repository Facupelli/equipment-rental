import { createZodDto } from 'nestjs-zod';
import { orderPricingPreviewRequestSchema } from '@repo/schemas';

export class PreviewOrderPricingRequestDto extends createZodDto(orderPricingPreviewRequestSchema) {}
