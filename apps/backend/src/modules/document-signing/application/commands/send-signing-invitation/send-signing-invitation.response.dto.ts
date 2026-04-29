import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SendSigningInvitationResponseSchema = z.object({
  sessionId: z.string().uuid(),
  documentNumber: z.string().min(1),
  recipientEmail: z.string().email(),
  expiresAt: z.date(),
  unsignedDocumentHash: z.string().min(1),
  reusedExistingSession: z.boolean(),
});

export class SendSigningInvitationResponseDto extends createZodDto(SendSigningInvitationResponseSchema) {}
