export class GetAssetByIdQuery {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
  ) {}
}
