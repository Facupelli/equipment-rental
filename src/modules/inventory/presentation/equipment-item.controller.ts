import { Body, Controller, Get, Param, Post } from "@nestjs/common";
// biome-ignore lint:reason
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { RegisterEquipmentCommand } from "../application/commands/register-equipment/register-equipment.command";
import type { RegisterEquipmentDto } from "../application/commands/register-equipment/register-equipment.dto";
import type { GetItemsByTypeDto } from "../application/queries/get-items-by-type/get-items-by-type.dto";
import { GetEquipmentItemsByTypeQuery } from "../application/queries/get-items-by-type/get-items-by-type.query";

@Controller("equipment-items")
export class EquipmentItemController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Post()
  async registerEquipmentItem(
    @Body() dto: RegisterEquipmentDto
  ): Promise<string> {
    const equipmentItem = await this.commandBus.execute(new RegisterEquipmentCommand(
      dto.equipmentTypeId,
      dto.serialNumber,
    ));

    return equipmentItem;
  }

	@Get(':equipmentTypeId/items')
  async getItemsByType(
    @Param() params: GetItemsByTypeDto,
  ) {
    const query = new GetEquipmentItemsByTypeQuery(params.equipmentTypeId);
    return this.queryBus.execute(query);
  }
}
