import { randomUUID } from 'node:crypto';

export interface PricingTierProps {
  id: string;
  tenantId: string;
  productId: string | null;
  inventoryItemId: string | null;
  minDays: number; // Stored as number in Domain (converted from Decimal)
  maxDays: number | null; // Null represents infinity
  pricePerDay: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePricingTierProps = Omit<PricingTierProps, 'id' | 'createdAt' | 'updatedAt'>;

export class PricingTier {
  private readonly id: string;
  private readonly tenantId: string;

  private _productId: string | null;
  private _inventoryItemId: string | null;

  private _minDays: number;
  private _maxDays: number | null;
  private _pricePerDay: number;

  private readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PricingTierProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this._productId = props.productId;
    this._inventoryItemId = props.inventoryItemId;
    this._minDays = props.minDays;
    this._maxDays = props.maxDays;
    this._pricePerDay = props.pricePerDay;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(props: CreatePricingTierProps): PricingTier {
    const id = randomUUID();
    const now = new Date();

    // Invariant: Tier must belong to a scope (Product, Item, or Global/Tenant-level)
    if (!props.productId && !props.inventoryItemId) {
      throw new Error('Pricing tier must be associated with a product or inventory item.');
    }

    // Invariant: Max days must be greater than min days (if not infinite)
    if (props.maxDays !== null && props.maxDays <= props.minDays) {
      throw new Error('Max days must be greater than min days.');
    }

    // Invariant: Price cannot be negative
    if (props.pricePerDay < 0) {
      throw new Error('Price per day cannot be negative.');
    }

    // Invariant: Min days cannot be negative
    if (props.minDays < 0) {
      throw new Error('Min days cannot be negative.');
    }

    return new PricingTier({
      id,
      ...props,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: PricingTierProps): PricingTier {
    return new PricingTier(props);
  }

  // --- Behaviors ---
  public updatePrice(newPrice: number): void {
    if (newPrice < 0) throw new Error('Price cannot be negative.');
    this._pricePerDay = newPrice;
    this._updatedAt = new Date();
  }

  public updateDurationRange(minDays: number, maxDays: number | null): void {
    if (maxDays !== null && maxDays <= minDays) {
      throw new Error('Max days must be greater than min days.');
    }
    this._minDays = minDays;
    this._maxDays = maxDays;
    this._updatedAt = new Date();
  }

  // --- Getters ---
  get Id(): string {
    return this.id;
  }
  get TenantId(): string {
    return this.tenantId;
  }
  get ProductId(): string | null {
    return this._productId;
  }
  get InventoryItemId(): string | null {
    return this._inventoryItemId;
  }
  get MinDays(): number {
    return this._minDays;
  }
  get MaxDays(): number | null {
    return this._maxDays;
  }
  get PricePerDay(): number {
    return this._pricePerDay;
  }
  get CreatedAt(): Date {
    return this.createdAt;
  }
  get UpdatedAt(): Date {
    return this._updatedAt;
  }
}
