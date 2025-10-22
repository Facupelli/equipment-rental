import type { Quote } from "src/modules/pricing/domain/value-objects/quote";
import { Allocation } from "./allocation.model";

export class ReservationOrderItem {
	constructor(
		readonly id: string,
		readonly equipmentId: string,
		readonly quantity: number,
		readonly priceQuote: Quote,
		readonly allocations: Allocation[],
	) {}

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
