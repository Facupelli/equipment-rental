export class RetireProductTypeCommand {
  constructor(
    public readonly tenantId: string,
    public readonly productTypeId: string,
  ) {}
}
