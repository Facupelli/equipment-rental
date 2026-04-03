import { CustomDomainStatus } from '@repo/types';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterCustomDomainResponseSchema = z.object({
  domain: z.string(),
  status: z.enum(CustomDomainStatus),
  cnameTarget: z.string(),
});

export class RegisterCustomDomainResponseDto extends createZodDto(RegisterCustomDomainResponseSchema) {}
