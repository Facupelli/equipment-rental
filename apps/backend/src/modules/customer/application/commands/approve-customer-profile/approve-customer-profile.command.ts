export class ApproveCustomerProfileCommand {
  constructor(
    public readonly tenantId: string,
    public readonly customerProfileId: string,
    public readonly reviewedById: string,
  ) {}
}
