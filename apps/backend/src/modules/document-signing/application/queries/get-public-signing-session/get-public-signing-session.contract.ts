import { SigningDocumentType, SigningSessionStatus } from 'src/generated/prisma/client';

export interface PublicSigningSessionReadModel {
  sessionId: string;
  documentType: SigningDocumentType;
  status: SigningSessionStatus;
  expiresAt: Date;
  openedAt: Date | null;
  document: {
    artifactId: string;
    kind: 'UNSIGNED_PDF';
    documentNumber: string;
    displayFileName: string;
    contentType: string;
    byteSize: number;
    sha256: string;
  };
  prefilledSigner: {
    fullName: string | null;
    documentNumber: string | null;
  };
}
