export class ActivateLongRentalDiscountCommand {
  constructor(
    public readonly tenantId: string,
    public readonly longRentalDiscountId: string,
  ) {}
}
