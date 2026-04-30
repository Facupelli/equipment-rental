import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SigningArtifactKind } from 'src/generated/prisma/client';
import { SigningArtifactMetadata } from 'src/modules/document-signing/domain/entities/signing-artifact-metadata.entity';
import { SigningSession } from 'src/modules/document-signing/domain/entities/signing-session.entity';
import { UnsignedSigningArtifactNotFoundError } from 'src/modules/document-signing/domain/errors/document-signing.errors';

import { PublicSigningSessionLoader } from '../../public-signing-session.loader';
import { PublicSigningSessionReadModel } from './get-public-signing-session.contract';
import { GetPublicSigningSessionQuery } from './get-public-signing-session.query';

@QueryHandler(GetPublicSigningSessionQuery)
export class GetPublicSigningSessionQueryHandler implements IQueryHandler<
  GetPublicSigningSessionQuery,
  PublicSigningSessionReadModel
> {
  constructor(private readonly publicSigningSessionLoader: PublicSigningSessionLoader) {}

  async execute(query: GetPublicSigningSessionQuery): Promise<PublicSigningSessionReadModel> {
    const session = await this.publicSigningSessionLoader.loadRequiredPublicSession(query.rawToken);
    const artifact = this.requireUnsignedArtifact(session);

    return {
      sessionId: session.id,
      documentType: session.documentType,
      status: session.currentStatus,
      expiresAt: session.expiresAt,
      openedAt: session.openedOn,
      document: {
        artifactId: artifact.id,
        kind: SigningArtifactKind.UNSIGNED_PDF,
        documentNumber: artifact.documentNumber,
        displayFileName: artifact.displayFileName,
        contentType: artifact.storage.contentType,
        byteSize: artifact.storage.byteSize,
        sha256: artifact.storage.sha256,
      },
      prefilledSigner: {
        fullName: session.currentDeclaredFullName,
        documentNumber: session.currentDeclaredDocumentNumber,
      },
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
