import type { ReservationOrderItem } from "./reservation-order-item.model";

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
	constructor(
		readonly id: string,
		readonly customerId: string,
		readonly items: ReservationOrderItem[],
		readonly status: ReservationOrderStatus,
		readonly totalAmountCents: number,
		readonly createdAt: Date,
	) {}

	confirm() {
		if (this.status !== ReservationOrderStatus.Pending) {
			throw new Error("Only pending orders can be confirmed.");
		}
		if (this.items.length === 0) {
			throw new Error("Cannot confirm an empty order.");
		}
		return new ReservationOrder(
			this.id,
			this.customerId,
			this.items,
			ReservationOrderStatus.Confirmed,
			this.totalAmountCents,
			this.createdAt,
		);
	}

	cancel() {
		if (this.status === ReservationOrderStatus.Cancelled) {
			throw new Error("Order already cancelled.");
		}
		return new ReservationOrder(
			this.id,
			this.customerId,
			this.items,
			ReservationOrderStatus.Cancelled,
			this.totalAmountCents,
			this.createdAt,
		);
	}

	get totalItems(): number {
		return this.items.reduce((acc, item) => acc + item.quantity, 0);
	}
}
