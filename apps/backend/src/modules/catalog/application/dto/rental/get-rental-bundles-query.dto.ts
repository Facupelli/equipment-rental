import { getBundleParamsSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetRentalBundlesQueryDto extends createZodDto(getBundleParamsSchema) {}
