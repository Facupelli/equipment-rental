import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updateTenantBrandingSchema = z.object({
  logoUrl: z.string().trim().min(1).nullable(),
});

export class UpdateTenantBrandingDto extends createZodDto(updateTenantBrandingSchema) {}
