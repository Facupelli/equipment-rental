import { DomainException } from 'src/core/exceptions/domain.exception';

export interface SigningArtifactStorageProps {
  bucket: string;
  objectKey: string;
  contentType: string;
  byteSize: number;
  sha256: string;
}

export class SigningArtifactStorage {
  public readonly bucket: string;
  public readonly objectKey: string;
  public readonly contentType: string;
  public readonly byteSize: number;
  public readonly sha256: string;

  constructor(props: SigningArtifactStorageProps) {
    this.bucket = SigningArtifactStorage.assertNonEmpty('bucket', props.bucket);
    this.objectKey = SigningArtifactStorage.assertNonEmpty('objectKey', props.objectKey);
    this.contentType = SigningArtifactStorage.assertNonEmpty('contentType', props.contentType);
    this.sha256 = SigningArtifactStorage.assertNonEmpty('sha256', props.sha256);

    if (!Number.isInteger(props.byteSize) || props.byteSize < 0) {
      throw new DomainException('SigningArtifactStorage byteSize must be a non-negative integer.');
    }

    this.byteSize = props.byteSize;
  }

  equals(other: SigningArtifactStorage): boolean {
    return (
      this.bucket === other.bucket &&
      this.objectKey === other.objectKey &&
      this.contentType === other.contentType &&
      this.byteSize === other.byteSize &&
      this.sha256 === other.sha256
    );
  }

  toJSON(): SigningArtifactStorageProps {
    return {
      bucket: this.bucket,
      objectKey: this.objectKey,
      contentType: this.contentType,
      byteSize: this.byteSize,
      sha256: this.sha256,
    };
  }

  private static assertNonEmpty(name: string, value: string): string {
    const normalized = value.trim();

    if (normalized.length === 0) {
      throw new DomainException(`SigningArtifactStorage ${name} cannot be empty.`);
    }

    return normalized;
  }
}
