import { randomUUID } from 'crypto';
import { err, ok, Result } from 'neverthrow';
import { InvitationAlreadyAcceptedError, InvitationExpiredError } from '../errors/users.errors';

export interface CreateInvitationProps {
  tenantId: string;
  email: string;
  roleId: string;
  locationId?: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface ReconstituteInvitationProps {
  id: string;
  tenantId: string;
  email: string;
  roleId: string;
  locationId: string | null;
  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
}

export class Invitation {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly roleId: string,
    public readonly locationId: string | null,
    private readonly tokenHash: string,
    public readonly expiresAt: Date,
    private acceptedAt: Date | null,
  ) {}

  static create(props: CreateInvitationProps): Invitation {
    return new Invitation(
      randomUUID(),
      props.tenantId,
      props.email,
      props.roleId,
      props.locationId ?? null,
      props.tokenHash,
      props.expiresAt,
      null,
    );
  }

  static reconstitute(props: ReconstituteInvitationProps): Invitation {
    return new Invitation(
      props.id,
      props.tenantId,
      props.email,
      props.roleId,
      props.locationId,
      props.tokenHash,
      props.expiresAt,
      props.acceptedAt,
    );
  }

  get hash(): string {
    return this.tokenHash;
  }

  get acceptedOn(): Date | null {
    return this.acceptedAt;
  }

  get isAccepted(): boolean {
    return this.acceptedAt !== null;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  accept(): Result<void, InvitationAlreadyAcceptedError | InvitationExpiredError> {
    if (this.isAccepted) {
      return err(new InvitationAlreadyAcceptedError(this.id));
    }
    if (this.isExpired()) {
      return err(new InvitationExpiredError(this.id));
    }
    this.acceptedAt = new Date();
    return ok(undefined);
  }
}
