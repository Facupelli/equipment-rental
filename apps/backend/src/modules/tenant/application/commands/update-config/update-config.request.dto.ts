import { updateTenantConfigSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class UpdateTenantConfigDto extends createZodDto(updateTenantConfigSchema) {}
