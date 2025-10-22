import { Body, Controller, Get, Post } from "@nestjs/common";
// biome-ignore lint:reason
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateEquipmentTypeCommand } from "../application/commands/create-equipment-type/create-equipment-type.command";
// biome-ignore lint: /style/useImportType
import  { CreateEquipmentTypeDto } from "../application/commands/create-equipment-type/create-equipment-type.dto";
import { GetEquipmentTypeQuery } from "../application/queries/get-equipment-type/get-equipment-type.query";

@Controller("equipment-types")
export class EquipmentTypeController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Get()
	async getEquipmentTypes(): Promise<string[]> {
		const result = await this.queryBus.execute(new GetEquipmentTypeQuery());

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
