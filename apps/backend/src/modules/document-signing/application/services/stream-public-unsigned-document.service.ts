import { Injectable } from '@nestjs/common';

import { SigningArtifactKind, SigningAuditEventType, SigningSessionStatus } from 'src/generated/prisma/client';
import { SigningArtifactMetadata } from 'src/modules/document-signing/domain/entities/signing-artifact-metadata.entity';
import { SigningSession } from 'src/modules/document-signing/domain/entities/signing-session.entity';
import { UnsignedSigningArtifactNotFoundError } from 'src/modules/document-signing/domain/errors/document-signing.errors';
import { SigningSessionRepository } from 'src/modules/document-signing/infrastructure/persistence/repositories/signing-session.repository';
import { ObjectStoragePort } from 'src/modules/object-storage/application/ports/object-storage.port';

import { PublicSigningDocumentStream } from '../document-signing-public-document-stream.contract';
import { PublicSigningSessionLoader } from '../public-signing-session.loader';
import { SigningAuditAppender } from '../signing-audit-appender.service';

@Injectable()
export class StreamPublicUnsignedDocumentService {
  constructor(
    private readonly objectStorage: ObjectStoragePort,
    private readonly signingAuditAppender: SigningAuditAppender,
    private readonly publicSigningSessionLoader: PublicSigningSessionLoader,
    private readonly signingSessionRepository: SigningSessionRepository,
  ) {}

  async stream(rawToken: string): Promise<PublicSigningDocumentStream> {
    const session = await this.publicSigningSessionLoader.loadRequiredPublicSession(rawToken);
    const artifact = this.requireUnsignedArtifact(session);
    const stream = await this.objectStorage.getObjectStream({ key: artifact.storage.objectKey });
    const now = new Date();

    if (session.currentStatus === SigningSessionStatus.PENDING) {
      const markOpenedResult = session.markOpened(now);
      if (markOpenedResult.isErr()) {
        throw markOpenedResult.error;
      }

      this.signingAuditAppender.append(session, SigningAuditEventType.SESSION_OPENED, {
        openedAt: now.toISOString(),
        artifactId: artifact.id,
        kind: artifact.kind,
        sha256: artifact.storage.sha256,
      });
    }

    this.signingAuditAppender.append(session, SigningAuditEventType.DOCUMENT_PRESENTED, {
      artifactId: artifact.id,
      kind: artifact.kind,
      documentNumber: artifact.documentNumber,
      displayFileName: artifact.displayFileName,
      contentType: artifact.storage.contentType,
      byteSize: artifact.storage.byteSize,
      sha256: artifact.storage.sha256,
      presentedAt: now.toISOString(),
    });

    await this.signingSessionRepository.save(session);

    return {
      fileName: artifact.displayFileName,
      contentType: artifact.storage.contentType,
      contentLength: artifact.storage.byteSize,
      stream,
    };
  }

  private requireUnsignedArtifact(session: SigningSession): SigningArtifactMetadata {
    const artifact = session.getArtifacts().find((candidate) => candidate.kind === SigningArtifactKind.UNSIGNED_PDF);
    if (!artifact) {
      throw new UnsignedSigningArtifactNotFoundError(session.id);
    }

    return artifact;
  }
}
