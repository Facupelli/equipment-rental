export class PublishProductTypeCommand {
  constructor(
    public readonly tenantId: string,
    public readonly productTypeId: string,
  ) {}
}
