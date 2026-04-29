import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AcceptPublicSigningSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.literal('SIGNED'),
  acceptedAt: z.date(),
  agreementHash: z.string().min(1),
  channel: z.literal('email_link'),
});

export class AcceptPublicSigningSessionResponseDto extends createZodDto(AcceptPublicSigningSessionResponseSchema) {}
