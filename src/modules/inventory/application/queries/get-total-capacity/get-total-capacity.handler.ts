import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
// biome-ignore lint: /style/useImportType
import { EquipmentItemRepository } from "src/modules/inventory/infrastructure/persistence/typeorm/equipment-item.repository";
import { GetTotalCapacityQuery } from "./get-total-capacity.query";

@QueryHandler(GetTotalCapacityQuery)
export class GetTotalCapacityHandler
	implements IQueryHandler<GetTotalCapacityQuery, number>
{
	constructor(
		private readonly equipmentItemRepository: EquipmentItemRepository,
	) {}

	async execute(query: GetTotalCapacityQuery): Promise<number> {
		const total = await this.equipmentItemRepository.getTotalEquipmentByTypeId(
			query.equipmentTypeId,
		);
		return total;
	}
}
