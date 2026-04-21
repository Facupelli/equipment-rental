import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const IssueCustomerGoogleAuthStateSchema = z.object({
  redirectPath: z.string().startsWith('/'),
});

export class IssueCustomerGoogleAuthStateRequestDto extends createZodDto(IssueCustomerGoogleAuthStateSchema) {}
