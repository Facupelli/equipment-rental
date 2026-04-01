export class SoftDeleteAssetCommand {
  constructor(
    public readonly tenantId: string,
    public readonly assetId: string,
  ) {}
}
