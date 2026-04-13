import { createPromotionSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdatePromotionRequestDto extends createZodDto(createPromotionSchema) {}
