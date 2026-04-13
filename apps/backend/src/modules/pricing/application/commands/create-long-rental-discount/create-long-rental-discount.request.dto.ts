import { createLongRentalDiscountSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateLongRentalDiscountRequestDto extends createZodDto(createLongRentalDiscountSchema) {}
