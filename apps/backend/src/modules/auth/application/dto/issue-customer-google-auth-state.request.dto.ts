import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const IssueCustomerGoogleAuthStateSchema = z.object({
  tenantId: z.uuid(),
  portalOrigin: z.url(),
  redirectPath: z.string().startsWith('/'),
});

export class IssueCustomerGoogleAuthStateRequestDto extends createZodDto(IssueCustomerGoogleAuthStateSchema) {}
