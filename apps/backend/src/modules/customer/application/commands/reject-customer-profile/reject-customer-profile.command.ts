export class RejectCustomerProfileCommand {
  constructor(
    public readonly tenantId: string,
    public readonly customerProfileId: string,
    public readonly reviewedById: string,
    public readonly reason: string,
  ) {}
}
