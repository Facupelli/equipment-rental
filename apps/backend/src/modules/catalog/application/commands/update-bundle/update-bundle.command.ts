export interface UpdateBundleComponentProps {
  productTypeId: string;
  quantity: number;
}

export type UpdateBundleProps = {
  billingUnitId?: string;
  name?: string;
  imageUrl?: string | null;
  description?: string | null;
  components?: UpdateBundleComponentProps[];
};

export class UpdateBundleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly bundleId: string,
    public readonly patch: UpdateBundleProps,
  ) {}
}
