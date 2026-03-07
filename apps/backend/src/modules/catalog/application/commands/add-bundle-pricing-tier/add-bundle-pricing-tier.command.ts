export class AddBundlePricingTierCommand {
  constructor(
    public readonly bundleId: string,
    public readonly locationId: string | null,
    public readonly fromUnit: number,
    public readonly toUnit: number | null,
    public readonly pricePerUnit: string,
  ) {}
}
