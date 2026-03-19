export class FindActiveContractForScopeQuery {
  constructor(
    public readonly tenantId: string,
    public readonly ownerId: string,
    public readonly assetId: string,
    public readonly date: Date,
  ) {}
}

export interface ActiveContractDto {
  contractId: string;
  ownerId: string;
  ownerShare: string; // Decimal serialized as string to cross module boundaries safely
  rentalShare: string;
  basis: string;
}
