import { registerTenantAndAdminSchema, registerResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateTenantUserDto extends createZodDto(registerTenantAndAdminSchema) {}
export class CreateTenantUserResponseDto extends createZodDto(registerResponseSchema) {}
