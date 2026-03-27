export class PublishBundleCommand {
  constructor(
    public readonly tenantId: string,
    public readonly bundleId: string,
  ) {}
}
