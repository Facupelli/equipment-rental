import { OwnerContract as PrismaOwnerContract, Prisma } from 'src/generated/prisma/client';
import Decimal from 'decimal.js';
import { OwnerContract } from '../../../domain/entities/owner-contract.entity';
import { ShareSplit } from '../../../domain/value-objects/share-split.vo';

export class OwnerContractMapper {
  static toDomain(raw: PrismaOwnerContract): OwnerContract {
    return OwnerContract.reconstitute({
      id: raw.id,
      tenantId: raw.tenantId,
      ownerId: raw.ownerId,
      assetId: raw.assetId,
      shares: new ShareSplit(new Decimal(raw.ownerShare.toString()), new Decimal(raw.rentalShare.toString())),
      basis: raw.basis,
      validFrom: raw.validFrom,
      validUntil: raw.validUntil,
      notes: raw.notes,
      isActive: raw.isActive,
    });
  }

  static toPersistence(entity: OwnerContract): Prisma.OwnerContractUncheckedCreateInput {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      ownerId: entity.ownerId,
      assetId: entity.assetId,
      ownerShare: entity.ownerShare,
      rentalShare: entity.rentalShare,
      basis: entity.basis,
      validFrom: entity.validFrom,
      validUntil: entity.validUntil,
      notes: entity.notes,
      isActive: entity.isActive,
    };
  }
}
