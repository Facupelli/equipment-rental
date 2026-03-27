export class RetireBundleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly bundleId: string,
  ) {}
}
