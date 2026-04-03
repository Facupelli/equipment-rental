import { CustomDomainStatus } from '@repo/types';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CustomDomainResponseSchema = z.object({
  domain: z.string(),
  status: z.enum(CustomDomainStatus),
  verifiedAt: z.iso.datetime().nullable(),
  lastError: z.string().nullable(),
});

export class CustomDomainResponseDto extends createZodDto(CustomDomainResponseSchema) {}
