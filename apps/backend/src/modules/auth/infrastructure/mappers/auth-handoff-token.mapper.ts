import { AuthHandoffToken as PrismaAuthHandoffToken, Prisma } from 'src/generated/prisma/client';

import { AuthHandoffToken } from '../../domain/entities/auth-handoff-token.entity';
import { ActorType } from '@repo/types';

export class AuthHandoffTokenMapper {
  static toDomain(record: PrismaAuthHandoffToken): AuthHandoffToken {
    return AuthHandoffToken.reconstitute({
      id: record.id,
      tokenHash: record.tokenHash,
      tenantId: record.tenantId,
      actorType: record.actorType as ActorType,
      actorId: record.actorId,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      usedAt: record.usedAt,
    });
  }

  static toPersistence(entity: AuthHandoffToken): Prisma.AuthHandoffTokenUncheckedCreateInput {
    return {
      id: entity.id,
      tokenHash: entity.currentTokenHash,
      tenantId: entity.tenantId,
      actorType: entity.actorType,
      actorId: entity.actorId,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      usedAt: entity.usedOn,
    };
  }

  static toUpdatePersistence(entity: AuthHandoffToken): Prisma.AuthHandoffTokenUncheckedUpdateInput {
    return {
      tokenHash: entity.currentTokenHash,
      tenantId: entity.tenantId,
      actorType: entity.actorType,
      actorId: entity.actorId,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
      usedAt: entity.usedOn,
    };
  }
}
