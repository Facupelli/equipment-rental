import { GetBundlesQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class GetBundlesRequestDto extends createZodDto(GetBundlesQuerySchema) {}
