import { randomUUID } from 'crypto';
import { DateRange } from 'src/core/domain/value-objects/date-range.value-object';
import { OrderItem } from './order-item.entity';
import {
  InvalidOrderStatusTransitionException,
  OrderItemNotAllowedException,
  OrderItemNotFoundException,
} from '../exceptions/order.exceptions';
import { OrderStatus } from '@repo/types';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_REVIEW]: [OrderStatus.CONFIRMED, OrderStatus.REJECTED, OrderStatus.EXPIRED],
  [OrderStatus.CONFIRMED]: [OrderStatus.ACTIVE, OrderStatus.CANCELLED],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.EXPIRED]: [],
  [OrderStatus.ACTIVE]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export interface CreateOrderProps {
  tenantId: string;
  locationId: string;
  period: DateRange;
  status: OrderStatus;
  customerId?: string;
  notes?: string;
}

export interface ReconstituteOrderProps {
  id: string;
  tenantId: string;
  locationId: string;
  customerId: string | null;
  period: DateRange;
  status: OrderStatus;
  notes: string | null;
  items: OrderItem[];
}

export class Order {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly locationId: string,
    public readonly customerId: string | null,
    private period: DateRange,
    private status: OrderStatus,
    private notes: string | null,
    private readonly items: OrderItem[],
  ) {}

  static create(props: CreateOrderProps): Order {
    return new Order(
      randomUUID(),
      props.tenantId,
      props.locationId,
      props.customerId ?? null,
      props.period,
      props.status,
      props.notes?.trim() ?? null,
      [],
    );
  }

  static reconstitute(props: ReconstituteOrderProps): Order {
    return new Order(
      props.id,
      props.tenantId,
      props.locationId,
      props.customerId,
      props.period,
      props.status,
      props.notes,
      props.items,
    );
  }

  get currentStatus(): OrderStatus {
    return this.status;
  }

  get currentPeriod(): DateRange {
    return this.period;
  }

  get currentNotes(): string | null {
    return this.notes;
  }

  getItems(): OrderItem[] {
    return [...this.items];
  }

  updateNotes(notes: string | null): void {
    this.notes = notes?.trim() ?? null;
  }

  addItem(item: OrderItem): void {
    if (
      this.status === OrderStatus.ACTIVE ||
      this.status === OrderStatus.COMPLETED ||
      this.status === OrderStatus.CANCELLED
    ) {
      throw new OrderItemNotAllowedException(this.status);
    }
    this.items.push(item);
  }

  removeItem(itemId: string, assetId: string): void {
    const idx = this.items.findIndex((i) => i.id === itemId);
    if (idx === -1) {
      throw new OrderItemNotFoundException(itemId);
    }
    this.items[idx].voidOwnerSplitForAsset(assetId);
    this.items.splice(idx, 1);
  }

  transitionTo(next: OrderStatus): void {
    const allowed = ALLOWED_TRANSITIONS[this.status];
    if (!allowed.includes(next)) {
      throw new InvalidOrderStatusTransitionException(this.status, next);
    }
    this.status = next;
  }

  cancel(): void {
    this.items.forEach((item) => item.voidAllOwnerSplits());
    this.transitionTo(OrderStatus.CANCELLED);
  }

  confirm(): void {
    this.transitionTo(OrderStatus.CONFIRMED);
  }

  reject(): void {
    this.transitionTo(OrderStatus.REJECTED);
  }

  expire(): void {
    this.transitionTo(OrderStatus.EXPIRED);
  }

  activate(): void {
    this.transitionTo(OrderStatus.ACTIVE);
  }

  complete(): void {
    this.transitionTo(OrderStatus.COMPLETED);
  }
}
