import {
  ExternalIdentity as PrismaExternalIdentity,
  ExternalIdentityProvider as PrismaExternalIdentityProvider,
  Prisma,
} from 'src/generated/prisma/client';
import { ActorType } from '@repo/types';
import { DomainException } from 'src/core/exceptions/domain.exception';

import {
  ExternalIdentity,
  ExternalIdentityProvider,
  ExternalIdentityLinkedActor,
} from '../../domain/entities/external-identity.entity';

export class ExternalIdentityMapper {
  static toDomain(record: PrismaExternalIdentity): ExternalIdentity {
    return ExternalIdentity.reconstitute({
      id: record.id,
      tenantId: record.tenantId,
      provider: record.provider as ExternalIdentityProvider,
      providerSubject: record.providerSubject,
      email: record.email,
      emailVerified: record.emailVerified,
      givenName: record.givenName,
      familyName: record.familyName,
      pictureUrl: record.pictureUrl,
      linkedActor: ExternalIdentityMapper.toLinkedActor(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(entity: ExternalIdentity): Prisma.ExternalIdentityUncheckedCreateInput {
    const linkedActor = entity.linkedActor;

    return {
      id: entity.id,
      tenantId: entity.tenantId,
      provider: entity.provider as PrismaExternalIdentityProvider,
      providerSubject: entity.providerSubject,
      email: entity.email,
      emailVerified: entity.emailVerified,
      givenName: entity.givenName,
      familyName: entity.familyName,
      pictureUrl: entity.pictureUrl,
      customerId: linkedActor.actorType === ActorType.CUSTOMER ? linkedActor.actorId : null,
      userId: linkedActor.actorType === ActorType.USER ? linkedActor.actorId : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toUpdatePersistence(entity: ExternalIdentity): Prisma.ExternalIdentityUncheckedUpdateInput {
    const linkedActor = entity.linkedActor;

    return {
      tenantId: entity.tenantId,
      provider: entity.provider as PrismaExternalIdentityProvider,
      providerSubject: entity.providerSubject,
      email: entity.email,
      emailVerified: entity.emailVerified,
      givenName: entity.givenName,
      familyName: entity.familyName,
      pictureUrl: entity.pictureUrl,
      customerId: linkedActor.actorType === ActorType.CUSTOMER ? linkedActor.actorId : null,
      userId: linkedActor.actorType === ActorType.USER ? linkedActor.actorId : null,
      updatedAt: entity.updatedAt,
    };
  }

  private static toLinkedActor(record: PrismaExternalIdentity): ExternalIdentityLinkedActor {
    if (record.customerId && !record.userId) {
      return { actorType: ActorType.CUSTOMER, actorId: record.customerId };
    }

    if (record.userId && !record.customerId) {
      return { actorType: ActorType.USER, actorId: record.userId };
    }

    throw new DomainException(`ExternalIdentity '${record.id}' must be linked to exactly one actor.`);
  }
}
