export class UpdateCouponCommand {
  constructor(
    public readonly tenantId: string,
    public readonly couponId: string,
    public readonly promotionId: string,
    public readonly code: string,
    public readonly maxUses: number | undefined,
    public readonly maxUsesPerCustomer: number | undefined,
    public readonly restrictedToCustomerId: string | undefined,
    public readonly validFrom: Date | undefined,
    public readonly validUntil: Date | undefined,
  ) {}
}
