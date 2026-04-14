export class FindActiveOwnerContractForScopeQuery {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly assetId: string,
    public readonly date: Date,
  ) {}
}

export interface ActiveOwnerContractReadModel {
  contractId: string;
  ownerId: string;
  ownerShare: string;
  rentalShare: string;
  basis: string;
}
