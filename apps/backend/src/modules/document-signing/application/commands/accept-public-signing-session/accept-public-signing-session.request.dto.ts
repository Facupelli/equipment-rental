import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AcceptPublicSigningSessionBodySchema = z.object({
  declaredFullName: z.string().trim().min(1),
  declaredDocumentNumber: z.string().trim().min(1),
  acceptanceTextVersion: z.string().trim().min(1),
  accepted: z.boolean(),
});

export class AcceptPublicSigningSessionBodyDto extends createZodDto(AcceptPublicSigningSessionBodySchema) {}
