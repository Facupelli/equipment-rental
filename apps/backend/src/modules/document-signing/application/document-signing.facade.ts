import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from 'src/config/env.schema';
import { SigningArtifactKind, SigningAuditEventType } from 'src/generated/prisma/client';
import { ObjectStoragePort } from 'src/modules/object-storage/application/ports/object-storage.port';

import {
  DocumentSigningPublicApi,
  PrepareSigningSessionInput,
  PrepareSigningSessionResult,
} from '../document-signing.public-api';
import { SigningArtifactMetadata } from '../domain/entities/signing-artifact-metadata.entity';
import { SigningAuditEvent, SigningAuditPayload } from '../domain/entities/signing-audit-event.entity';
import { SigningSession } from '../domain/entities/signing-session.entity';
import { SigningArtifactStorage } from '../domain/value-objects/signing-artifact-storage.value-object';
import { SigningSessionRepository } from '../infrastructure/persistence/repositories/signing-session.repository';

const PDF_CONTENT_TYPE = 'application/pdf';

@Injectable()
export class DocumentSigningFacade implements DocumentSigningPublicApi {
  private readonly bucketName: string;

  constructor(
    private readonly signingSessionRepository: SigningSessionRepository,
    private readonly objectStorage: ObjectStoragePort,
    private readonly configService: ConfigService<Env, true>,
  ) {
    this.bucketName = this.configService.get('R2_BUCKET_NAME');
  }

  async prepareSigningSession(input: PrepareSigningSessionInput): Promise<PrepareSigningSessionResult> {
    const unsignedDocumentHash = hashBuffer(input.pdfBytes);
    const activeSession = await this.signingSessionRepository.loadActiveByOrderDocumentType(
      input.tenantId,
      input.orderId,
      input.documentType,
    );

    if (activeSession && activeSession.currentUnsignedDocumentHash === unsignedDocumentHash) {
      return {
        sessionId: activeSession.id,
        unsignedDocumentHash,
        reusedExistingSession: true,
      };
    }

    if (activeSession) {
      this.appendAuditEvent(activeSession, SigningAuditEventType.SESSION_VOIDED, {
        reason: 'ORDER_DOCUMENT_CHANGED',
        supersededByDocumentHash: unsignedDocumentHash,
      });

      const voidResult = activeSession.void(new Date());
      if (voidResult.isErr()) {
        throw voidResult.error;
      }

      await this.signingSessionRepository.save(activeSession);
    }

    const session = SigningSession.create({
      tenantId: input.tenantId,
      orderId: input.orderId,
      customerId: input.customerId ?? null,
      documentType: input.documentType,
      recipientEmail: input.recipientEmail,
      unsignedDocumentHash,
      tokenHash: hashString(input.rawToken),
      expiresAt: input.expiresAt,
    });

    const objectKey = buildUnsignedArtifactObjectKey({
      tenantId: input.tenantId,
      orderId: input.orderId,
      sessionId: session.id,
      fileName: input.fileName,
    });

    await this.objectStorage.putObject({
      key: objectKey,
      body: input.pdfBytes,
      contentType: PDF_CONTENT_TYPE,
      metadata: {
        tenantId: input.tenantId,
        orderId: input.orderId,
        sessionId: session.id,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        sha256: unsignedDocumentHash,
      },
    });

    const storage = new SigningArtifactStorage({
      bucket: this.bucketName,
      objectKey,
      contentType: PDF_CONTENT_TYPE,
      byteSize: input.pdfBytes.length,
      sha256: unsignedDocumentHash,
    });

    const artifact = SigningArtifactMetadata.create({
      sessionId: session.id,
      kind: SigningArtifactKind.UNSIGNED_PDF,
      storage,
    });
    const addArtifactResult = session.addArtifact(artifact);
    if (addArtifactResult.isErr()) {
      throw addArtifactResult.error;
    }

    this.appendAuditEvent(session, SigningAuditEventType.SESSION_CREATED, {
      documentType: input.documentType,
      recipientEmail: input.recipientEmail,
      expiresAt: input.expiresAt.toISOString(),
      unsignedDocumentHash,
    });
    this.appendAuditEvent(session, SigningAuditEventType.ARTIFACT_RECORDED, {
      kind: SigningArtifactKind.UNSIGNED_PDF,
      documentNumber: input.documentNumber,
      fileName: `${input.fileName}.pdf`,
      bucket: storage.bucket,
      objectKey: storage.objectKey,
      contentType: storage.contentType,
      byteSize: storage.byteSize,
      sha256: storage.sha256,
    });

    await this.signingSessionRepository.save(session);

    return {
      sessionId: session.id,
      unsignedDocumentHash,
      reusedExistingSession: false,
    };
  }

  private appendAuditEvent(session: SigningSession, type: SigningAuditEventType, payload: SigningAuditPayload): void {
    const auditEvents = session.getAuditEvents();
    const previousHash = auditEvents[auditEvents.length - 1]?.currentHash ?? null;
    const sequence = auditEvents.length + 1;
    const occurredAt = new Date();
    const currentHash = hashAuditRecord({
      sessionId: session.id,
      sequence,
      type,
      occurredAt: occurredAt.toISOString(),
      previousHash,
      payload,
    });

    const addAuditEventResult = session.addAuditEvent(
      SigningAuditEvent.create({
        sessionId: session.id,
        sequence,
        type,
        payload,
        occurredAt,
        previousHash,
        currentHash,
      }),
    );

    if (addAuditEventResult.isErr()) {
      throw addAuditEventResult.error;
    }
  }
}

function buildUnsignedArtifactObjectKey(props: {
  tenantId: string;
  orderId: string;
  sessionId: string;
  fileName: string;
}): string {
  return `signing/${props.tenantId}/orders/${props.orderId}/sessions/${props.sessionId}/unsigned/${props.fileName}.pdf`;
}

function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hashAuditRecord(input: {
  sessionId: string;
  sequence: number;
  type: SigningAuditEventType;
  occurredAt: string;
  previousHash: string | null;
  payload: SigningAuditPayload;
}): string {
  return hashString(JSON.stringify(input));
}
