export class CreateProductCategoryCommand {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string | null,
  ) {}
}
