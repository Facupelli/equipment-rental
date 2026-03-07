export interface CreateBundleComponentProps {
  productTypeId: string;
  quantity: number;
}

export class CreateBundleCommand {
  constructor(
    public readonly billingUnitId: string,
    public readonly name: string,
    public readonly components: CreateBundleComponentProps[],
  ) {}
}
