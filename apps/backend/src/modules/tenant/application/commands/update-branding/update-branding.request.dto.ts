import { createZodDto } from 'nestjs-zod';
import { updateTenantBrandingSchema } from '@repo/schemas';

export class UpdateTenantBrandingDto extends createZodDto(updateTenantBrandingSchema) {}
