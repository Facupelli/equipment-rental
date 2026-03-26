import { registerResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class RegisterTenantResponseDto extends createZodDto(registerResponseSchema) {}
