import { Body, Controller, Get, Post, Query } from "@nestjs/common";
// biome-ignore lint:reason
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateEquipmentTypeCommand } from "../application/commands/create-equipment-type/create-equipment-type.command";
// biome-ignore lint: /style/useImportType
import { CreateEquipmentTypeDto } from "../application/commands/create-equipment-type/create-equipment-type.dto";
// biome-ignore lint: /style/useImportType
import { GetEquipmentTypesDto, GetEquipmentTypesResponseDto } from "../application/queries/get-equipment-type/get-equipments-type.dto";
import { GetEquipmentTypesQuery } from "../application/queries/get-equipment-type/get-equipments-type.query";

@Controller("equipment-types")
export class EquipmentTypeController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Get()
	async getEquipmentTypes(
		@Query() query: GetEquipmentTypesDto
	): Promise<GetEquipmentTypesResponseDto[]> {
		const result = await this.queryBus.execute(new GetEquipmentTypesQuery(
			query.categoryId,
			query.dateRangeStart,
			query.dateRangeEnd,
			query.sortBy,
			query.sortOrder,
			query.page,
			query.pageSize,
		));
		return result;
	}

	@Post()
  async createEquipmentType(
    @Body() dto: CreateEquipmentTypeDto
  ): Promise<string> {
    const equipmentType = await this.commandBus.execute(new CreateEquipmentTypeCommand(
			dto.name,
      dto.description,
			dto.categoryId,
    ));

    return equipmentType;
  }
}
