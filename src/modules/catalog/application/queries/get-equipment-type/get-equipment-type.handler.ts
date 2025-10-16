import { type IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import type { EquipmentType } from "src/modules/catalog/domain/models/equipment-type.model";
// biome-ignore lint: /style/useImportType
import { EquipmentTypeRepository } from "src/modules/catalog/infrastructure/persistence/typeorm/equipment-type.repository";
import { GetEquipmentTypeQuery } from "./get-equipment-type.query";

@QueryHandler(GetEquipmentTypeQuery)
export class GetEquipmentTypeHandler
	implements IQueryHandler<GetEquipmentTypeQuery, EquipmentType[]>
{
	constructor(
		private readonly equipmentTypeRepository: EquipmentTypeRepository,
	) {}

	async execute(): Promise<EquipmentType[]> {
		const equipmentTypes = await this.equipmentTypeRepository.findAll();
		return equipmentTypes;
	}
}
