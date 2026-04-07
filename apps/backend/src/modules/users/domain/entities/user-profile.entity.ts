import { randomUUID } from 'crypto';

export interface CreateUserProfileProps {
  userId: string;
  fullName: string;
  documentNumber: string;
  phone: string;
  address: string;
  signUrl: string;
}

export interface UpdateUserProfileProps {
  fullName?: string;
  documentNumber?: string;
  phone?: string;
  address?: string;
  signUrl?: string;
}

export interface ReconstituteUserProfileProps extends CreateUserProfileProps {
  id: string;
}

function normalizeRequired(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`UserProfile ${fieldName} cannot be empty.`);
  }

  return normalized;
}

export class UserProfile {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    private fullName: string,
    private documentNumber: string,
    private phone: string,
    private address: string,
    private signUrl: string,
  ) {}

  static create(props: CreateUserProfileProps): UserProfile {
    return new UserProfile(
      randomUUID(),
      props.userId,
      normalizeRequired(props.fullName, 'fullName'),
      normalizeRequired(props.documentNumber, 'documentNumber'),
      normalizeRequired(props.phone, 'phone'),
      normalizeRequired(props.address, 'address'),
      normalizeRequired(props.signUrl, 'signUrl'),
    );
  }

  static reconstitute(props: ReconstituteUserProfileProps): UserProfile {
    return new UserProfile(
      props.id,
      props.userId,
      props.fullName,
      props.documentNumber,
      props.phone,
      props.address,
      props.signUrl,
    );
  }

  get currentFullName(): string {
    return this.fullName;
  }

  get currentDocumentNumber(): string {
    return this.documentNumber;
  }

  get currentPhone(): string {
    return this.phone;
  }

  get currentAddress(): string {
    return this.address;
  }

  get currentSignUrl(): string {
    return this.signUrl;
  }

  update(props: UpdateUserProfileProps): void {
    if (props.fullName !== undefined) {
      this.fullName = normalizeRequired(props.fullName, 'fullName');
    }

    if (props.documentNumber !== undefined) {
      this.documentNumber = normalizeRequired(props.documentNumber, 'documentNumber');
    }

    if (props.phone !== undefined) {
      this.phone = normalizeRequired(props.phone, 'phone');
    }

    if (props.address !== undefined) {
      this.address = normalizeRequired(props.address, 'address');
    }

    if (props.signUrl !== undefined) {
      this.signUrl = normalizeRequired(props.signUrl, 'signUrl');
    }
  }
}
