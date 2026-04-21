import { randomUUID } from 'crypto';

import { ActorType } from '@repo/types';
import { err, ok, Result } from 'neverthrow';
import { DomainException } from 'src/core/exceptions/domain.exception';

import { AuthHandoffTokenAlreadyUsedError, AuthHandoffTokenExpiredError } from '../errors/auth.errors';

export interface CreateAuthHandoffTokenProps {
  tokenHash: string;
  tenantId: string;
  actorType: ActorType;
  actorId: string;
  expiresAt: Date;
}

export interface ReconstituteAuthHandoffTokenProps {
  id: string;
  tokenHash: string;
  tenantId: string;
  actorType: ActorType;
  actorId: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
}

export class AuthHandoffToken {
  private constructor(
    public readonly id: string,
    private readonly tokenHash: string,
    public readonly tenantId: string,
    public readonly actorType: ActorType,
    public readonly actorId: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    private usedAt: Date | null,
  ) {}

  static create(props: CreateAuthHandoffTokenProps): AuthHandoffToken {
    AuthHandoffToken.assertNonEmpty('tokenHash', props.tokenHash);
    AuthHandoffToken.assertNonEmpty('tenantId', props.tenantId);
    AuthHandoffToken.assertNonEmpty('actorId', props.actorId);

    const now = new Date();

    return new AuthHandoffToken(
      randomUUID(),
      props.tokenHash,
      props.tenantId,
      props.actorType,
      props.actorId,
      props.expiresAt,
      now,
      null,
    );
  }

  static reconstitute(props: ReconstituteAuthHandoffTokenProps): AuthHandoffToken {
    AuthHandoffToken.assertNonEmpty('tokenHash', props.tokenHash);
    AuthHandoffToken.assertNonEmpty('tenantId', props.tenantId);
    AuthHandoffToken.assertNonEmpty('actorId', props.actorId);

    return new AuthHandoffToken(
      props.id,
      props.tokenHash,
      props.tenantId,
      props.actorType,
      props.actorId,
      props.expiresAt,
      props.createdAt,
      props.usedAt,
    );
  }

  get currentTokenHash(): string {
    return this.tokenHash;
  }

  get usedOn(): Date | null {
    return this.usedAt;
  }

  use(now = new Date()): Result<void, AuthHandoffTokenAlreadyUsedError | AuthHandoffTokenExpiredError> {
    if (this.usedAt !== null) {
      return err(new AuthHandoffTokenAlreadyUsedError(this.id));
    }

    if (now > this.expiresAt) {
      return err(new AuthHandoffTokenExpiredError(this.id));
    }

    this.usedAt = now;
    return ok(undefined);
  }

  private static assertNonEmpty(name: string, value: string): void {
    if (value.trim().length === 0) {
      throw new DomainException(`AuthHandoffToken ${name} cannot be empty.`);
    }
  }
}
