import { createZodDto } from 'nestjs-zod';
import { CreatePromotionSchema } from '../create-promotion/create-promotion.request.dto';

export class UpdatePromotionRequestDto extends createZodDto(CreatePromotionSchema) {}
