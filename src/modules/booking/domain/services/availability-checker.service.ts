import { Injectable } from "@nestjs/common";
// biome-ignore lint:reason
import { AllocationRepository } from "../../infrastructure/persistance/typeorm/allocation.repository";

interface AvailabilityCheckParams {
	equipmentTypeId: string;
	startDate: Date;
	endDate: Date;
	quantity: number;
	totalInventory: number;
	bufferDays: number;
}

@Injectable()
export class AvailabilityCheckerService {
	constructor(private readonly allocationRepository: AllocationRepository) {}

	async checkAvailability(
		params: AvailabilityCheckParams,
	): Promise<string[] | null> {
		const availableItemIds =
			await this.allocationRepository.getAvailableItemsForDateRange(
				params.equipmentTypeId,
				params.startDate,
				params.endDate,
			);

		const validItemIds = availableItemIds.slice(0, params.totalInventory);

		if (validItemIds.length >= params.quantity) {
			return validItemIds.slice(0, params.quantity);
		}

		return null;
	}
}
