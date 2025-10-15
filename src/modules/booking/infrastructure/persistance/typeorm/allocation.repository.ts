import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { AllocationEntity } from "./allocation.entity";

@Injectable()
export class AllocationRepository {
	constructor(
      @InjectRepository(AllocationEntity) 
      private readonly repository: Repository<AllocationEntity>
    ) {}

	/**
	 * Check if a specific item has any allocation overlapping the requested date range.
	 *
	 * @param itemId - UUID of the equipment item
	 * @param startDate - Start of requested date range (inclusive)
	 * @param endDate - End of requested date range (inclusive)
	 * @returns true if item is allocated (unavailable), false if no conflicts
	 */
	async isItemAllocatedInRange(
		itemId: string,
		startDate: Date,
		endDate: Date,
	): Promise<boolean> {
		const count = await this.repository
			.createQueryBuilder("allocation")
			.where("allocation.item_id = :itemId", { itemId })
			.andWhere(
				`daterange(allocation.start_date, allocation.end_date, '[]') && 
         daterange(:startDate, :endDate, '[]')`,
				{ startDate, endDate },
			)
			.getCount();

		return count > 0;
	}

	/**
	 * Get all items of a specific equipment type that are NOT allocated during the requested date range.
	 * Returns item IDs that can be booked for this time period.
	 *
	 * @param equipmentTypeId - UUID of the equipment type
	 * @param startDate - Start of requested date range (inclusive)
	 * @param endDate - End of requested date range (inclusive)
	 * @returns Array of available equipment item IDs
	 */
	async getAvailableItemsForDateRange(
		equipmentTypeId: string,
		startDate: Date,
		endDate: Date,
	): Promise<string[]> {
		const items = await this.repository
			.createQueryBuilder()
			.select("item.id")
			.from("inventory.equipment_items", "item")
			.leftJoin(
				"booking.allocations",
				"allocation",
				`allocation.item_id = item.id 
         AND allocation.start_date <= :endDate 
         AND allocation.end_date >= :startDate`,
				{ endDate, startDate },
			)
			.where("item.equipment_type_id = :equipmentTypeId", { equipmentTypeId })
			.andWhere("allocation.allocation_id IS NULL")
			.getRawMany();

		return items.map((row) => row.item_id);
	}

	/**
	 * Get all allocations that overlap with the requested date range for a specific item.
	 * Useful for conflict detection and understanding why an item is unavailable.
	 *
	 * @param itemId - UUID of the equipment item
	 * @param startDate - Start of requested date range (inclusive)
	 * @param endDate - End of requested date range (inclusive)
	 * @returns Array of overlapping allocation entities
	 */
	async getAllocationsOverlappingRange(
		itemId: string,
		startDate: Date,
		endDate: Date,
	): Promise<AllocationEntity[]> {
		return this.repository
			.createQueryBuilder("allocation")
			.where("allocation.item_id = :itemId", { itemId })
			.andWhere("allocation.start_date <= :endDate", { endDate })
			.andWhere("allocation.end_date >= :startDate", { startDate })
			.orderBy("allocation.start_date", "ASC")
			.getMany();
	}

	/**
	 * Get count of available items of a type for a date range. (e.g., "need 5 bicycles").
	 *
	 * @param equipmentTypeId - UUID of the equipment type
	 * @param startDate - Start of requested date range (inclusive)
	 * @param endDate - End of requested date range (inclusive)
	 * @returns Number of available items
	 */
	async countAvailableItemsForDateRange(
		equipmentTypeId: string,
		startDate: Date,
		endDate: Date,
	): Promise<number> {
		const result = await this.repository
			.createQueryBuilder()
			.select("COUNT(DISTINCT item.id)", "count")
			.from("inventory.equipment_items", "item")
			.leftJoin(
				"booking.allocations",
				"allocation",
				`allocation.item_id = item.id 
         AND allocation.start_date <= :endDate 
         AND allocation.end_date >= :startDate`,
				{ endDate, startDate },
			)
			.where("item.equipment_type_id = :equipmentTypeId", { equipmentTypeId })
			.andWhere("allocation.allocation_id IS NULL")
			.getRawOne();

		return parseInt(result.count, 10);
	}
}
