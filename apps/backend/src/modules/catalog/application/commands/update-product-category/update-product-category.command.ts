export class UpdateProductCategoryCommand {
  constructor(
    public readonly tenantId: string,
    public readonly productCategoryId: string,
    public readonly patch: {
      name?: string;
      description?: string | null;
    },
  ) {}
}
