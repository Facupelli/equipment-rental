import { createTenantUserSchema, registerResponseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateTenantUserDto extends createZodDto(createTenantUserSchema) {}
export class CreateTenantUserResponseDto extends createZodDto(registerResponseSchema) {}
