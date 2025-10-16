import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { EquipmentItem } from "src/modules/inventory/domain/models/equipment-item.model";
// biome-ignore lint: /style/useImportType
import { EquipmentItemRepository } from "src/modules/inventory/infrastructure/persistence/typeorm/equipment-item.repository";
import { GetEquipmentItemsByTypeQuery } from "./get-items-by-type.query";

@QueryHandler(GetEquipmentItemsByTypeQuery)
export class GetEquipmentItemsByTypeHandler
	implements IQueryHandler<GetEquipmentItemsByTypeQuery, EquipmentItem[]>
{
	constructor(
		private readonly equipmentItemRepository: EquipmentItemRepository,
	) {}

	async execute(query: GetEquipmentItemsByTypeQuery): Promise<EquipmentItem[]> {
		return this.equipmentItemRepository.findByEquipmentTypeId(
			query.equipmentTypeId,
		);
	}
}
