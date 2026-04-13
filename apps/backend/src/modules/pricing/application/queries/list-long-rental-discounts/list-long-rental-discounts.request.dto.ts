import { listLongRentalDiscountsQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ListLongRentalDiscountsRequestDto extends createZodDto(listLongRentalDiscountsQuerySchema) {}
