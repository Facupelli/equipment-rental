export class DeleteProductCategoryCommand {
  constructor(
    public readonly tenantId: string,
    public readonly productCategoryId: string,
  ) {}
}
