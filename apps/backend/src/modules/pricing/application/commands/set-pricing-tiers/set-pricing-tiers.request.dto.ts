import { createZodDto } from 'nestjs-zod';
import { setPricingTiersBodySchema } from '@repo/schemas';

export class SetPricingTiersRequestDto extends createZodDto(setPricingTiersBodySchema) {}
