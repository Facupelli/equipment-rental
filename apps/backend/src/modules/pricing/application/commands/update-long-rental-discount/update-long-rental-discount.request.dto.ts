import { createLongRentalDiscountSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateLongRentalDiscountRequestDto extends createZodDto(createLongRentalDiscountSchema) {}
