export type UpdateAssetProps = {
  locationId?: string;
  ownerId?: string | null;
  serialNumber?: string | null;
  notes?: string | null;
};

export class UpdateAssetCommand {
  constructor(
    public readonly tenantId: string,
    public readonly assetId: string,
    public readonly patch: UpdateAssetProps,
  ) {}
}
