export class DeactivateLongRentalDiscountCommand {
  constructor(
    public readonly tenantId: string,
    public readonly longRentalDiscountId: string,
  ) {}
}
