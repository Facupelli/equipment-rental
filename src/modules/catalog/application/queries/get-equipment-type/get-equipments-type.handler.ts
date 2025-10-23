import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { EquipmentType } from "src/modules/catalog/domain/models/equipment-type.model";
// biome-ignore lint: /style/useImportType
import { EquipmentTypeRepository } from "src/modules/catalog/infrastructure/persistence/typeorm/equipment-type.repository";
import { GetEquipmentTypesQuery } from "./get-equipments-type.query";

const DEFAULT_PAGE_SIZE = 30;

@QueryHandler(GetEquipmentTypesQuery)
export class GetEquipmentTypesHandler
	implements IQueryHandler<GetEquipmentTypesQuery, EquipmentType[]>
{
	constructor(
		private readonly equipmentTypeRepository: EquipmentTypeRepository,
	) {}

	async execute(query: GetEquipmentTypesQuery): Promise<EquipmentType[]> {
		const equipmentTypes = await this.equipmentTypeRepository.findAll({
			...query,
			page: query.page ?? 1,
			pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
		});
		return equipmentTypes;
	}
}
