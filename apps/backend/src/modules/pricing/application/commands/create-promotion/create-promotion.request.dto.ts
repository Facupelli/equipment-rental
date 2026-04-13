import { createPromotionSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreatePromotionRequestDto extends createZodDto(createPromotionSchema) {}
