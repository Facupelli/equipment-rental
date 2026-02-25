import { randomUUID } from 'crypto';
import { BookingLineItem } from '../entities/booking-line-item.entity';
import { Money } from '../value-objects/money.vo';
import { DateRange } from 'src/modules/inventory/domain/value-objects/date-range.vo';
import { BookingStatus } from '@repo/types';

export interface CreateBookingProps {
  tenantId: string;
  customerId: string;
  rentalPeriod: DateRange;
  lineItems: BookingLineItem[];
  currency: string;
  notes?: string;
}

export interface ReconstituteBookingProps {
  id: string;
  tenantId: string;
  customerId: string;
  rentalPeriod: DateRange;
  status: BookingStatus;
  notes?: string;
  lineItems: BookingLineItem[];
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
 * Booking Aggregate Root
 *
 * Owns its LineItems and enforces all booking invariants:
 *  - Must have at least one line item.
 *  - State transitions follow a strict machine (see VALID_TRANSITIONS).
 *  - grandTotal is always derived from lineItems — never set externally.
 *
 * Monetary totals are calculated once in create() and stored as snapshots,
 * matching the DB columns (subtotal, totalDiscount, totalTax, grandTotal).
 */
export class Booking {
  readonly id: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly rentalPeriod: DateRange;
  readonly createdAt: Date;

  private _notes?: string;
  private _status: BookingStatus;
  private _lineItems: BookingLineItem[];
  private _subtotal: Money;
  private _totalDiscount: Money;
  private _totalTax: Money;
  private _grandTotal: Money;
  private _updatedAt: Date;

  private constructor(id: string, props: ReconstituteBookingProps) {
    this.id = id;
    this.tenantId = props.tenantId;
    this.customerId = props.customerId;
    this.rentalPeriod = props.rentalPeriod;
    this._notes = props.notes;
    this.createdAt = props.createdAt;
    this._status = props.status;
    this._lineItems = [...props.lineItems];
    this._subtotal = props.subtotal;
    this._totalDiscount = props.totalDiscount;
    this._totalTax = props.totalTax;
    this._grandTotal = props.grandTotal;
    this._updatedAt = props.updatedAt;
  }

  static create(props: CreateBookingProps): Booking {
    if (props.lineItems.length === 0) {
      throw new Error('A Booking must have at least one line item.');
    }

    const id = randomUUID();
    const now = new Date();

    const hasOverRental = props.lineItems.some((item) => item.isExternallySourced);
    const status = hasOverRental ? BookingStatus.PENDING_CONFIRMATION : BookingStatus.RESERVED;

    const currency = props.currency;

    let subtotal = Money.zero(currency);
    for (const item of props.lineItems) {
      subtotal = subtotal.add(item.lineTotal);
    }

    const totalDiscount = Money.zero(currency);
    const totalTax = Money.zero(currency);
    const grandTotal = subtotal.subtract(totalDiscount).add(totalTax);

    const booking = new Booking(id, {
      ...props,
      id,
      status,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      createdAt: now,
      updatedAt: now,
    });

    // Assign Aggregate Root ID to child entities
    booking._lineItems.forEach((item) => item.assignBookingId(id));

    return booking;
  }

  static reconstitute(props: ReconstituteBookingProps): Booking {
    return new Booking(props.id, props);
  }

  get notes(): string | undefined {
    return this._notes;
  }
  get status(): BookingStatus {
    return this._status;
  }
  get lineItems(): BookingLineItem[] {
    return [...this._lineItems];
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

  // ── State Machine ──────────────────────────────────────────────────────────

  /**
   * Confirms a pending over-rental booking once admin has sourced the equipment.
   * PENDING_CONFIRMATION → RESERVED
   */
  confirm(): void {
    this.transition(BookingStatus.RESERVED);
  }

  /**
   * Marks equipment as picked up by the customer.
   * RESERVED → ACTIVE
   */
  activate(): void {
    this.transition(BookingStatus.ACTIVE);
  }

  /**
   * Marks equipment as returned. Triggers billing downstream via domain event.
   * ACTIVE → COMPLETED
   */
  complete(): void {
    this.transition(BookingStatus.COMPLETED);
  }

  /**
   * Voids the booking. Valid from any non-terminal status.
   * PENDING_CONFIRMATION | RESERVED | ACTIVE → CANCELLED
   */
  cancel(): void {
    this.transition(BookingStatus.CANCELLED);
  }

  // ── Queries ────────────────────────────────────────────────────────────────

  /** True if any line item is an over-rental (no physical item assigned). */
  get hasOverRentalItems(): boolean {
    return this._lineItems.some((item) => item.isOverRental);
  }

  get isTerminal(): boolean {
    return this._status === BookingStatus.COMPLETED || this._status === BookingStatus.CANCELLED;
  }

  private transition(to: BookingStatus): void {
    const allowed = VALID_TRANSITIONS[this._status];

    if (!allowed.includes(to)) {
      throw new Error(`${this._status} cannot transition to ${to}`);
    }

    this._status = to;
    this._updatedAt = new Date();
  }
}
