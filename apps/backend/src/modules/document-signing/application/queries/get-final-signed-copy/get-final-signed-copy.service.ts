import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';

import { SigningArtifactKind } from 'src/generated/prisma/client';
import { SigningArtifactMetadata } from 'src/modules/document-signing/domain/entities/signing-artifact-metadata.entity';
import { SigningSession } from 'src/modules/document-signing/domain/entities/signing-session.entity';
import {
  FinalCopyAccessTokenAlreadyUsedError,
  FinalCopyAccessTokenExpiredError,
  FinalCopyAccessTokenNotFoundError,
  SignedSigningArtifactNotFoundError,
} from 'src/modules/document-signing/domain/errors/document-signing.errors';
import { SigningSessionRepository } from 'src/modules/document-signing/infrastructure/persistence/repositories/signing-session.repository';
import { ObjectStoragePort } from 'src/modules/object-storage/application/ports/object-storage.port';

import { PublicSigningDocumentStream } from '../../document-signing-public-document-stream.contract';

@Injectable()
export class GetFinalSignedCopyService {
  constructor(
    private readonly signingSessionRepository: SigningSessionRepository,
    private readonly objectStorage: ObjectStoragePort,
  ) {}

  async download(rawToken: string): Promise<PublicSigningDocumentStream> {
    const normalizedToken = rawToken.trim();
    if (normalizedToken.length === 0) {
      throw new FinalCopyAccessTokenNotFoundError();
    }

    const session = await this.signingSessionRepository.loadByFinalCopyTokenHash(hashString(normalizedToken));
    if (!session || !session.currentFinalCopyTokenHash) {
      throw new FinalCopyAccessTokenNotFoundError();
    }

    const now = new Date();
    if (session.currentFinalCopyUsedAt) {
      throw new FinalCopyAccessTokenAlreadyUsedError(session.id);
    }

    if (!session.currentFinalCopyExpiresAt || session.currentFinalCopyExpiresAt.getTime() <= now.getTime()) {
      throw new FinalCopyAccessTokenExpiredError(session.id);
    }

    const artifact = this.requireSignedArtifact(session);
    const stream = await this.objectStorage.getObjectStream({ key: artifact.storage.objectKey });

    session.markFinalCopyAccessUsed(now);
    await this.signingSessionRepository.save(session);

    return {
      fileName: artifact.displayFileName,
      contentType: artifact.storage.contentType,
      contentLength: artifact.storage.byteSize,
      stream,
    };
  }

  private requireSignedArtifact(session: SigningSession): SigningArtifactMetadata {
    const artifact = session.getArtifacts().find((candidate) => candidate.kind === SigningArtifactKind.SIGNED_PDF);
    if (!artifact) {
      throw new SignedSigningArtifactNotFoundError(session.id);
    }

    return artifact;
  }
}

function hashString(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
