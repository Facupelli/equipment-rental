import { SigningDocumentType } from 'src/generated/prisma/client';

export interface PrepareSigningSessionInput {
  tenantId: string;
  orderId: string;
  customerId?: string | null;
  documentType: SigningDocumentType;
  recipientEmail: string;
  rawToken: string;
  expiresAt: Date;
  documentNumber: string;
  fileName: string;
  pdfBytes: Buffer;
}

export interface PrepareSigningSessionResult {
  sessionId: string;
  unsignedDocumentHash: string;
  reusedExistingSession: boolean;
}

export abstract class DocumentSigningPublicApi {
  abstract prepareSigningSession(input: PrepareSigningSessionInput): Promise<PrepareSigningSessionResult>;
}
