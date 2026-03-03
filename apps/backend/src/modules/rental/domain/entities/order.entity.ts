import { randomUUID } from 'crypto';
import { Money } from '../value-objects/money.vo';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { BookingStatus } from '@repo/types';
import { BookingItem } from './booking.entity';
import { OrderBundle } from './order-bundle.entity';

export interface CreateOrderProps {
  tenantId: string;
  customerId: string;
  bookingRange: DateRange;
  bookings: BookingItem[];
  orderBundles: OrderBundle[];
  currency: string;
  notes?: string;
}

export interface ReconstituteOrderProps {
  id: string;
  tenantId: string;
  customerId: string;
  bookingRange: DateRange;
  status: BookingStatus;
  notes?: string;
  bookings: BookingItem[];
  orderBundles: OrderBundle[];
  subtotal: Money;
  totalDiscount: Money;
  totalTax: Money;
  grandTotal: Money;
  createdAt: Date;
  updatedAt: Date;
}

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING_CONFIRMATION]: [BookingStatus.RESERVED, BookingStatus.CANCELLED],
  [BookingStatus.RESERVED]: [BookingStatus.ACTIVE, BookingStatus.CANCELLED],
  [BookingStatus.ACTIVE]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

/**
 * Order Aggregate Root
 *
 * Owns BookingItem and OrderBundle children and enforces all order invariants:
 *  - Must have at least one booking line item.
 *  - State transitions follow a strict machine (see VALID_TRANSITIONS).
 *  - grandTotal is always derived from children — never set externally.
 *
 * grandTotal formula:
 *   subtotal = SUM(standalone booking unitPrices) + SUM(orderBundle bundlePrices)
 *   grandTotal = subtotal - totalDiscount + totalTax
 *
 * Bundle booking BookingItem.unitPrice is the standalone component price shown
 * crossed-out in the UI. It does NOT participate in grandTotal — only
 * OrderBundle.bundlePrice does.
 */
export class Order {
  readonly id: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly bookingRange: DateRange;
  readonly createdAt: Date;

  private _isNew: boolean;
  private _status: BookingStatus;
  private _bookings: BookingItem[];
  private _orderBundles: OrderBundle[];
  private _notes?: string;

  private _subtotal: Money;
  private _totalDiscount: Money;
  private _totalTax: Money;
  private _grandTotal: Money;
  private _updatedAt: Date;

  private constructor(id: string, props: ReconstituteOrderProps, isNew: boolean) {
    this.id = id;
    this.tenantId = props.tenantId;
    this.customerId = props.customerId;
    this.bookingRange = props.bookingRange;
    this._notes = props.notes;
    this.createdAt = props.createdAt;
    this._status = props.status;
    this._bookings = [...props.bookings];
    this._orderBundles = [...props.orderBundles];
    this._subtotal = props.subtotal;
    this._totalDiscount = props.totalDiscount;
    this._totalTax = props.totalTax;
    this._grandTotal = props.grandTotal;
    this._updatedAt = props.updatedAt;
    this._isNew = isNew;
  }

  static create(props: CreateOrderProps): Order {
    if (props.bookings.length === 0) {
      throw new Error('An Order must have at least one booking line item.');
    }

    const id = randomUUID();
    const now = new Date();
    const status = BookingStatus.RESERVED;
    const currency = props.currency;

    // Standalone bookings (no bundle): their unitPrice participates in grandTotal.
    // Bundle bookings: their unitPrice is display-only (standalone/crossed-out price).
    // The actual charge for bundle lines comes from OrderBundle.bundlePrice.
    const standaloneSubtotal = props.bookings
      .filter((item) => item.bundleId === null || item.bundleId === undefined)
      .reduce((sum, item) => sum.add(item.unitPrice), Money.zero(currency));

    const bundleSubtotal = props.orderBundles.reduce(
      (sum, bundle) => sum.add(bundle.bundlePrice),
      Money.zero(currency),
    );

    const subtotal = standaloneSubtotal.add(bundleSubtotal);
    const totalDiscount = Money.zero(currency);
    const totalTax = Money.zero(currency);
    const grandTotal = subtotal.subtract(totalDiscount).add(totalTax);

    if (grandTotal.amount.isNegative()) {
      throw new Error('Grand total cannot be negative.');
    }

    const order = new Order(
      id,
      {
        ...props,
        id,
        status,
        subtotal,
        totalDiscount,
        totalTax,
        grandTotal,
        createdAt: now,
        updatedAt: now,
      },
      true,
    );

    // Bind children to this aggregate root
    order._bookings.forEach((item) => item.assignOrderId(id));
    order._orderBundles.forEach((bundle) => bundle.assignOrderId(id));

    return order;
  }

  static reconstitute(props: ReconstituteOrderProps): Order {
    return new Order(props.id, props, false);
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get notes(): string | undefined {
    return this._notes;
  }
  get status(): BookingStatus {
    return this._status;
  }
  get bookings(): BookingItem[] {
    return [...this._bookings];
  }
  get orderBundles(): OrderBundle[] {
    return [...this._orderBundles];
  }
  get subtotal(): Money {
    return this._subtotal;
  }
  get totalDiscount(): Money {
    return this._totalDiscount;
  }
  get totalTax(): Money {
    return this._totalTax;
  }
  get grandTotal(): Money {
    return this._grandTotal;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get isNew(): boolean {
    return this._isNew;
  }

  // ── State Machine ──────────────────────────────────────────────────────────

  /** PENDING_CONFIRMATION → RESERVED */
  confirm(): void {
    this.transition(BookingStatus.RESERVED);
  }

  /** RESERVED → ACTIVE */
  activate(): void {
    this.transition(BookingStatus.ACTIVE);
  }

  /** ACTIVE → COMPLETED */
  complete(): void {
    this.transition(BookingStatus.COMPLETED);
  }

  /** PENDING_CONFIRMATION | RESERVED | ACTIVE → CANCELLED */
  cancel(): void {
    this.transition(BookingStatus.CANCELLED);
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  get isTerminal(): boolean {
    return this._status === BookingStatus.COMPLETED || this._status === BookingStatus.CANCELLED;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private transition(to: BookingStatus): void {
    const allowed = VALID_TRANSITIONS[this._status];

    if (!allowed.includes(to)) {
      throw new Error(`Cannot transition from ${this._status} to ${to}`);
    }

    this._status = to;
    this._updatedAt = new Date();
  }
}
