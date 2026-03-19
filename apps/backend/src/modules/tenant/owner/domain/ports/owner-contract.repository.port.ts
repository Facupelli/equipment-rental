import { OwnerContract } from '../entities/owner-contract.entity';

export abstract class OwnerContractRepositoryPort {
  abstract load(id: string): Promise<OwnerContract | null>;
  abstract save(contract: OwnerContract): Promise<string>;
  abstract hasOverlappingContract(
    tenantId: string,
    ownerId: string,
    assetId: string | null,
    validFrom: Date,
    validUntil: Date | null,
  ): Promise<boolean>;
}
