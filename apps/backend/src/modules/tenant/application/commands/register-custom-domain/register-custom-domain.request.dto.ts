import { registerCustomDomainSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export const RegisterCustomDomainSchema = registerCustomDomainSchema;

export class RegisterCustomDomainRequestDto extends createZodDto(RegisterCustomDomainSchema) {}
