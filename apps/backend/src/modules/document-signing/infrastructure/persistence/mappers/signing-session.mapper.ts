import { Prisma, SigningArtifactKind } from 'src/generated/prisma/client';

import { SigningArtifactMetadata } from 'src/modules/document-signing/domain/entities/signing-artifact-metadata.entity';
import {
  SigningAuditEvent,
  SigningAuditPayload,
} from 'src/modules/document-signing/domain/entities/signing-audit-event.entity';
import { SigningSession } from 'src/modules/document-signing/domain/entities/signing-session.entity';
import { SigningArtifactStorage } from 'src/modules/document-signing/domain/value-objects/signing-artifact-storage.value-object';

type SigningSessionRecord = Prisma.SigningSessionGetPayload<{
  include: {
    artifacts: true;
    auditEvents: true;
  };
}>;

export class SigningSessionMapper {
  static toDomain(record: SigningSessionRecord): SigningSession {
    const artifacts = record.artifacts.map((artifact) =>
      SigningArtifactMetadata.reconstitute({
        id: artifact.id,
        sessionId: artifact.sessionId,
        kind: artifact.kind,
        documentNumber: artifact.documentNumber,
        displayFileName: artifact.displayFileName,
        storage: new SigningArtifactStorage({
          bucket: artifact.bucket,
          objectKey: artifact.objectKey,
          contentType: artifact.contentType,
          byteSize: artifact.byteSize,
          sha256: artifact.sha256,
        }),
        createdAt: artifact.createdAt,
      }),
    );

    const auditEvents = record.auditEvents.map((event) =>
      SigningAuditEvent.reconstitute({
        id: event.id,
        sessionId: event.sessionId,
        sequence: event.sequence,
        type: event.type,
        payload: event.payload as SigningAuditPayload,
        occurredAt: event.occurredAt,
        previousHash: event.previousHash,
        currentHash: event.currentHash,
      }),
    );

    return SigningSession.reconstitute({
      id: record.id,
      tenantId: record.tenantId,
      orderId: record.orderId,
      customerId: record.customerId,
      documentType: record.documentType,
      recipientEmail: record.recipientEmail,
      unsignedDocumentHash: record.unsignedDocumentHash,
      tokenHash: record.tokenHash,
      status: record.status,
      expiresAt: record.expiresAt,
      openedAt: record.openedAt,
      signedAt: record.signedAt,
      declaredFullName: record.declaredFullName,
      declaredDocumentNumber: record.declaredDocumentNumber,
      acceptanceTextVersion: record.acceptanceTextVersion,
      agreementHash: record.agreementHash,
      finalCopyTokenHash: (record as unknown as { finalCopyTokenHash?: string | null }).finalCopyTokenHash ?? null,
      finalCopyExpiresAt: (record as unknown as { finalCopyExpiresAt?: Date | null }).finalCopyExpiresAt ?? null,
      finalCopyUsedAt: (record as unknown as { finalCopyUsedAt?: Date | null }).finalCopyUsedAt ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      artifacts,
      auditEvents,
    });
  }

  static toPersistence(session: SigningSession): {
    sessionRow: Prisma.SigningSessionUncheckedCreateInput;
    artifactRows: Prisma.SigningArtifactUncheckedCreateInput[];
    auditEventRows: Prisma.SigningAuditEventUncheckedCreateInput[];
  } {
    const artifacts = session.getArtifacts();
    const unsignedArtifact = artifacts.find((artifact) => artifact.kind === SigningArtifactKind.UNSIGNED_PDF) ?? null;
    const signedArtifact = artifacts.find((artifact) => artifact.kind === SigningArtifactKind.SIGNED_PDF) ?? null;

    const sessionRow = {
      id: session.id,
      tenantId: session.tenantId,
      orderId: session.orderId,
      customerId: session.customerId,
      documentType: session.documentType,
      recipientEmail: session.currentRecipientEmail,
      unsignedDocumentHash: session.currentUnsignedDocumentHash,
      unsignedArtifactId: unsignedArtifact?.id ?? null,
      tokenHash: session.currentTokenHash,
      status: session.currentStatus,
      expiresAt: session.expiresAt,
      openedAt: session.openedOn,
      signedAt: session.signedOn,
      declaredFullName: session.currentDeclaredFullName,
      declaredDocumentNumber: session.currentDeclaredDocumentNumber,
      acceptanceTextVersion: session.currentAcceptanceTextVersion,
      agreementHash: session.currentAgreementHash,
      finalCopyTokenHash: session.currentFinalCopyTokenHash,
      finalCopyExpiresAt: session.currentFinalCopyExpiresAt,
      finalCopyUsedAt: session.currentFinalCopyUsedAt,
      signedArtifactId: signedArtifact?.id ?? null,
      createdAt: session.createdAt,
      updatedAt: session.updatedOn,
    } as Prisma.SigningSessionUncheckedCreateInput;

    const artifactRows: Prisma.SigningArtifactUncheckedCreateInput[] = artifacts.map(
      (artifact) =>
        ({
          id: artifact.id,
          sessionId: artifact.sessionId,
          kind: artifact.kind,
          documentNumber: artifact.documentNumber,
          displayFileName: artifact.displayFileName,
          bucket: artifact.storage.bucket,
          objectKey: artifact.storage.objectKey,
          contentType: artifact.storage.contentType,
          byteSize: artifact.storage.byteSize,
          sha256: artifact.storage.sha256,
          createdAt: artifact.createdAt,
        }) as Prisma.SigningArtifactUncheckedCreateInput,
    );

    const auditEventRows: Prisma.SigningAuditEventUncheckedCreateInput[] = session.getAuditEvents().map((event) => ({
      id: event.id,
      sessionId: event.sessionId,
      sequence: event.sequence,
      type: event.type,
      payload: event.payload === null ? Prisma.JsonNull : (event.payload as Prisma.InputJsonValue),
      occurredAt: event.occurredAt,
      previousHash: event.previousHash,
      currentHash: event.currentHash,
    }));

    return { sessionRow, artifactRows, auditEventRows };
  }
}
