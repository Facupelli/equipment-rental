import { getBundleParamsSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetRentalBundlesRequestDto extends createZodDto(getBundleParamsSchema) {}
