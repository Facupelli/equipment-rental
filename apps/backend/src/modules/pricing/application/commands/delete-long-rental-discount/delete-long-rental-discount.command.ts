export class DeleteLongRentalDiscountCommand {
  constructor(
    public readonly tenantId: string,
    public readonly longRentalDiscountId: string,
  ) {}
}
