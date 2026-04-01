export class ActivateCouponCommand {
  constructor(
    public readonly tenantId: string,
    public readonly couponId: string,
  ) {}
}
