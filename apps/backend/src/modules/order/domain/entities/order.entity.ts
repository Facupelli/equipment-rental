import { randomUUID } from 'crypto';
import { OrderItem } from './order-item.entity';
import {
  InvalidOrderStatusTransitionException,
  OrderItemNotAllowedException,
  OrderItemNotFoundException,
} from '../exceptions/order.exceptions';
import { OrderStatus } from '@repo/types';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_SOURCING]: [OrderStatus.SOURCED, OrderStatus.CANCELLED],
  [OrderStatus.SOURCED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.ACTIVE, OrderStatus.CANCELLED],
  [OrderStatus.ACTIVE]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export interface CreateOrderProps {
  tenantId: string;
  locationId: string;
  customerId?: string;
  notes?: string;
}

export interface ReconstituteOrderProps {
  id: string;
  tenantId: string;
  locationId: string;
  customerId: string | null;
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
      OrderStatus.PENDING_SOURCING,
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
      props.status,
      props.notes,
      props.items,
    );
  }

  get currentStatus(): OrderStatus {
    return this.status;
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
    if (this.status !== OrderStatus.PENDING_SOURCING) {
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
}
