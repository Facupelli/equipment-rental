import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AcceptPublicSigningSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.literal('SIGNED'),
  acceptedAt: z.date(),
  agreementHash: z.string().min(1),
  channel: z.literal('email_link'),
  finalCopyDelivery: z.object({
    status: z.enum(['SENT', 'FAILED']),
    failureReason: z.string().min(1).nullable(),
    failureMessage: z.string().min(1).nullable(),
  }),
});

export class AcceptPublicSigningSessionResponseDto extends createZodDto(AcceptPublicSigningSessionResponseSchema) {}
