import { randomUUID } from 'crypto';
import { Money } from '../value-objects/money.vo';
import { PriceBreakdown } from '../value-objects/price-breakdown.vo';

export interface CreateOrderBundleProps {
  tenantId: string;
  bundleId: string;
  bundlePrice: Money;
  priceBreakdown: PriceBreakdown;
}

export interface ReconstituteOrderBundleProps {
  id: string;
  tenantId: string;
  orderId: string;
  bundleId: string;
  bundlePrice: Money;
  priceBreakdown: PriceBreakdown;
}

/**
 * OrderBundle child entity.
 *
 * Represents one bundle booked within an Order. Stores the actual charge
 * for the bundle (bundlePrice) as computed by PricingEngine.calculateForBundle().
 *
 * This is what drives grandTotal — not the individual BookingItem.unitPrice
 * values of bundle components, which are display-only (the "original" price
 * shown crossed out in the UI).
 *
 * Owned by the Order aggregate root. orderId is assigned after construction
 * via assignOrderId(), mirroring the BookingItem pattern.
 */
export class OrderBundle {
  readonly id: string;
  readonly tenantId: string;
  readonly bundleId: string;
  readonly bundlePrice: Money;
  readonly priceBreakdown: PriceBreakdown;

  private _orderId: string;

  private constructor(
    id: string,
    orderId: string,
    tenantId: string,
    bundleId: string,
    bundlePrice: Money,
    priceBreakdown: PriceBreakdown,
  ) {
    this.id = id;
    this.tenantId = tenantId;
    this.bundleId = bundleId;
    this.bundlePrice = bundlePrice;
    this.priceBreakdown = priceBreakdown;
    this._orderId = orderId;
  }

  static create(props: CreateOrderBundleProps): OrderBundle {
    return new OrderBundle(
      randomUUID(),
      '', // orderId assigned by Order aggregate root after construction
      props.tenantId,
      props.bundleId,
      props.bundlePrice,
      props.priceBreakdown,
    );
  }

  static reconstitute(props: ReconstituteOrderBundleProps): OrderBundle {
    return new OrderBundle(
      props.id,
      props.orderId,
      props.tenantId,
      props.bundleId,
      props.bundlePrice,
      props.priceBreakdown,
    );
  }

  get orderId(): string {
    return this._orderId;
  }

  /** Called by the Order aggregate root to bind this bundle to its parent. */
  assignOrderId(orderId: string): void {
    this._orderId = orderId;
  }
}
