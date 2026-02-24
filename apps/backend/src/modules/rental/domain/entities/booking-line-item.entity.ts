import { randomUUID } from 'crypto';
import { Money } from '../value-objects/money.vo';
import { PriceBreakdown } from '../value-objects/price-breakdown.vo';

export interface CreateBookingLineItemProps {
  bookingId: string;
  productId: string;
  inventoryItemId: string | null; // Standard rental
  quantityRented: number;
  unitPrice: Money;
  ownerId: string | null; // Snapshot — null if externally sourced
  isExternallySourced: boolean;
  priceBreakdown: PriceBreakdown;
}

export interface ReconstituteBookingLineItemProps extends CreateBookingLineItemProps {
  id: string;
  lineTotal: Money;
}

export class BookingLineItem {
  readonly id: string;
  readonly bookingId: string;
  readonly productId: string;

  // inventoryItemId is optional. Null indicates an over-rental.
  readonly inventoryItemId: string | null;

  readonly quantityRented: number;
  readonly unitPrice: Money; // snapshot
  readonly lineTotal: Money; // snapshot: unitPrice × billableDays × quantity
  readonly ownerId: string | null; // snapshot
  readonly isExternallySourced: boolean;
  readonly priceBreakdown: PriceBreakdown; // snapshot

  private constructor(id: string, props: CreateBookingLineItemProps, lineTotal: Money) {
    this.id = id;
    this.bookingId = props.bookingId;
    this.inventoryItemId = props.inventoryItemId;
    this.productId = props.productId;
    this.quantityRented = props.quantityRented;
    this.unitPrice = props.unitPrice;
    this.lineTotal = lineTotal;
    this.ownerId = props.ownerId;
    this.isExternallySourced = props.isExternallySourced;
    this.priceBreakdown = props.priceBreakdown;
  }

  static create(props: CreateBookingLineItemProps): BookingLineItem {
    BookingLineItem.assertInvariants(props);

    // lineTotal = PriceBreakdown total × quantity
    // The breakdown total is per-unit (one item), so we scale by quantity
    const lineTotal = props.priceBreakdown.total.multiply(props.quantityRented);

    return new BookingLineItem(randomUUID(), props, lineTotal);
  }

  static reconstitute(props: ReconstituteBookingLineItemProps): BookingLineItem {
    return new BookingLineItem(props.id, props, props.lineTotal);
  }

  private static assertInvariants(props: CreateBookingLineItemProps): void {
    const hasItem = props.inventoryItemId !== null;
    const hasProduct = props.productId !== null;

    // XOR: exactly one reference must be set
    if (hasItem === hasProduct) {
      throw new Error(
        'A BookingLineItem must reference either an InventoryItem (standard rental) ' +
          'or a Product (over-rental) — not both and not neither.',
      );
    }

    if (props.quantityRented <= 0) {
      throw new Error(`Quantity rented must be a positive integer. Received: ${props.quantityRented}`);
    }

    if (props.isExternallySourced && props.ownerId !== null) {
      throw new Error(
        'An externally sourced item cannot have an ownerId. ' + 'External items are excluded from payout calculations.',
      );
    }
  }

  get isOverRental(): boolean {
    return this.inventoryItemId === null;
  }
}
