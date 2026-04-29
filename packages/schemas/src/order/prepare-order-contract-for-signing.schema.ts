import { z } from 'zod';

export const prepareOrderContractForSigningRequestSchema = z.object({
  recipientEmail: z.string().trim().email(),
  rawToken: z.string().trim().min(1),
  expiresAt: z.coerce.date(),
});

export type PrepareOrderContractForSigningRequestDto = z.infer<typeof prepareOrderContractForSigningRequestSchema>;
