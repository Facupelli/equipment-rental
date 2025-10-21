import { Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { QueryBus } from "@nestjs/cqrs";
import { GetTotalCapacityQuery } from "./application/queries/get-total-capacity/get-total-capacity.query";

@Injectable()
export class InventoryFacade {
	constructor(private readonly queryBus: QueryBus) {}

	/* ---------- public contract ---------- */
	async getTotalCapacity(equipmentTypeId: string): Promise<number> {
		return this.queryBus.execute(new GetTotalCapacityQuery(equipmentTypeId));
	}
}
