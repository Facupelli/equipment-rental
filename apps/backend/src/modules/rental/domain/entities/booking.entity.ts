import { randomUUID } from 'crypto';
import { Money } from '../value-objects/money.vo';
import { PriceBreakdown } from '../value-objects/price-breakdown.vo';
import {
  InvalidBookingMutualExclusivityException,
  InvalidBookingPriceException,
} from '../../application/exceptions/booking.exceptions';
import { TrackingType } from '@repo/types';

export interface CreateBookingItemProps {
  tenantId: string;
  orderId: string | null;
  productId: string;
  trackingType: TrackingType;
  bundleId: string | null;
  inventoryItemId: string | null;
  quantity: number | null;
  unitPrice: Money;
  priceBreakdown: PriceBreakdown;
  // isExternallySourced: boolean;
}

export interface ReconstituteBookingItemProps extends CreateBookingItemProps {
  id: string;
}

export class BookingItem {
  readonly id: string;
  readonly tenantId: string;
  private _orderId: string | null;
  readonly productId: string;
  readonly bundleId: string | null;

  // inventoryItemId is optional. Null indicates an over-rental.
  readonly inventoryItemId: string | null;
  readonly quantity: number | null;

  readonly unitPrice: Money;
  readonly priceBreakdown: PriceBreakdown;

  private constructor(id: string, props: CreateBookingItemProps) {
    this.id = id;
    this._orderId = props.orderId;
    this.tenantId = props.tenantId;
    this.productId = props.productId;
    this.bundleId = props.bundleId;
    this.inventoryItemId = props.inventoryItemId;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.priceBreakdown = props.priceBreakdown;
  }

  assignOrderId(id: string): void {
    this._orderId = id;
  }

  static create(props: CreateBookingItemProps): BookingItem {
    BookingItem.assertInvariants(props);

    return new BookingItem(randomUUID(), props);
  }

  static reconstitute(props: ReconstituteBookingItemProps): BookingItem {
    return new BookingItem(props.id, props);
  }

  private static assertInvariants(props: CreateBookingItemProps): void {
    const hasProduct = props.productId !== null;

    if (!hasProduct) {
      throw new Error('A BookingLineItem must have a productId.');
    }

    if (props.quantity !== null && props.quantity <= 0) {
      throw new Error(`Quantity must be a positive integer. Received: ${props.quantity}`);
    }

    if (props.unitPrice.amount.isNegative()) {
      throw new InvalidBookingPriceException();
    }

    const isSerialized = props.trackingType === TrackingType.SERIALIZED;
    const isBulk = props.trackingType === TrackingType.BULK;

    if (isSerialized && (!props.inventoryItemId || props.quantity != null)) {
      throw new InvalidBookingMutualExclusivityException();
    }

    if (isBulk && (props.inventoryItemId != null || !props.quantity || props.quantity <= 0)) {
      throw new InvalidBookingMutualExclusivityException();
    }

    if (!isSerialized && !isBulk) {
      throw new Error('Invalid TrackingType provided');
    }

    // if (props.isExternallySourced && props.ownerId !== null) {
    //   throw new Error(
    //     'An externally sourced item cannot have an ownerId. ' + 'External items are excluded from payout calculations.',
    //   );
    // }
  }

  // get isOverRental(): boolean {
  //   return this.inventoryItemId === null;
  // }

  get orderId(): string {
    if (!this._orderId) {
      throw new Error('BookingLineItem is not assigned to a Booking.');
    }
    return this._orderId;
  }
}
