export interface CreateBundleComponentProps {
  productTypeId: string;
  quantity: number;
}

export class CreateBundleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly billingUnitId: string,
    public readonly name: string,
    public readonly imageUrl: string | null,
    public readonly components: CreateBundleComponentProps[],
    public readonly description: string | null = null,
  ) {}
}
