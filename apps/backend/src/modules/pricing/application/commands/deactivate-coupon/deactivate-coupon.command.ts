export class DeactivateCouponCommand {
  constructor(
    public readonly tenantId: string,
    public readonly couponId: string,
  ) {}
}
