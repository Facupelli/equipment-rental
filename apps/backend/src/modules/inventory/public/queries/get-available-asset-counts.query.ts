export class GetAvailableAssetCountsQuery {
  constructor(
    public readonly locationId: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly productTypeIds: string[],
  ) {}
}

export type AvailableAssetCountReadModel = {
  productTypeId: string;
  availableCount: number;
};
