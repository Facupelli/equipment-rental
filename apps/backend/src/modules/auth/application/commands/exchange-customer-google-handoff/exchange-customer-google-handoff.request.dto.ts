import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ExchangeCustomerGoogleHandoffSchema = z.object({
  handoffToken: z.string().min(1),
});

export class ExchangeCustomerGoogleHandoffRequestDto extends createZodDto(ExchangeCustomerGoogleHandoffSchema) {}
