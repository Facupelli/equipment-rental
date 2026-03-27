export class GetBundleByIdQuery {
  constructor(
    public readonly tenantId: string,
    public readonly bundleId: string,
  ) {}
}
