import { registerSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class RegisterTenantRequestDto extends createZodDto(registerSchema) {}
