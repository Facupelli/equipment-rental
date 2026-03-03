import { Invitation as PrismaInvitation, Prisma } from 'src/generated/prisma/client';
import { Invitation } from 'src/modules/users/domain/entities/invitation.entity';

export class InvitationMapper {
  static toDomain(raw: PrismaInvitation): Invitation {
    return Invitation.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      email: raw.email,
      roleId: raw.roleId,
      locationId: raw.locationId,
      tokenHash: raw.tokenHash,
      expiresAt: raw.expiresAt,
      acceptedAt: raw.acceptedAt,
    });
  }

  static toPersistence(entity: Invitation): Prisma.InvitationUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      email: entity.email,
      roleId: entity.roleId,
      locationId: entity.locationId,
      tokenHash: entity.hash,
      expiresAt: entity.expiresAt,
      acceptedAt: entity.acceptedOn,
    };
  }
}
