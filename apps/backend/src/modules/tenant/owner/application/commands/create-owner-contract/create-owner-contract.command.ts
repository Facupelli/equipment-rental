import { ContractBasis } from 'src/generated/prisma/client';

export class CreateOwnerContractCommand {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly assetId: string | null,
    public readonly ownerShare: number,
    public readonly rentalShare: number,
    public readonly basis: ContractBasis,
    public readonly validFrom: Date,
    public readonly validUntil: Date | null,
    public readonly notes: string | null,
  ) {}
}
