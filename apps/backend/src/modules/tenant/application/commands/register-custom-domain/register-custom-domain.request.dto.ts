import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterCustomDomainSchema = z.object({
  domain: z.string().min(1),
});

export class RegisterCustomDomainRequestDto extends createZodDto(RegisterCustomDomainSchema) {}
