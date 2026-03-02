import { randomUUID } from 'node:crypto';

export interface BundlePricingTierProps {
  id: string;
  tenantId: string;
  bundleId: string;
  billingUnitId: string;
  /** Threshold in natural units — e.g. 4 means "from 4 units of this type onwards". */
  fromUnit: number;
  pricePerUnit: number;
  /** ISO 4217 currency code e.g. "USD", "EUR". */
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateBundlePricingTierProps = Omit<BundlePricingTierProps, 'id' | 'createdAt' | 'updatedAt'>;

export class BundlePricingTier {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _bundleId: string;
  private readonly _billingUnitId: string;
  private _fromUnit: number;
  private _pricePerUnit: number;
  private readonly _currency: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: BundlePricingTierProps) {
    this._id = props.id;
    this._tenantId = props.tenantId;
    this._bundleId = props.bundleId;
    this._billingUnitId = props.billingUnitId;
    this._fromUnit = props.fromUnit;
    this._pricePerUnit = props.pricePerUnit;
    this._currency = props.currency;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreateBundlePricingTierProps): BundlePricingTier {
    BundlePricingTier.assertValidFromUnit(props.fromUnit);
    BundlePricingTier.assertValidPrice(props.pricePerUnit);
    BundlePricingTier.assertValidCurrency(props.currency);

    const now = new Date();
    return new BundlePricingTier({ id: randomUUID(), ...props, createdAt: now, updatedAt: now });
  }

  public static reconstitute(props: BundlePricingTierProps): BundlePricingTier {
    return new BundlePricingTier(props);
  }

  // --- Behavior ---
  public updateRate(pricePerUnit: number): void {
    BundlePricingTier.assertValidPrice(pricePerUnit);
    this._pricePerUnit = pricePerUnit;
    this._updatedAt = new Date();
  }

  public updateThreshold(fromUnit: number): void {
    BundlePricingTier.assertValidFromUnit(fromUnit);
    this._fromUnit = fromUnit;
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get id(): string {
    return this._id;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get bundleId(): string {
    return this._bundleId;
  }
  get billingUnitId(): string {
    return this._billingUnitId;
  }
  get fromUnit(): number {
    return this._fromUnit;
  }
  get pricePerUnit(): number {
    return this._pricePerUnit;
  }
  get currency(): string {
    return this._currency;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // --- Guards ---
  private static assertValidFromUnit(fromUnit: number): void {
    if (fromUnit <= 0) {
      throw new Error(`fromUnit must be positive, received: ${fromUnit}`);
    }
  }

  private static assertValidPrice(pricePerUnit: number): void {
    if (pricePerUnit < 0) {
      throw new Error(`pricePerUnit must be non-negative, received: ${pricePerUnit}`);
    }
  }

  private static assertValidCurrency(currency: string): void {
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error(`currency must be a valid ISO 4217 code (3 uppercase letters), received: "${currency}"`);
    }
  }
}
