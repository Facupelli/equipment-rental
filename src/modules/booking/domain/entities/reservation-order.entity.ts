import { ReservationOrderItem } from "./reservation-order-item.entity";

export enum ReservationOrderStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  InProgress = "InProgress",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export const BLOCKING_ORDER_STATUSES = [
  ReservationOrderStatus.Pending,
  ReservationOrderStatus.Confirmed,
  ReservationOrderStatus.InProgress,
];

export class ReservationOrder {
  id: string;
  customerId: string;
  status: ReservationOrderStatus;
  startDatetime: Date;
  endDatetime: Date;
  createdAt: Date;
  updatedAt: Date;
  items: ReservationOrderItem[];

  constructor(partial: Partial<ReservationOrder>) {
    Object.assign(this, partial);
  }

  isBlocking(): boolean {
    return BLOCKING_ORDER_STATUSES.includes(this.status);
  }

  canBeCancelled(): boolean {
    return [
      ReservationOrderStatus.Pending,
      ReservationOrderStatus.Confirmed,
    ].includes(this.status);
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error(`Cannot cancel order with status: ${this.status}`);
    }
    this.status = ReservationOrderStatus.Cancelled;
  }

  confirm(): void {
    if (this.status !== ReservationOrderStatus.Pending) {
      throw new Error("Only pending orders can be confirmed");
    }
    this.status = ReservationOrderStatus.Confirmed;
  }

  startInProgress(): void {
    if (this.status !== ReservationOrderStatus.Confirmed) {
      throw new Error("Only confirmed orders can be started");
    }
    this.status = ReservationOrderStatus.InProgress;
  }

  complete(): void {
    if (this.status !== ReservationOrderStatus.InProgress) {
      throw new Error("Only in-progress orders can be completed");
    }
    this.status = ReservationOrderStatus.Completed;
  }

  getDurationInDays(): number {
    const diffMs = this.endDatetime.getTime() - this.startDatetime.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  getDurationInHours(): number {
    const diffMs = this.endDatetime.getTime() - this.startDatetime.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  overlapsWithDateRange(
    startDatetime: Date,
    endDatetime: Date,
    bufferHours: number = 0
  ): boolean {
    const bufferMs = bufferHours * 60 * 60 * 1000;

    const adjustedStart = new Date(startDatetime.getTime() - bufferMs);
    const adjustedEnd = new Date(endDatetime.getTime() + bufferMs);

    return (
      this.startDatetime <= adjustedEnd && this.endDatetime >= adjustedStart
    );
  }

  isExpired(): boolean {
    return this.endDatetime < new Date();
  }

  canAddItems(): boolean {
    return this.status === ReservationOrderStatus.Pending;
  }

  hasStarted(): boolean {
    return this.startDatetime <= new Date();
  }

  hasEnded(): boolean {
    return this.endDatetime < new Date();
  }
}
