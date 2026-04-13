import { createZodDto } from 'nestjs-zod';
import { CreateLongRentalDiscountSchema } from '../create-long-rental-discount/create-long-rental-discount.request.dto';

export class UpdateLongRentalDiscountRequestDto extends createZodDto(CreateLongRentalDiscountSchema) {}
