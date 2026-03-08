import { GetBundlesQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetBundlesQueryDto extends createZodDto(GetBundlesQuerySchema) {}
