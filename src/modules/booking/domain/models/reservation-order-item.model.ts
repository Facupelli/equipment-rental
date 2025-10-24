import type { Quote } from "src/modules/pricing/domain/value-objects/quote";
import { Allocation } from "./allocation.model";

export class ReservationOrderItem {
	constructor(
		public readonly id: string,
		public readonly equipmentId: string,
		public readonly quantity: number,
		public readonly priceQuote: Quote,
		public readonly allocations: Allocation[],
	) {}

	static create(
		id: string,
		equipmentId: string,
		quantity: number,
		priceQuote: Quote,
		allocations: Allocation[],
	): ReservationOrderItem {
		return new ReservationOrderItem(
			id,
			equipmentId,
			quantity,
			priceQuote,
			allocations,
		);
	}

	static reconstitute(
		id: string,
		equipmentId: string,
		quantity: number,
		priceQuote: Quote,
		allocations: Allocation[],
	): ReservationOrderItem {
		return new ReservationOrderItem(
			id,
			equipmentId,
			quantity,
			priceQuote,
			allocations,
		);
	}

	allocate(
		equipmentUnitId: string,
		startDate: Date,
		endDate: Date,
	): ReservationOrderItem {
		if (this.allocations.length >= this.quantity) {
			throw new Error("All units for this item are already allocated.");
		}

		const newAllocation = new Allocation(
			crypto.randomUUID(),
			equipmentUnitId,
			startDate,
			endDate,
		);

		return new ReservationOrderItem(
			this.id,
			this.equipmentId,
			this.quantity,
			this.priceQuote,
			[...this.allocations, newAllocation],
		);
	}

	get isFullyAllocated(): boolean {
		return this.allocations.length >= this.quantity;
	}
}
