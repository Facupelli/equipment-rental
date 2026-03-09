export interface CreateBundleComponentProps {
  productTypeId: string;
  quantity: number;
}

export class CreateBundleCommand {
  constructor(
    public readonly billingUnitId: string,
    public readonly name: string,
    public readonly isActive: boolean,
    public readonly components: CreateBundleComponentProps[],
    public readonly description: string | null = null,
  ) {}
}
