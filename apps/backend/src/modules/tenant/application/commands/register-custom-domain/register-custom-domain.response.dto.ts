import { registerCustomDomainResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export const RegisterCustomDomainResponseSchema = registerCustomDomainResponseSchema;

export class RegisterCustomDomainResponseDto extends createZodDto(RegisterCustomDomainResponseSchema) {}
