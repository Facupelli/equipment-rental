import { randomUUID } from 'crypto';

import { SigningArtifactKind } from 'src/generated/prisma/client';

import { SigningArtifactStorage } from '../value-objects/signing-artifact-storage.value-object';

export interface CreateSigningArtifactMetadataProps {
  sessionId: string;
  kind: SigningArtifactKind;
  documentNumber: string;
  displayFileName: string;
  storage: SigningArtifactStorage;
}

export interface ReconstituteSigningArtifactMetadataProps extends CreateSigningArtifactMetadataProps {
  id: string;
  createdAt: Date;
}

export class SigningArtifactMetadata {
  private constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly kind: SigningArtifactKind,
    public readonly documentNumber: string,
    public readonly displayFileName: string,
    public readonly storage: SigningArtifactStorage,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateSigningArtifactMetadataProps): SigningArtifactMetadata {
    return new SigningArtifactMetadata(
      randomUUID(),
      props.sessionId,
      props.kind,
      props.documentNumber.trim(),
      props.displayFileName.trim(),
      props.storage,
      new Date(),
    );
  }

  static reconstitute(props: ReconstituteSigningArtifactMetadataProps): SigningArtifactMetadata {
    return new SigningArtifactMetadata(
      props.id,
      props.sessionId,
      props.kind,
      props.documentNumber.trim(),
      props.displayFileName.trim(),
      props.storage,
      props.createdAt,
    );
  }
}
