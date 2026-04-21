import { randomUUID } from 'crypto';

import { ActorType } from '@repo/types';
import { DomainException } from 'src/core/exceptions/domain.exception';

export enum ExternalIdentityProvider {
  GOOGLE = 'GOOGLE',
}

export type ExternalIdentityLinkedActor =
  | { actorType: ActorType.CUSTOMER; actorId: string }
  | { actorType: ActorType.USER; actorId: string };

interface ExternalIdentityProps {
  tenantId: string;
  provider: ExternalIdentityProvider;
  providerSubject: string;
  email: string;
  emailVerified: boolean;
  givenName: string | null;
  familyName: string | null;
  pictureUrl: string | null;
  linkedActor: ExternalIdentityLinkedActor;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExternalIdentityForCustomerProps {
  tenantId: string;
  provider: ExternalIdentityProvider;
  providerSubject: string;
  email: string;
  emailVerified: boolean;
  givenName: string | null;
  familyName: string | null;
  pictureUrl: string | null;
  customerId: string;
}

export interface ReconstituteExternalIdentityProps {
  id: string;
  tenantId: string;
  provider: ExternalIdentityProvider;
  providerSubject: string;
  email: string;
  emailVerified: boolean;
  givenName: string | null;
  familyName: string | null;
  pictureUrl: string | null;
  linkedActor: ExternalIdentityLinkedActor;
  createdAt: Date;
  updatedAt: Date;
}

export class ExternalIdentity {
  private constructor(
    public readonly id: string,
    private readonly props: ExternalIdentityProps,
  ) {}

  static createForCustomer(props: CreateExternalIdentityForCustomerProps): ExternalIdentity {
    ExternalIdentity.assertNonEmpty('tenantId', props.tenantId);
    ExternalIdentity.assertNonEmpty('providerSubject', props.providerSubject);
    ExternalIdentity.assertNonEmpty('email', props.email);
    ExternalIdentity.assertNonEmpty('customerId', props.customerId);

    const now = new Date();

    return new ExternalIdentity(randomUUID(), {
      tenantId: props.tenantId,
      provider: props.provider,
      providerSubject: props.providerSubject,
      email: props.email,
      emailVerified: props.emailVerified,
      givenName: props.givenName,
      familyName: props.familyName,
      pictureUrl: props.pictureUrl,
      linkedActor: {
        actorType: ActorType.CUSTOMER,
        actorId: props.customerId,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ReconstituteExternalIdentityProps): ExternalIdentity {
    ExternalIdentity.assertNonEmpty('tenantId', props.tenantId);
    ExternalIdentity.assertNonEmpty('providerSubject', props.providerSubject);
    ExternalIdentity.assertNonEmpty('email', props.email);
    ExternalIdentity.assertNonEmpty('linkedActor.actorId', props.linkedActor.actorId);

    return new ExternalIdentity(props.id, {
      tenantId: props.tenantId,
      provider: props.provider,
      providerSubject: props.providerSubject,
      email: props.email,
      emailVerified: props.emailVerified,
      givenName: props.givenName,
      familyName: props.familyName,
      pictureUrl: props.pictureUrl,
      linkedActor: props.linkedActor,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  get provider(): ExternalIdentityProvider {
    return this.props.provider;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get providerSubject(): string {
    return this.props.providerSubject;
  }

  get email(): string {
    return this.props.email;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get givenName(): string | null {
    return this.props.givenName;
  }

  get familyName(): string | null {
    return this.props.familyName;
  }

  get pictureUrl(): string | null {
    return this.props.pictureUrl;
  }

  get linkedActor(): ExternalIdentityLinkedActor {
    return this.props.linkedActor;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isLinkedToCustomer(): boolean {
    return this.props.linkedActor.actorType === ActorType.CUSTOMER;
  }

  private static assertNonEmpty(name: string, value: string): void {
    if (value.trim().length === 0) {
      throw new DomainException(`ExternalIdentity ${name} cannot be empty.`);
    }
  }
}
