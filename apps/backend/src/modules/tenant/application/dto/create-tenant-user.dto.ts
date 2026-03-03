import { CreateTenantUserSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreateTenantUserDto extends createZodDto(CreateTenantUserSchema) {}
