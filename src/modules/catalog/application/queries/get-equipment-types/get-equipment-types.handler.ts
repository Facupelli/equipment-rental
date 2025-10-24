import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
// biome-ignore lint: /style/useImportType
import { EquipmentTypeRepository } from "src/modules/catalog/infrastructure/persistence/typeorm/equipment-type.repository";
import type { EquipmentTypeResponseDto } from "../../commands/create-equipment-type/create-equipment-type.dto";
import { GetEquipmentTypesQuery } from "./get-equipment-types.query";

const DEFAULT_PAGE_SIZE = 30;

@QueryHandler(GetEquipmentTypesQuery)
export class GetEquipmentTypesHandler
	implements IQueryHandler<GetEquipmentTypesQuery, EquipmentTypeResponseDto[]>
{
	constructor(
		private readonly equipmentTypeRepository: EquipmentTypeRepository,
	) {}

	async execute(
		query: GetEquipmentTypesQuery,
	): Promise<EquipmentTypeResponseDto[]> {
		const equipmentTypes = await this.equipmentTypeRepository.findAll({
			...query,
			page: query.page ?? 1,
			pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
		});
		return equipmentTypes;
	}
}
