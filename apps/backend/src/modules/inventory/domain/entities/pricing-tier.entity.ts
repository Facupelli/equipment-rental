import { randomUUID } from 'node:crypto';

export interface PricingTierProps {
  id: string;
  tenantId: string;
  productId: string;
  /** When set, this tier is an item-level override. Null = product-level tier. */
  inventoryItemId: string | null;
  billingUnitId: string;
  /** Threshold in natural units — e.g. 4 means "from 4 units of this type onwards". */
  fromUnit: number;
  pricePerUnit: number;
  /** ISO 4217 currency code e.g. "USD", "EUR". */
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePricingTierProps = Omit<PricingTierProps, 'id' | 'createdAt' | 'updatedAt'>;

export class PricingTier {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _productId: string;
  private readonly _inventoryItemId: string | null;
  private readonly _billingUnitId: string;
  private _fromUnit: number;
  private _pricePerUnit: number;
  private readonly _currency: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PricingTierProps) {
    this._id = props.id;
    this._tenantId = props.tenantId;
    this._productId = props.productId;
    this._inventoryItemId = props.inventoryItemId;
    this._billingUnitId = props.billingUnitId;
    this._fromUnit = props.fromUnit;
    this._pricePerUnit = props.pricePerUnit;
    this._currency = props.currency;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreatePricingTierProps): PricingTier {
    PricingTier.assertValidFromUnit(props.fromUnit);
    PricingTier.assertValidPrice(props.pricePerUnit);
    PricingTier.assertValidCurrency(props.currency);

    const now = new Date();
    return new PricingTier({ id: randomUUID(), ...props, createdAt: now, updatedAt: now });
  }

  public static reconstitute(props: PricingTierProps): PricingTier {
    return new PricingTier(props);
  }

  // --- Behavior ---
  public updateRate(pricePerUnit: number): void {
    PricingTier.assertValidPrice(pricePerUnit);
    this._pricePerUnit = pricePerUnit;
    this._updatedAt = new Date();
  }

  public updateThreshold(fromUnit: number): void {
    PricingTier.assertValidFromUnit(fromUnit);
    this._fromUnit = fromUnit;
    this._updatedAt = new Date();
  }

  /** Whether this tier is an item-level override (scoped to a specific InventoryItem). */
  get isItemOverride(): boolean {
    return this._inventoryItemId !== null;
  }

  // --- Getters ---
  get id(): string {
    return this._id;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get productId(): string {
    return this._productId;
  }
  get inventoryItemId(): string | null {
    return this._inventoryItemId;
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
