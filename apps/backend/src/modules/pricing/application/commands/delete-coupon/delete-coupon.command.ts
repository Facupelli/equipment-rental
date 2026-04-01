export class DeleteCouponCommand {
  constructor(
    public readonly tenantId: string,
    public readonly couponId: string,
  ) {}
}
